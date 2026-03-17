/**
 * Setup Command
 * 
 * One-time global MCP configuration writer.
 * Detects installed AI editors and writes the appropriate MCP config
 * so the GitNexus MCP server is available in all projects.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createClaudeCodeAdapter } from './host-adapters/claude-code.js';
import { createCodexAdapter } from './host-adapters/codex.js';
import { createCursorAdapter } from './host-adapters/cursor.js';
import { createGenericStdioAdapter } from './host-adapters/generic-stdio.js';
import { dirExists, readJsonFile, writeJsonFile } from './host-adapters/shared.js';
import { getGlobalDir } from '../storage/repo-manager.js';
import type { HostAdapter } from './host-adapters/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SetupResult {
  configured: string[];
  manual: Array<{ name: string; steps: string[] }>;
  skipped: string[];
  errors: string[];
}

export interface HostSetupPlan {
  adapter: HostAdapter;
  checkConfigured: () => Promise<boolean>;
  needsManualConfig: boolean;
}

async function hasConfiguredServer(configPath: string, segments: string[]): Promise<boolean> {
  const config = await readJsonFile(configPath);
  let current: any = config;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return false;
    }
    current = current[segment];
  }

  return Boolean(current && typeof current === 'object' && current.gitnexus);
}

async function hasConfiguredTomlTable(configPath: string, tableName: string): Promise<boolean> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tablePattern = new RegExp(`^\\s*\\[\\s*${escaped}\\s*\\]\\s*$`, 'm');
    return tablePattern.test(content);
  } catch {
    return false;
  }
}

export function getHostPlans(options?: { homeDir?: string; repoPath?: string }): HostSetupPlan[] {
  const homeDir = options?.homeDir ?? os.homedir();
  const repoPath = options?.repoPath ?? process.cwd();
  const openCodeConfigPath = path.join(homeDir, '.config', 'opencode', 'config.json');
  const cursorConfigPath = path.join(homeDir, '.cursor', 'mcp.json');
  const claudeConfigPath = path.join(repoPath, '.mcp.json');
  const claudeGlobalConfigPath = path.join(homeDir, '.claude.json');
  const codexConfigPath = path.join(homeDir, '.codex', 'config.toml');

  return [
    {
      adapter: createCursorAdapter({ homeDir }),
      checkConfigured: async () => hasConfiguredServer(cursorConfigPath, ['mcpServers']),
      needsManualConfig: false,
    },
    {
      adapter: createClaudeCodeAdapter({ homeDir }),
      checkConfigured: async () =>
        (await hasConfiguredServer(claudeConfigPath, ['mcpServers']))
        || (await hasConfiguredServer(claudeGlobalConfigPath, ['mcpServers'])),
      needsManualConfig: true,
    },
    {
      adapter: createGenericStdioAdapter({
        id: 'opencode',
        displayName: 'OpenCode',
        detectPath: path.join(homeDir, '.config', 'opencode'),
        configPath: openCodeConfigPath,
        serverContainerPath: ['mcp'],
      }),
      checkConfigured: async () => hasConfiguredServer(openCodeConfigPath, ['mcp']),
      needsManualConfig: false,
    },
    {
      adapter: createCodexAdapter({ homeDir }),
      checkConfigured: async () => hasConfiguredTomlTable(codexConfigPath, 'mcp_servers.gitnexus'),
      needsManualConfig: true,
    },
  ];
}

/**
 * Install GitNexus skills to ~/.claude/skills/ for Claude Code.
 */
async function installClaudeCodeSkills(result: SetupResult): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude');
  if (!(await dirExists(claudeDir))) return;

  const skillsDir = path.join(claudeDir, 'skills');
  try {
    const installed = await installSkillsTo(skillsDir);
    if (installed.length > 0) {
      result.configured.push(`Claude Code skills (${installed.length} skills → ~/.claude/skills/)`);
    }
  } catch (err: any) {
    result.errors.push(`Claude Code skills: ${err.message}`);
  }
}

/**
 * Install GitNexus hooks to ~/.claude/settings.json for Claude Code.
 * Merges hook config without overwriting existing hooks.
 */
