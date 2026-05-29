/**
 * Direct CLI Tool Commands
 *
 * Exposes GitNexus tools (query, context, impact, cypher) as direct CLI commands.
 * Bypasses MCP entirely — invokes LocalBackend directly for minimal overhead.
 *
 * Usage:
 *   gitnexus query "authentication flow"
 *   gitnexus context --name "validateUser"
 *   gitnexus impact --target "AuthService" --direction upstream
 *   gitnexus cypher "MATCH (n:Function) RETURN n.name LIMIT 10"
 *
 * Note: Output goes to stdout via fs.writeSync(fd 1), bypassing LadybugDB's
 * native module which captures the Node.js process.stdout stream during init.
 * See the output() function for details (#324).
 */

import { writeSync } from 'node:fs';
import { LocalBackend } from '../mcp/local/local-backend.js';
import { cliErrorKey } from './cli-message.js';
import { formatDetectChangesResult } from './detect-changes-format.js';

let _backend: LocalBackend | null = null;

async function getBackend(): Promise<LocalBackend> {
  if (_backend) return _backend;
  _backend = new LocalBackend();
  const ok = await _backend.init();
  if (!ok) {
    cliErrorKey('tool.noIndexed');
    process.exit(1);
  }
  return _backend;
}

/**
 * Write tool output to stdout using low-level fd write.
 *
 * LadybugDB's native module captures Node.js process.stdout during init,
 * but the underlying OS file descriptor 1 (stdout) remains intact.
 * By using fs.writeSync(1, ...) we bypass the Node.js stream layer
 * and write directly to the real stdout fd (#324).
 *
 * Falls back to stderr if the fd write fails (e.g., broken pipe).
 */
function output(data: any): void {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  try {
    writeSync(1, text + '\n');
  } catch (err: any) {
    if (err?.code === 'EPIPE') {
      // Consumer closed the pipe (e.g., `gitnexus cypher ... | head -1`)
      // Exit cleanly per Unix convention
      process.exit(0);
    }
    // Fallback: stderr (previous behavior, works on all platforms)
    process.stderr.write(text + '\n');
  }
}

