import { t } from './i18n/index.js';

type DetectChangesSummary = {
  changed_files?: number;
  changed_count?: number;
  affected_count?: number;
  risk_level?: string;
};

type ChangedSymbol = {
  type?: string;
  name?: string;
  filePath?: string;
};

type ChangedStep = {
  symbol?: string;
};

type AffectedProcess = {
  name?: string;
  step_count?: number;
  changed_steps?: ChangedStep[];
};

type DetectChangesMetadata = {
  selected_repo?: string;
  selected_repo_id?: string;
  git_repo_path?: string;
  repo_path?: string;
  git_diff_path?: string;
  process_cwd?: string;
  indexed_commit?: string | null;
  current_commit?: string | null;
  stale?: boolean;
  stale_severity?: string;
};

type DetectChangesResult = {
  error?: unknown;
  summary?: DetectChangesSummary;
  changed_symbols?: ChangedSymbol[];
  affected_processes?: AffectedProcess[];
  metadata?: DetectChangesMetadata;
};

function formatMetadata(metadata: DetectChangesMetadata | undefined): string[] {
  if (!metadata) return [];
  const lines: string[] = [t('tool.detectChanges.metadataHeader')];
  if (metadata.selected_repo || metadata.selected_repo_id) {
    lines.push(
      t('tool.detectChanges.metadataRepository', {
        repo: metadata.selected_repo ?? metadata.selected_repo_id ?? '?',
      }),
    );
  }
  const repoPath = metadata.repo_path ?? metadata.git_repo_path;
  if (repoPath) lines.push(t('tool.detectChanges.metadataRepoPath', { path: repoPath }));
  if (metadata.git_diff_path) {
    lines.push(t('tool.detectChanges.metadataDiffPath', { path: metadata.git_diff_path }));
  }
  if (metadata.process_cwd) {
    lines.push(t('tool.detectChanges.metadataCwd', { path: metadata.process_cwd }));
  }
  if (typeof metadata.stale === 'boolean' || metadata.stale_severity) {
    const status = metadata.stale ? 'stale' : 'up-to-date';
    lines.push(t('tool.detectChanges.metadataIndexStatus', { status }));
  }
  if (metadata.indexed_commit || metadata.current_commit) {
    lines.push(
      t('tool.detectChanges.metadataCommits', {
        indexed: metadata.indexed_commit?.slice(0, 12) ?? '?',
        current: metadata.current_commit?.slice(0, 12) ?? '?',
      }),
    );
  }
  lines.push('');
  return lines;
}

export function formatDetectChangesResult(result: unknown): string {
  const payload = (result ?? {}) as DetectChangesResult;
  if (payload.error) return t('common.error', { message: String(payload.error) });

  const summary = payload.summary ?? {};
  const changedFiles = summary.changed_files ?? 0;
  const changedSymbols = summary.changed_count ?? 0;
  const lines: string[] = formatMetadata(payload.metadata);

  if (changedFiles === 0 && changedSymbols === 0) {
    lines.push(t('tool.detectChanges.noChanges'));
    return lines.join('\n').trim();
  }

  lines.push(
    t('tool.detectChanges.changesSummary', {
      files: changedFiles,
      symbols: changedSymbols,
    }),
  );
  lines.push(t('tool.detectChanges.affectedProcesses', { count: summary.affected_count ?? 0 }));
  lines.push(
    t('tool.detectChanges.riskLevel', {
      risk: summary.risk_level || t('tool.detectChanges.unknownRisk'),
    }),
  );
  lines.push('');

  const changed = Array.isArray(payload.changed_symbols) ? payload.changed_symbols : [];
  if (changed.length === 0 && changedSymbols === 0) {
    lines.push(t('tool.detectChanges.noIndexedSymbols'));
    lines.push('');
  }
  if (changed.length > 0) {
    lines.push(t('tool.detectChanges.changedSymbols'));
    const shown = changed.slice(0, 15);
    for (const symbol of shown) {
      lines.push(`  ${symbol.type ?? 'Symbol'} ${symbol.name ?? '?'} → ${symbol.filePath ?? '?'}`);
    }
    // Overflow is measured against the TRUE total (summary.changed_count), not
    // the array length — the array may already be `--limit`-sliced, so using its
    // length would under-report (or hide) how many symbols are not shown.
    const totalChanged = summary.changed_count ?? changed.length;
    if (totalChanged > shown.length) {
      lines.push(t('tool.detectChanges.overflowMore', { count: totalChanged - shown.length }));
    }
    lines.push('');
  }

  const affected = Array.isArray(payload.affected_processes) ? payload.affected_processes : [];
  if (affected.length > 0) {
    lines.push(t('tool.detectChanges.affectedExecutionFlows'));
    const shownAffected = affected.slice(0, 10);
    for (const processInfo of shownAffected) {
      const changedSteps = Array.isArray(processInfo.changed_steps)
        ? processInfo.changed_steps
        : [];
      const steps = changedSteps.map((step) => step.symbol ?? '?').join(', ');
      lines.push(
        `  • ${processInfo.name ?? '?'} (${t('tool.detectChanges.steps', {
          count: processInfo.step_count ?? 0,
        })}) — ${t('tool.detectChanges.changedSteps', { steps })}`,
      );
    }
    const totalAffected = summary.affected_count ?? affected.length;
    if (totalAffected > shownAffected.length) {
      lines.push(
        t('tool.detectChanges.overflowMore', { count: totalAffected - shownAffected.length }),
      );
    }
  }

  return lines.join('\n').trim();
}