async function installClaudeCodeHooks(result: SetupResult): Promise<void> {
  const claudeDir = path.join(os.homedir(), '.claude');
  if (!(await dirExists(claudeDir))) return;

  const settingsPath = path.join(claudeDir, 'settings.json');

  // Source hooks bundled within the gitnexus package (hooks/claude/)
  const pluginHooksPath = path.join(__dirname, '..', '..', 'hooks', 'claude');

  // Copy unified hook script to ~/.claude/hooks/gitnexus/
  const destHooksDir = path.join(claudeDir, 'hooks', 'gitnexus');

  try {
    await fs.mkdir(destHooksDir, { recursive: true });

    const src = path.join(pluginHooksPath, 'gitnexus-hook.cjs');
    const dest = path.join(destHooksDir, 'gitnexus-hook.cjs');
    try {
      let content = await fs.readFile(src, 'utf-8');
      // Inject resolved CLI path so the copied hook can find the CLI
      // even when it's no longer inside the npm package tree
      const resolvedCli = path.join(__dirname, '..', 'cli', 'index.js');
      const normalizedCli = path.resolve(resolvedCli).replace(/\\/g, '/');
      const jsonCli = JSON.stringify(normalizedCli);
      content = content.replace(
        "let cliPath = path.resolve(__dirname, '..', '..', 'dist', 'cli', 'index.js');",
        `let cliPath = ${jsonCli};`
      );
      await fs.writeFile(dest, content, 'utf-8');
    } catch {
      // Script not found in source — skip
    }

    const hookPath = path.join(destHooksDir, 'gitnexus-hook.cjs').replace(/\\/g, '/');
    const hookCmd = `node "${hookPath.replace(/"/g, '\\"')}"`;

    // Merge hook config into ~/.claude/settings.json
    const existing = await readJsonFile(settingsPath) || {};
    if (!existing.hooks) existing.hooks = {};

    // NOTE: SessionStart hooks are broken on Windows (Claude Code bug #23576).
    // Session context is delivered via CLAUDE.md / skills instead.

    // Helper: add a hook entry if one with 'gitnexus-hook' isn't already registered
    interface HookEntry { hooks?: Array<{ command?: string }> }
    function ensureHookEntry(
      eventName: string,
      matcher: string,
      timeout: number,
      statusMessage: string,
    ) {
      if (!existing.hooks[eventName]) existing.hooks[eventName] = [];
      const hasHook = existing.hooks[eventName].some(
        (h: HookEntry) => h.hooks?.some(hh => hh.command?.includes('gitnexus-hook'))
      );
      if (!hasHook) {
        existing.hooks[eventName].push({
          matcher,
          hooks: [{ type: 'command', command: hookCmd, timeout, statusMessage }],
        });
      }
    }

    ensureHookEntry('PreToolUse', 'Grep|Glob|Bash', 10, 'Enriching with GitNexus graph context...');
    ensureHookEntry('PostToolUse', 'Bash', 10, 'Checking GitNexus index freshness...');

    await writeJsonFile(settingsPath, existing);
    result.configured.push('Claude Code hooks (PreToolUse, PostToolUse)');
  } catch (err: any) {
    result.errors.push(`Claude Code hooks: ${err.message}`);
  }
}

// ─── Skill Installation ───────────────────────────────────────────

const SKILL_NAMES = ['gitnexus-exploring', 'gitnexus-debugging', 'gitnexus-impact-analysis', 'gitnexus-refactoring', 'gitnexus-guide', 'gitnexus-cli'];

/**
 * Install GitNexus skills to a target directory.
 * Each skill is installed as {targetDir}/gitnexus-{skillName}/SKILL.md
 * following the Agent Skills standard (both Cursor and Claude Code).
 *
 * Supports two source layouts:
 *   - Flat file:  skills/{name}.md           → copied as SKILL.md
 *   - Directory:  skills/{name}/SKILL.md     → copied recursively (includes references/, etc.)
 */
async function installSkillsTo(targetDir: string): Promise<string[]> {
  const installed: string[] = [];
  const skillsRoot = path.join(__dirname, '..', '..', 'skills');

  for (const skillName of SKILL_NAMES) {
    const skillDir = path.join(targetDir, skillName);

    try {
      // Try directory-based skill first (skills/{name}/SKILL.md)
      const dirSource = path.join(skillsRoot, skillName);
      const dirSkillFile = path.join(dirSource, 'SKILL.md');

      let isDirectory = false;
      try {
        const stat = await fs.stat(dirSource);
        isDirectory = stat.isDirectory();
      } catch { /* not a directory */ }

      if (isDirectory) {
        await copyDirRecursive(dirSource, skillDir);
        installed.push(skillName);
      } else {
        // Fall back to flat file (skills/{name}.md)
        const flatSource = path.join(skillsRoot, `${skillName}.md`);
        const content = await fs.readFile(flatSource, 'utf-8');
        await fs.mkdir(skillDir, { recursive: true });
        await fs.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf-8');
        installed.push(skillName);
      }
    } catch {
      // Source skill not found — skip
    }
  }

  return installed;
}