function quoteCommandArg(value: string): string {
  return /^[A-Za-z0-9_./:=@+-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;
}

function stagedDetectCommand(options?: { repo?: string; cwd?: string; worktree?: string }): string {
  const parts = ['gitnexus', 'detect-changes', '--scope', 'staged'];
  if (options?.repo) parts.push('--repo', quoteCommandArg(options.repo));
  if (options?.cwd) parts.push('--cwd', quoteCommandArg(options.cwd));
  if (options?.worktree) parts.push('--worktree', quoteCommandArg(options.worktree));
  return parts.join(' ');
}

function nextActionForVerifyStaged(payload: any): string {
  const metadata = payload?.metadata ?? {};
  const summary = payload?.summary ?? {};
  const changedFiles = Number(summary.changed_files ?? 0);
  const changedSymbols = Number(summary.changed_count ?? 0);
  const risk = String(summary.risk_level ?? '').toLowerCase();

  if (metadata.stale) return 'Refresh the GitNexus index before relying on this result.';
  if (changedFiles === 0 && changedSymbols === 0) return 'No staged changes detected.';
  if (changedFiles > 0 && changedSymbols === 0) {
    return 'Review changed files manually; no indexed symbols matched changed hunks.';
  }
  if (risk === 'high' || risk === 'critical') return 'Review affected processes before commit.';
  return 'Review listed changes before commit.';
}

function normalizeVerifyStagedResult(result: any, options?: { repo?: string; cwd?: string; worktree?: string }) {
  const summary = result?.summary ?? {};
  const changedSymbols = Array.isArray(result?.changed_symbols) ? result.changed_symbols : [];
  const affectedProcesses = Array.isArray(result?.affected_processes) ? result.affected_processes : [];
  const metadata = result?.metadata ?? {};
  const status =
    metadata.stale === true
      ? 'stale'
      : (summary.changed_files ?? 0) === 0 && (summary.changed_count ?? 0) === 0
        ? 'clean'
        : 'review';

  return {
    command: 'verify-staged',
    ok: true,
    status,
    summary,
    metadata,
    changed_symbols: changedSymbols.slice(0, 15),
    affected_processes: affectedProcesses.slice(0, 10),
    truncated: {
      changed_symbols: Math.max(0, changedSymbols.length - 15),
      affected_processes: Math.max(0, affectedProcesses.length - 10),
    },
    next_action: nextActionForVerifyStaged(result),
    suggested_command: stagedDetectCommand(options),
  };
}

function normalizeVerifyStagedError(
  err: unknown,
  options?: { repo?: string; cwd?: string; worktree?: string },
) {
  return {
    command: 'verify-staged',
    ok: false,
    status: 'blocked',
    error: err instanceof Error ? err.message : String(err),
    next_action: 'Fix the error, then retry staged verification.',
    suggested_command: stagedDetectCommand(options),
  };
}

export async function queryCommand(
  queryText: string,
  options?: {
    repo?: string;
    context?: string;
    goal?: string;
    limit?: string;
    content?: boolean;
  },
): Promise<void> {
  if (!queryText?.trim()) {
    cliErrorKey('tool.usage.query');
    process.exit(1);
  }

  const backend = await getBackend();
  const result = await backend.callTool('query', {
    query: queryText,
    task_context: options?.context,
    goal: options?.goal,
    limit: options?.limit ? parseInt(options.limit) : undefined,
    include_content: options?.content ?? false,
    repo: options?.repo,
  });
  output(result);
}

export async function contextCommand(
  name: string,
  options?: {
    repo?: string;
    file?: string;
    uid?: string;
    content?: boolean;
  },
): Promise<void> {
  if (!name?.trim() && !options?.uid) {
    cliErrorKey('tool.usage.context');
    process.exit(1);
  }

  const backend = await getBackend();
  const result = await backend.callTool('context', {
    name: name || undefined,
    uid: options?.uid,
    file_path: options?.file,
    include_content: options?.content ?? false,
    repo: options?.repo,
  });
  output(result);
}

export async function impactCommand(
  target: string,
  options?: {
    direction?: string;
    repo?: string;
    depth?: string;
    includeTests?: boolean;
    limit?: string;
    offset?: string;
    summaryOnly?: boolean;
  },
): Promise<void> {
  if (!target?.trim()) {
    cliErrorKey('tool.usage.impact');
    process.exit(1);
  }

  try {
    const backend = await getBackend();
    const rawLimit = parseInt(options?.limit ?? '', 10);
    const rawOffset = parseInt(options?.offset ?? '', 10);
    const parsedLimit = Number.isFinite(rawLimit) ? rawLimit : undefined;
    const parsedOffset = Number.isFinite(rawOffset) ? rawOffset : undefined;
    const result = await backend.callTool('impact', {
      target,
      direction: options?.direction || 'upstream',
      maxDepth: options?.depth ? parseInt(options.depth, 10) : undefined,
      includeTests: options?.includeTests ?? false,
      repo: options?.repo,
      limit: parsedLimit,
      offset: parsedOffset,
      summaryOnly: options?.summaryOnly ?? undefined,
    });
    output(result);
  } catch (err: unknown) {
    // Belt-and-suspenders: catch infrastructure failures (getBackend, callTool transport)
    // The backend's impact() already returns structured errors for graph query failures
    output({
      error:
        (err instanceof Error ? err.message : String(err)) || 'Impact analysis failed unexpectedly',
      target: { name: target },
      direction: options?.direction || 'upstream',
      suggestion: 'Try reducing --depth or using gitnexus context <symbol> as a fallback',
    });
    process.exit(1);
  }
}

export async function cypherCommand(
  query: string,
  options?: {
    repo?: string;
  },
): Promise<void> {
  if (!query?.trim()) {
    cliErrorKey('tool.usage.cypher');
    process.exit(1);
  }

  const backend = await getBackend();
  const result = await backend.callTool('cypher', {
    query,
    repo: options?.repo,
  });
  output(result);
}

export async function detectChangesCommand(options?: {
  scope?: string;
  baseRef?: string;
  repo?: string;
  cwd?: string;
  worktree?: string;
}): Promise<void> {
  const backend = await getBackend();
  try {
    const result = await backend.callTool('detect_changes', {
      scope: options?.scope || 'unstaged',
      base_ref: options?.baseRef,
      repo: options?.repo,
      cwd: options?.cwd,
      worktree: options?.worktree,
    });
    output(formatDetectChangesResult(result));
  } catch (err) {
    process.exitCode = 1;
    output(formatDetectChangesResult({ error: err instanceof Error ? err.message : String(err) }));
  }
}

export async function verifyStagedCommand(options?: {
  repo?: string;
  cwd?: string;
  worktree?: string;
  json?: boolean;
}): Promise<void> {
  const backend = await getBackend();
  const callParams = {
    scope: 'staged',
    base_ref: undefined,
    repo: options?.repo,
    cwd: options?.cwd,
    worktree: options?.worktree,
  };

  try {
    const result = await backend.callTool('detect_changes', callParams);
    if (result && typeof result === 'object' && 'error' in result && (result as any).error) {
      process.exitCode = 1;
      const errorPayload = normalizeVerifyStagedError((result as any).error, options);
      output(options?.json ? errorPayload : formatDetectChangesResult({ error: errorPayload.error }));
      return;
    }
    output(options?.json ? normalizeVerifyStagedResult(result, options) : formatDetectChangesResult(result));
  } catch (err) {
    process.exitCode = 1;
    const errorPayload = normalizeVerifyStagedError(err, options);
    output(options?.json ? errorPayload : formatDetectChangesResult({ error: errorPayload.error }));
  }
}