/**
 * Recursively copy a directory tree.
 */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Install global Cursor skills to ~/.cursor/skills/gitnexus/
 */
async function installCursorSkills(result: SetupResult): Promise<void> {
  const cursorDir = path.join(os.homedir(), '.cursor');
  if (!(await dirExists(cursorDir))) return;
  
  const skillsDir = path.join(cursorDir, 'skills');
  try {
    const installed = await installSkillsTo(skillsDir);
    if (installed.length > 0) {
      result.configured.push(`Cursor skills (${installed.length} skills → ~/.cursor/skills/)`);
    }
  } catch (err: any) {
    result.errors.push(`Cursor skills: ${err.message}`);
  }
}

/**
 * Install global OpenCode skills to ~/.config/opencode/skill/gitnexus/
 */
async function installOpenCodeSkills(result: SetupResult): Promise<void> {
  const opencodeDir = path.join(os.homedir(), '.config', 'opencode');
  if (!(await dirExists(opencodeDir))) return;
  
  const skillsDir = path.join(opencodeDir, 'skill');
  try {
    const installed = await installSkillsTo(skillsDir);
    if (installed.length > 0) {
      result.configured.push(`OpenCode skills (${installed.length} skills → ~/.config/opencode/skill/)`);
    }
  } catch (err: any) {
    result.errors.push(`OpenCode skills: ${err.message}`);
  }
}

// ─── Main command ──────────────────────────────────────────────────

export const setupCommand = async () => {
  console.log('');
  console.log('  GitNexus Setup');
  console.log('  ==============');
  console.log('');

  // Ensure global directory exists
  const globalDir = getGlobalDir();
  await fs.mkdir(globalDir, { recursive: true });

  const result: SetupResult = {
    configured: [],
    manual: [],
    skipped: [],
    errors: [],
  };

  const hostPlans = getHostPlans();

  for (const { adapter } of hostPlans) {
    const setup = await adapter.configure();
    if (setup.status === 'configured' && setup.message) {
      result.configured.push(setup.message);
    } else if (setup.status === 'manual') {
      result.manual.push({
        name: setup.message ?? adapter.displayName,
        steps: setup.manualSteps ?? adapter.manualInstructions(),
      });
    } else if (setup.status === 'skipped' && setup.message) {
      result.skipped.push(setup.message);
    } else if (setup.status === 'error' && setup.message) {
      result.errors.push(setup.message);
    }
  }
  
  // Install global skills for platforms that support them
  await installClaudeCodeSkills(result);
  await installClaudeCodeHooks(result);
  await installCursorSkills(result);
  await installOpenCodeSkills(result);

  // Print results
  if (result.configured.length > 0) {
    console.log('  Configured:');
    for (const name of result.configured) {
      console.log(`    + ${name}`);
    }
  }

  if (result.manual.length > 0) {
    console.log('');
    console.log('  Manual steps required:');
    for (const entry of result.manual) {
      console.log(`    ~ ${entry.name}`);
      for (const step of entry.steps) {
        console.log(`      ${step}`);
      }
    }
  }

  if (result.skipped.length > 0) {
    console.log('');
    console.log('  Skipped:');
    for (const name of result.skipped) {
      console.log(`    - ${name}`);
    }
  }

  if (result.errors.length > 0) {
    console.log('');
    console.log('  Errors:');
    for (const err of result.errors) {
      console.log(`    ! ${err}`);
    }
  }

  console.log('');
  console.log('  Summary:');
  console.log(`    MCP configured for: ${result.configured.filter(c => !c.includes('skills') && !c.includes('hooks')).join(', ') || 'none'}`);
  console.log(`    MCP manual steps: ${result.manual.map(entry => entry.name).join(', ') || 'none'}`);
  console.log(`    Skills installed to: ${result.configured.filter(c => c.includes('skills')).length > 0 ? result.configured.filter(c => c.includes('skills')).join(', ') : 'none'}`);
  console.log('');
  console.log('  Next steps:');
  console.log('    1. cd into any git repo');
  console.log('    2. Run: gitnexus analyze');
  console.log('    3. Open the repo in your editor — MCP is ready!');
  console.log('');
};
