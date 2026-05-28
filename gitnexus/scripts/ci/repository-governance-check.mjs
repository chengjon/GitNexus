import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const EXCLUDED_PATH_PREFIXES = [
  'docs/',
  'tmp_exports/',
  '.sisyphus/',
  '.worktrees/',
  '.git/',
  '.gitnexus/',
  '.claude/skills/generated/',
];

const FIXTURE_PATH_MARKERS = ['/test/fixtures/', '/fixtures/', '/samples/', '/sample/'];

const TEMPORARY_FILENAME_PATTERNS = [
  /^copy(?:$|[_\-. ])/i,
  /^old_/,
  /^temp_/,
  /^tmp_/,
  /_bak\.[^/]+$/i,
  /_backup\.[^/]+$/i,
];

const REQUIRED_PR_METRIC_LABELS = ['Measured:', 'Inferred:', 'Historical Baseline:'];

const EMPTY_METRIC_VALUE_PATTERNS = [/^\s*(?:n\/a|na|none)\s*$/i];

const REQUIRED_PR_GOVERNANCE_LABELS = [
  'Canonical Path:',
  'Compatibility Layer / Shim:',
  'Exit Condition:',
  'Deletion Reachability:',
  'GitNexus Evidence:',
];

const DEVELOPMENT_RULES_ENTRYPOINT_EXEMPT_PATHS = new Set(['CHANGELOG.md', 'DEVELOPMENT_RULES.md']);

const GITNEXUS_EVIDENCE_PATTERNS = [
  /gitnexus_impact/i,
  /gitnexus_context/i,
  /gitnexus_query/i,
  /gitnexus_detect_changes/i,
  /gitnexus:\/\/repo\//i,
  /\bgitnexus\s+(?:impact|context|query|path|process|resource)\b/i,
];

const DELETION_REACHABILITY_COVERAGE_PATTERNS = [
  { label: 'feature-tree', patterns: [/feature[- ]?tree\s*:/i, /product\s+surface\s*:/i] },
  { label: 'runtime', patterns: [/runtime\s*:/i, /entrypoint[s]?\s*:/i, /handler[s]?\s*:/i] },
  { label: 'scripts', patterns: [/script[s]?\s*:/i, /automation\s*:/i, /operator\s*:/i] },
  { label: 'config', patterns: [/config\s*:/i, /flag[s]?\s*:/i, /env(?:ironment)?\s*:/i] },
  { label: 'tests', patterns: [/test[s]?\s*:/i, /fixture[s]?\s*:/i, /contract[s]?\s*:/i] },
];

const MECHANICAL_SPLIT_BENEFIT_PATTERNS = [
  /ownership boundaries?/i,
  /call[- ]path clarity/i,
  /testability/i,
  /change safety/i,
];

const PLACEHOLDER_EXIT_CONDITION_PATTERNS = [
  /\btbd\b/i,
  /\btodo\b/i,
  /\blater\b/i,
  /\bfollow[- ]?up\b/i,
  /\bfor safety\b/i,
  /\bcleanup later\b/i,
  /\bafter launch\b/i,
];

const PLACEHOLDER_CLEANUP_TRACKING_PATTERNS = [
  ...PLACEHOLDER_EXIT_CONDITION_PATTERNS,
  /^\s*(?:n\/a|na|none)\s*$/i,
  /\bsame pr\b/i,
  /\bunknown\b/i,
];

const CONCRETE_CLEANUP_TRACKING_PATTERNS = [
  /\bGNX-\d+\b/i,
  /\bissue\s+#?[A-Za-z0-9._-]+\b/i,
  /\bmilestone\s+[A-Za-z0-9._-]+\b/i,
  /\btask\s+[A-Za-z0-9._-]+\b/i,
];

const PLACEHOLDER_DIRECT_CUTOVER_RISK_PATTERNS = [
  ...PLACEHOLDER_EXIT_CONDITION_PATTERNS,
  /^\s*(?:n\/a|na|none)\s*$/i,
  /\bunknown\b/i,
];

const PLACEHOLDER_TEMP_SCRIPT_PURPOSE_PATTERNS = [
  /^\s*(?:temporary|temp)\s+(?:helper|script|tool)\s*$/i,
  /^\s*(?:debug|migration|migrate|cutover|backfill)\s+(?:helper|script|tool)\s*$/i,
  /^\s*(?:helper|script|tool)\s*$/i,
];

const COMPATIBILITY_PATH_PATTERNS = [/shim/i, /compat/i, /_v2\.[^/]+$/i, /_new\.[^/]+$/i];

const REQUIRED_COMPATIBILITY_FILE_MARKERS = [
  {
    rule: 'compat-file-canonical-path',
    pattern: /CANONICAL PATH:/i,
    message:
      'Compatibility-like files added in managed paths must declare `CANONICAL PATH:` in the file body.',
  },
  {
    rule: 'compat-file-direct-cutover-risk',
    pattern: /DIRECT CUTOVER RISK:/i,
    message:
      'Compatibility-like files added in managed paths must declare `DIRECT CUTOVER RISK:` in the file body.',
  },
  {
    rule: 'compat-file-exit-condition',
    pattern: /EXIT CONDITION:/i,
    message:
      'Compatibility-like files added in managed paths must declare `EXIT CONDITION:` in the file body.',
  },
  {
    rule: 'compat-file-cleanup-tracking',
    pattern: /CLEANUP TRACKING:/i,
    message:
      'Compatibility-like files added in managed paths must declare `CLEANUP TRACKING:` in the file body.',
  },
];

const TEMPORARY_SCRIPT_NAME_PATTERNS = [
  /(?:^|[-_.])debug(?:[-_.]|$)/i,
  /(?:^|[-_.])migration(?:[-_.]|$)/i,
  /(?:^|[-_.])migrate(?:[-_.]|$)/i,
  /(?:^|[-_.])backfill(?:[-_.]|$)/i,
  /(?:^|[-_.])cutover(?:[-_.]|$)/i,
];

const TEMPORARY_MIGRATION_SCRIPT_NAME_PATTERNS = [
  /(?:^|[-_.])migration(?:[-_.]|$)/i,
  /(?:^|[-_.])migrate(?:[-_.]|$)/i,
  /(?:^|[-_.])backfill(?:[-_.]|$)/i,
  /(?:^|[-_.])cutover(?:[-_.]|$)/i,
];

const SCRIPT_FILE_EXTENSION_PATTERN = /\.(?:[cm]?js|mjs|cjs|ts|tsx|sh|py|bash|zsh)$/i;
const TEMPORARY_SCRIPT_GENERIC_TOKENS = new Set([
  'debug',
  'migration',
  'migrate',
  'backfill',
  'cutover',
]);

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function isExcludedPath(filePath) {
  return EXCLUDED_PATH_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function isFixtureLikePath(filePath) {
  return FIXTURE_PATH_MARKERS.some((marker) => filePath.includes(marker));
}

function isScriptDirectoryPath(filePath) {
  return filePath.startsWith('scripts/') || filePath.includes('/scripts/');
}

function hasTemporaryFilename(filePath) {
  const baseName = path.posix.basename(filePath);
  return TEMPORARY_FILENAME_PATTERNS.some((pattern) => pattern.test(baseName));
}

function isDeveloperFacingMarkdownEntrypoint(filePath) {
  const normalizedPath = normalizePath(filePath);
  if (!normalizedPath.endsWith('.md')) {
    return false;
  }

  if (DEVELOPMENT_RULES_ENTRYPOINT_EXEMPT_PATHS.has(normalizedPath)) {
    return false;
  }

  if (!normalizedPath.includes('/')) {
    return true;
  }

  return /^(docs|eval|gitnexus)\/[^/]+\.md$/i.test(normalizedPath);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readBulletValue(content, label) {
  const match = content.match(new RegExp(`^-\\s+${escapeRegExp(label)}[ \\t]*(.*)$`, 'mi'));
  return match?.[1]?.trim() ?? '';
}

function readMarkerValue(content, label) {
  const match = content.match(new RegExp(`${escapeRegExp(label)}[ \\t]*(.*)$`, 'mi'));
  return match?.[1]?.trim() ?? '';
}

function readSection(content, heading) {
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'm');
  const match = headingPattern.exec(content);
  if (!match) {
    return '';
  }

  const sectionStart = match.index + match[0].length;
  const remainder = content.slice(sectionStart).replace(/^\n/, '');
  const nextHeading = /^##\s+/m.exec(remainder);
  if (!nextHeading || nextHeading.index === undefined) {
    return remainder;
  }

  return remainder.slice(0, nextHeading.index);
}

function hasValue(value) {
  return value.trim().length > 0;
}

function hasMeaningfulMetricValue(value) {
  if (!hasValue(value)) {
    return false;
  }

  return !EMPTY_METRIC_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

function hasMetricContext(value) {
  return /\bscope\s*:/i.test(value) && /\btime\s*:/i.test(value);
}

function hasGitNexusEvidence(value) {
  return GITNEXUS_EVIDENCE_PATTERNS.some((pattern) => pattern.test(value));
}

function hasDevelopmentRulesAnchor(content) {
  return /DEVELOPMENT_RULES\.md/.test(String(content ?? ''));
}

function hasMarkdownEntrypointChecklist(section) {
  const content = String(section ?? '');
  return (
    /developer-facing markdown entrypoint/i.test(content) &&
    /DEVELOPMENT_RULES\.md/.test(content) &&
    /(docs\/|eval\/|gitnexus\/)/.test(content)
  );
}

function collectPathReferenceNeedles(values) {
  const needles = new Set();

  for (const value of values) {
    const normalizedValue = normalizePath(value ?? '');
    if (!normalizedValue) continue;

    needles.add(normalizedValue.toLowerCase());
    needles.add(path.posix.basename(normalizedValue).toLowerCase());
  }

  return [...needles].filter(Boolean);
}

function hasPathReference(value, paths) {
  const haystack = normalizePath(value ?? '').toLowerCase();
  const needles = collectPathReferenceNeedles(paths);
  return needles.some((needle) => haystack.includes(needle));
}

function hasRepoRelativePathReference(value, paths) {
  const haystack = normalizePath(value ?? '').toLowerCase();
  return paths
    .map((candidate) => normalizePath(candidate ?? ''))
    .filter((candidate) => candidate.includes('/'))
    .some((candidate) => haystack.includes(candidate.toLowerCase()));
}

function hasDeletionReachabilityCoverage(value) {
  return DELETION_REACHABILITY_COVERAGE_PATTERNS.every((group) =>
    group.patterns.some((pattern) => pattern.test(value)),
  );
}

function tokenizePathLikeValues(value) {
  return String(value ?? '')
    .split(/[\s,;]+/)
    .map((token) => token.replace(/^[("'`]+|[)"'`]+$/g, '').trim())
    .filter(Boolean)
    .map((token) => normalizePath(token))
    .filter(
      (token) =>
        token.includes('/') || token.includes('.') || token.includes('_') || token.includes('-'),
    );
}

function extractUniquePathLikeValues(value) {
  const unique = new Map();
  for (const token of tokenizePathLikeValues(value)) {
    const normalized = token.toLowerCase();
    if (!unique.has(normalized)) {
      unique.set(normalized, token);
    }
  }
  return [...unique.values()];
}

function canonicalPathReferencesCompatibilityLayer(value) {
  return tokenizePathLikeValues(value).some((token) => isCompatibilityLikePath(token));
}

function canonicalPathReferencesTemporaryScript(value) {
  return tokenizePathLikeValues(value).some((token) => isTemporaryScriptLikePath(token));
}

function canonicalPathHasMultipleTargets(value) {
  return extractUniquePathLikeValues(value).length > 1;
}

function canonicalPathHasRepoRelativeTarget(value) {
  return extractUniquePathLikeValues(value).some((token) => token.includes('/'));
}

function isPlaceholderExitCondition(value) {
  return PLACEHOLDER_EXIT_CONDITION_PATTERNS.some((pattern) => pattern.test(value));
}

function isPlaceholderCleanupTracking(value) {
  return PLACEHOLDER_CLEANUP_TRACKING_PATTERNS.some((pattern) => pattern.test(value));
}

function hasConcreteCleanupTrackingReference(value) {
  return CONCRETE_CLEANUP_TRACKING_PATTERNS.some((pattern) => pattern.test(value));
}

function isPlaceholderDirectCutoverRisk(value) {
  return PLACEHOLDER_DIRECT_CUTOVER_RISK_PATTERNS.some((pattern) => pattern.test(value));
}

function isPlaceholderTempScriptPurpose(value) {
  return PLACEHOLDER_TEMP_SCRIPT_PURPOSE_PATTERNS.some((pattern) => pattern.test(value));
}

function parseMigrationStatusKind(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return null;
  }

  if (/^(complete)\b/.test(normalized)) {
    return 'complete';
  }

  if (/^(transitional|partial|in progress)\b/.test(normalized)) {
    return 'transitional';
  }

  if (/^(n\/a|na|none)\b/.test(normalized)) {
    return 'na';
  }

  return null;
}

function collectCompatibilityTargets(changedFiles) {
  return changedFiles
    .filter((entry) => touchesCompatibilityLikePath(entry))
    .flatMap((entry) => getEntryPaths(entry))
    .filter((filePath) => isManagedPath(filePath) && isCompatibilityLikePath(filePath));
}

function getEntryPaths(entry) {
  return [entry.path, entry.previousPath]
    .map((filePath) => normalizePath(filePath ?? ''))
    .filter(Boolean);
}

function touchesManagedPath(entry) {
  return getEntryPaths(entry).some((filePath) => isManagedPath(filePath));
}

function touchesCompatibilityLikePath(entry) {
  return getEntryPaths(entry).some(
    (filePath) => isManagedPath(filePath) && isCompatibilityLikePath(filePath),
  );
}

function removesManagedPath(entry) {
  if (entry.status.startsWith('D')) {
    return isManagedPath(entry.path);
  }

  if (entry.status.startsWith('R')) {
    return entry.previousPath.length > 0 && isManagedPath(entry.previousPath);
  }

  return false;
}

function isManagedPath(filePath) {
  return !isExcludedPath(filePath) && !isFixtureLikePath(filePath);
}

function isCompatibilityLikePath(filePath) {
  const baseName = path.posix.basename(filePath);
  return COMPATIBILITY_PATH_PATTERNS.some((pattern) => pattern.test(baseName));
}

function hasTemporaryScriptLikeFilename(filePath) {
  const baseName = path.posix.basename(filePath);
  return (
    SCRIPT_FILE_EXTENSION_PATTERN.test(baseName) &&
    TEMPORARY_SCRIPT_NAME_PATTERNS.some((pattern) => pattern.test(baseName))
  );
}

function isTemporaryScriptLikePath(filePath) {
  return isScriptDirectoryPath(filePath) && hasTemporaryScriptLikeFilename(filePath);
}

function isTemporaryMigrationScriptLikePath(filePath) {
  const baseName = path.posix.basename(filePath);
  return (
    isScriptDirectoryPath(filePath) &&
    SCRIPT_FILE_EXTENSION_PATTERN.test(baseName) &&
    TEMPORARY_MIGRATION_SCRIPT_NAME_PATTERNS.some((pattern) => pattern.test(baseName))
  );
}

function hasSpecificTemporaryScriptName(filePath) {
  const baseName = path.posix.basename(filePath).replace(SCRIPT_FILE_EXTENSION_PATTERN, '');
  const tokens = baseName
    .split(/[-_.\s]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  return tokens.some((token) => !TEMPORARY_SCRIPT_GENERIC_TOKENS.has(token));
}

export function findManagedPathViolations(paths) {
  return paths
    .map(normalizePath)
    .filter(Boolean)
    .filter((filePath) => !isExcludedPath(filePath))
    .filter((filePath) => !isFixtureLikePath(filePath))
    .flatMap((filePath) => {
      const violations = [];

      if (hasTemporaryFilename(filePath)) {
        violations.push({
          rule: 'temporary-filename',
          path: filePath,
          message: `Temporary or backup-style filename is not allowed in managed paths: ${filePath}`,
        });
      }

      if (!isScriptDirectoryPath(filePath) && hasTemporaryScriptLikeFilename(filePath)) {
        violations.push({
          rule: 'temporary-script-location',
          path: filePath,
          message: `Temporary migration/debug scripts must live in a managed scripts/ path, not: ${filePath}`,
        });
      }

      if (isTemporaryScriptLikePath(filePath) && !hasSpecificTemporaryScriptName(filePath)) {
        violations.push({
          rule: 'temporary-script-name-specificity',
          path: filePath,
          message: `Temporary migration/debug scripts in managed scripts/ paths must use an exact-purpose filename, not a generic name such as debug, migration, backfill, or cutover alone: ${filePath}`,
        });
      }

      return violations;
    });
}

export function parseChangedFilesOutput(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('\t').filter(Boolean);
      const status = parts[0] ?? 'M';
      const previousPath = status.startsWith('R') ? normalizePath(parts[1] ?? '') : '';
      const pathValue = status.startsWith('R') ? (parts[2] ?? parts[1] ?? '') : (parts[1] ?? '');
      const normalizedPath = normalizePath(pathValue);
      return {
        status,
        ...(previousPath ? { previousPath } : {}),
        path: normalizedPath,
      };
    })
    .filter((entry) => entry.path.length > 0 || (entry.previousPath?.length ?? 0) > 0);
}

export function findPullRequestBodyViolations(body, changedFiles = []) {
  const content = body ?? '';
  const summarySection = readSection(content, 'Summary');
  const developmentRulesCheckSection = readSection(content, 'Development Rules Check');
  const governanceSection = readSection(content, 'Governance Notes');
  const metricsSection = readSection(content, 'Metrics Claims');
  const validationSection = readSection(content, 'Validation');
  const notesSection = readSection(content, 'Notes');
  const missingGovernanceLabels = REQUIRED_PR_GOVERNANCE_LABELS.filter(
    (label) => !governanceSection.includes(label),
  );
  const missingLabels = REQUIRED_PR_METRIC_LABELS.filter(
    (label) => !metricsSection.includes(label),
  );
  const violations = [];
  const lineScopeValue = readBulletValue(governanceSection, 'Line Scope:');
  const worklineLaneValue = readBulletValue(governanceSection, 'Workline Lane:');
  const currentSourceOfTruthValue = readBulletValue(governanceSection, 'Current Source of Truth:');
  const canonicalPathValue = readBulletValue(governanceSection, 'Canonical Path:');
  const compatibilityValue = readBulletValue(governanceSection, 'Compatibility Layer / Shim:');
  const directCutoverRiskValue = readBulletValue(governanceSection, 'Direct Cutover Risk:');
  const exitConditionValue = readBulletValue(governanceSection, 'Exit Condition:');
  const migrationStatusValue = readBulletValue(governanceSection, 'Migration Status:');
  const cleanupTrackingValue = readBulletValue(governanceSection, 'Cleanup Tracking:');
  const deletionReachabilityValue = readBulletValue(governanceSection, 'Deletion Reachability:');
  const gitnexusEvidenceValue = readBulletValue(governanceSection, 'GitNexus Evidence:');
  const measuredValue = readBulletValue(metricsSection, 'Measured:');
  const inferredValue = readBulletValue(metricsSection, 'Inferred:');
  const historicalBaselineValue = readBulletValue(metricsSection, 'Historical Baseline:');
  const metricsNaValue = readBulletValue(metricsSection, 'N/A:');
  const executionPathVerificationFieldPresent = validationSection.includes(
    'Execution Path Verification:',
  );
  const regressionCoverageFieldPresent = validationSection.includes('Regression Coverage:');
  const currentDocsFactsUpdatedFieldPresent = validationSection.includes(
    'Current Docs / Facts Updated:',
  );
  const validationNaFieldPresent = validationSection.includes('N/A:');
  const executionPathVerificationValue = readBulletValue(
    validationSection,
    'Execution Path Verification:',
  );
  const regressionCoverageValue = readBulletValue(validationSection, 'Regression Coverage:');
  const currentDocsFactsUpdatedValue = readBulletValue(
    validationSection,
    'Current Docs / Facts Updated:',
  );
  const validationNaValue = readBulletValue(validationSection, 'N/A:');

  const normalizedChanges = changedFiles
    .map((entry) => ({
      status: (entry?.status ?? 'M').trim(),
      path: normalizePath(entry?.path ?? ''),
      previousPath: normalizePath(entry?.previousPath ?? ''),
    }))
    .filter((entry) => entry.path.length > 0 || entry.previousPath.length > 0);
  const relevantChanges = normalizedChanges.filter((entry) => touchesManagedPath(entry));

  if (missingGovernanceLabels.length > 0) {
    violations.push({
      rule: 'pr-governance-fields',
      message: `PR body must keep governance fields: ${missingGovernanceLabels.join(', ')}`,
    });
  }

  if (missingLabels.length > 0) {
    violations.push({
      rule: 'pr-metrics-section',
      message: `PR body must keep metric classification fields: ${missingLabels.join(', ')}`,
    });
  }

  const markdownEntrypointRelevant = normalizedChanges.some((entry) =>
    getEntryPaths(entry).some((filePath) => isDeveloperFacingMarkdownEntrypoint(filePath)),
  );

  if (markdownEntrypointRelevant && !hasMarkdownEntrypointChecklist(developmentRulesCheckSection)) {
    violations.push({
      rule: 'pr-markdown-entrypoint-checklist',
      message:
        'Development Rules Check must retain the developer-facing markdown entrypoint checklist item when repository-root or first-level docs/eval/gitnexus markdown entrypoints change.',
    });
  }

  if (
    relevantChanges.length > 0 &&
    governanceSection.includes('Line Scope:') &&
    !hasValue(lineScopeValue)
  ) {
    violations.push({
      rule: 'pr-line-scope',
      message: 'Line Scope must be filled when managed files change.',
    });
  }

  if (
    relevantChanges.length > 0 &&
    governanceSection.includes('Workline Lane:') &&
    !hasValue(worklineLaneValue)
  ) {
    violations.push({
      rule: 'pr-workline-lane',
      message: 'Workline Lane must be filled when managed files change.',
    });
  }

  if (
    relevantChanges.length > 0 &&
    hasValue(worklineLaneValue) &&
    !/^(feature|governance|refactor|n\/a)$/i.test(worklineLaneValue)
  ) {
    violations.push({
      rule: 'pr-workline-lane-format',
      message: 'Workline Lane must be exactly one of: feature, governance, refactor, or N/A.',
    });
  }

  if (
    relevantChanges.length > 0 &&
    governanceSection.includes('Current Source of Truth:') &&
    !hasValue(currentSourceOfTruthValue)
  ) {
    violations.push({
      rule: 'pr-current-source-of-truth',
      message: 'Current Source of Truth must be filled when managed files change.',
    });
  }

  const compatibilityRelevant = relevantChanges.some((entry) =>
    touchesCompatibilityLikePath(entry),
  );
  const deletionRelevant = relevantChanges.some((entry) => removesManagedPath(entry));
  const migrationRelevant = compatibilityRelevant || deletionRelevant;
  const migrationStatusFieldPresent = governanceSection.includes('Migration Status:');
  const migrationStatusKind = parseMigrationStatusKind(migrationStatusValue);
  const directCutoverRiskFieldPresent = governanceSection.includes('Direct Cutover Risk:');
  const cleanupTrackingFieldPresent = governanceSection.includes('Cleanup Tracking:');
  const activeCompatibilityPathRelevant = relevantChanges.some(
    (entry) =>
      !entry.status.startsWith('D') &&
      entry.path.length > 0 &&
      isManagedPath(entry.path) &&
      isCompatibilityLikePath(entry.path),
  );
  const activeTemporaryScriptRelevant = relevantChanges.some(
    (entry) =>
      !entry.status.startsWith('D') &&
      entry.path.length > 0 &&
      isManagedPath(entry.path) &&
      isTemporaryScriptLikePath(entry.path),
  );
  const activeTemporaryMigrationScriptRelevant = relevantChanges.some(
    (entry) =>
      !entry.status.startsWith('D') &&
      entry.path.length > 0 &&
      isManagedPath(entry.path) &&
      isTemporaryMigrationScriptLikePath(entry.path),
  );
  const activeExitConditionRelevant = compatibilityRelevant || activeTemporaryScriptRelevant;
  const activeCleanupTrackingRelevant =
    activeCompatibilityPathRelevant || activeTemporaryScriptRelevant;

  if (compatibilityRelevant && !hasValue(compatibilityValue)) {
    violations.push({
      rule: 'pr-compatibility-note',
      message: 'Compatibility Layer / Shim must be filled when compatibility-layer paths change.',
    });
  }

  if (compatibilityRelevant && hasValue(compatibilityValue)) {
    const compatibilityTargets = collectCompatibilityTargets(relevantChanges);
    if (!hasPathReference(compatibilityValue, compatibilityTargets)) {
      violations.push({
        rule: 'pr-compatibility-target',
        message:
          'Compatibility Layer / Shim must name the actual shim, compat, *_new, or *_v2 path being changed.',
      });
    }

    if (
      hasPathReference(compatibilityValue, compatibilityTargets) &&
      !hasRepoRelativePathReference(compatibilityValue, compatibilityTargets)
    ) {
      violations.push({
        rule: 'pr-compatibility-path-format',
        message:
          'Compatibility Layer / Shim must name the actual repo-relative shim or compat path, such as `gitnexus/src/router_new.ts`.',
      });
    }
  }

  if (compatibilityRelevant && !directCutoverRiskFieldPresent) {
    violations.push({
      rule: 'pr-direct-cutover-risk-field',
      message: 'Direct Cutover Risk field must be present when compatibility-layer paths change.',
    });
  }

  if (compatibilityRelevant && directCutoverRiskFieldPresent && !hasValue(directCutoverRiskValue)) {
    violations.push({
      rule: 'pr-direct-cutover-risk',
      message:
        'Direct Cutover Risk must explain why direct cutover is unsafe right now when compatibility-layer paths change.',
    });
  }

  if (
    compatibilityRelevant &&
    hasValue(directCutoverRiskValue) &&
    isPlaceholderDirectCutoverRisk(directCutoverRiskValue)
  ) {
    violations.push({
      rule: 'pr-direct-cutover-risk-quality',
      message:
        'Direct Cutover Risk must explain the concrete blocker for direct cutover and cannot be a placeholder such as TBD, later, unknown, or keep for safety.',
    });
  }

  if (activeExitConditionRelevant && !hasValue(exitConditionValue)) {
    violations.push({
      rule: 'pr-exit-condition',
      message:
        'Exit Condition must be filled when compatibility-layer paths change or a temporary migration/debug script remains active after the change.',
    });
  }

  if (
    activeExitConditionRelevant &&
    hasValue(exitConditionValue) &&
    isPlaceholderExitCondition(exitConditionValue)
  ) {
    violations.push({
      rule: 'pr-exit-condition-quality',
      message:
        'Exit Condition must describe a concrete retirement trigger for the compatibility path or temporary script and cannot be a placeholder such as TBD, later, or follow-up cleanup.',
    });
  }

  if (
    compatibilityRelevant &&
    hasValue(canonicalPathValue) &&
    (canonicalPathReferencesCompatibilityLayer(canonicalPathValue) ||
      canonicalPathReferencesTemporaryScript(canonicalPathValue))
  ) {
    violations.push({
      rule: 'pr-canonical-path-compatibility',
      message:
        'Canonical Path must point to the stable canonical path, not the shim, compat, *_new, *_v2, or temporary migration/debug script path.',
    });
  }

  if (
    activeTemporaryScriptRelevant &&
    hasValue(canonicalPathValue) &&
    canonicalPathReferencesTemporaryScript(canonicalPathValue)
  ) {
    violations.push({
      rule: 'pr-canonical-path-temporary-script',
      message:
        'Canonical Path must point to the stable product path, not the temporary migration/debug script or debug entry point.',
    });
  }

  if (hasValue(canonicalPathValue) && canonicalPathHasMultipleTargets(canonicalPathValue)) {
    violations.push({
      rule: 'pr-canonical-path-multiple',
      message: 'Canonical Path must identify exactly one stable canonical path.',
    });
  }

  if (
    relevantChanges.length > 0 &&
    hasValue(canonicalPathValue) &&
    !canonicalPathHasRepoRelativeTarget(canonicalPathValue)
  ) {
    violations.push({
      rule: 'pr-canonical-path-format',
      message:
        'Canonical Path must name exactly one stable repo-relative path such as `gitnexus/src/router.ts`.',
    });
  }

  if (relevantChanges.length > 0 && !hasValue(canonicalPathValue)) {
    violations.push({
      rule: 'pr-canonical-path',
      message: 'Canonical Path must be filled when managed files change.',
    });
  }

  if (
    (migrationRelevant || activeTemporaryMigrationScriptRelevant) &&
    !migrationStatusFieldPresent
  ) {
    violations.push({
      rule: 'pr-migration-status-field',
      message:
        'Migration Status field must be present when compatibility layers, managed-path retirement, or active temporary migration scripts are involved.',
    });
  }

  if (
    (migrationRelevant || activeTemporaryMigrationScriptRelevant) &&
    migrationStatusFieldPresent &&
    !hasValue(migrationStatusValue)
  ) {
    violations.push({
      rule: 'pr-migration-status',
      message:
        'Migration Status must be filled when compatibility layers, managed-path retirement, or active temporary migration scripts are involved.',
    });
  }

  if (
    (migrationRelevant || activeTemporaryMigrationScriptRelevant) &&
    hasValue(migrationStatusValue) &&
    !migrationStatusKind
  ) {
    violations.push({
      rule: 'pr-migration-status-format',
      message:
        'Migration Status must start with one of: transitional, partial, in progress, complete, or N/A.',
    });
  }

  if (
    activeCompatibilityPathRelevant &&
    migrationStatusKind &&
    migrationStatusKind !== 'transitional'
  ) {
    violations.push({
      rule: 'pr-migration-status-active-compat',
      message:
        'Migration Status must stay transitional or partial while an active shim, compat, *_new, or *_v2 path still exists after the change.',
    });
  }

  if (
    activeTemporaryMigrationScriptRelevant &&
    migrationStatusKind &&
    migrationStatusKind !== 'transitional'
  ) {
    violations.push({
      rule: 'pr-migration-status-active-temp-migration',
      message:
        'Migration Status must stay transitional or partial while an active temporary migration/backfill/cutover script still exists after the change.',
    });
  }

  if (activeCleanupTrackingRelevant && !cleanupTrackingFieldPresent) {
    violations.push({
      rule: 'pr-cleanup-tracking-field',
      message:
        'Cleanup Tracking field must be present when an active temporary layer or temporary script remains after the change.',
    });
  }

  if (
    activeCleanupTrackingRelevant &&
    cleanupTrackingFieldPresent &&
    !hasValue(cleanupTrackingValue)
  ) {
    violations.push({
      rule: 'pr-cleanup-tracking',
      message:
        'Cleanup Tracking must name the milestone, issue, or follow-up task that removes the remaining temporary layer or script.',
    });
  }

  if (
    activeCleanupTrackingRelevant &&
    hasValue(cleanupTrackingValue) &&
    (isPlaceholderCleanupTracking(cleanupTrackingValue) ||
      !hasConcreteCleanupTrackingReference(cleanupTrackingValue))
  ) {
    violations.push({
      rule: 'pr-cleanup-tracking-quality',
      message:
        'Cleanup Tracking must name a concrete milestone, issue, or follow-up task reference such as `GNX-123`, `milestone 4`, or `issue ...`, and cannot be a placeholder such as TBD, later, N/A, or same PR.',
    });
  }

  if (deletionRelevant && !hasValue(deletionReachabilityValue)) {
    violations.push({
      rule: 'pr-deletion-reachability',
      message:
        'Deletion Reachability must be filled when managed files are deleted or renamed away in managed paths.',
    });
  }

  if (
    deletionRelevant &&
    hasValue(deletionReachabilityValue) &&
    !hasDeletionReachabilityCoverage(deletionReachabilityValue)
  ) {
    violations.push({
      rule: 'pr-deletion-reachability-coverage',
      message:
        'Deletion Reachability must explicitly cover feature-tree, runtime, scripts/automation, config/env, and tests/fixtures reachability.',
    });
  }

  if (deletionRelevant && !hasValue(gitnexusEvidenceValue)) {
    violations.push({
      rule: 'pr-deletion-evidence',
      message:
        'GitNexus Evidence must be filled when managed files are deleted or renamed away in managed paths.',
    });
  }

  if (
    deletionRelevant &&
    hasValue(gitnexusEvidenceValue) &&
    !hasGitNexusEvidence(gitnexusEvidenceValue)
  ) {
    violations.push({
      rule: 'pr-deletion-evidence-format',
      message:
        'GitNexus Evidence must cite a GitNexus tool call or gitnexus:// resource when managed files are deleted or renamed away in managed paths.',
    });
  }

  if (
    deletionRelevant &&
    hasValue(gitnexusEvidenceValue) &&
    hasGitNexusEvidence(gitnexusEvidenceValue)
  ) {
    const retiredPaths = relevantChanges
      .filter((entry) => removesManagedPath(entry))
      .flatMap((entry) => [entry.previousPath, entry.path])
      .filter(Boolean);
    const evidenceTargets = hasValue(canonicalPathValue)
      ? [...retiredPaths, canonicalPathValue]
      : retiredPaths;

    if (!hasPathReference(gitnexusEvidenceValue, evidenceTargets)) {
      violations.push({
        rule: 'pr-deletion-evidence-target',
        message:
          'GitNexus Evidence must name the retired managed path or the canonical replacement path.',
      });
    }

    if (
      hasPathReference(gitnexusEvidenceValue, evidenceTargets) &&
      !hasRepoRelativePathReference(gitnexusEvidenceValue, evidenceTargets)
    ) {
      violations.push({
        rule: 'pr-deletion-evidence-target-format',
        message:
          'GitNexus Evidence must name the retired managed path or canonical replacement path as a repo-relative path such as `gitnexus/src/router.ts`.',
      });
    }
  }

  if (
    relevantChanges.length > 0 &&
    !hasValue(measuredValue) &&
    !hasValue(inferredValue) &&
    !hasValue(historicalBaselineValue) &&
    !hasValue(metricsNaValue)
  ) {
    violations.push({
      rule: 'pr-metrics-content',
      message:
        'Metrics Claims must include at least one filled metric field or an explicit N/A note.',
    });
  }

  if (
    relevantChanges.length > 0 &&
    hasValue(metricsNaValue) &&
    (hasValue(measuredValue) || hasValue(inferredValue) || hasValue(historicalBaselineValue))
  ) {
    violations.push({
      rule: 'pr-metrics-na-exclusive',
      message:
        'Metrics Claims `N/A:` must stay empty whenever Measured, Inferred, or Historical Baseline is filled.',
    });
  }

  for (const metricField of [
    { label: 'Measured', value: measuredValue },
    { label: 'Inferred', value: inferredValue },
    { label: 'Historical Baseline', value: historicalBaselineValue },
  ]) {
    if (hasMeaningfulMetricValue(metricField.value) && !hasMetricContext(metricField.value)) {
      violations.push({
        rule: 'pr-metric-context',
        message: `${metricField.label} metric claims must include explicit \`scope:\` and \`time:\` context when they contain a real claim.`,
      });
    }
  }

  const validationClosureFieldsPresent =
    executionPathVerificationFieldPresent ||
    regressionCoverageFieldPresent ||
    currentDocsFactsUpdatedFieldPresent ||
    validationNaFieldPresent;

  if (
    relevantChanges.length > 0 &&
    validationClosureFieldsPresent &&
    !hasValue(executionPathVerificationValue) &&
    !hasValue(regressionCoverageValue) &&
    !hasValue(currentDocsFactsUpdatedValue) &&
    !hasValue(validationNaValue)
  ) {
    violations.push({
      rule: 'pr-validation-content',
      message:
        'Validation must include execution-path verification, regression coverage, current-docs/facts updates, or an explicit N/A note.',
    });
  }

  if (
    relevantChanges.length > 0 &&
    validationClosureFieldsPresent &&
    hasValue(validationNaValue) &&
    (hasValue(executionPathVerificationValue) ||
      hasValue(regressionCoverageValue) ||
      hasValue(currentDocsFactsUpdatedValue))
  ) {
    violations.push({
      rule: 'pr-validation-na-exclusive',
      message:
        'Validation `N/A:` must stay empty whenever execution-path verification, regression coverage, or current docs/facts updates are filled.',
    });
  }

  if (/mechanical split/i.test(content)) {
    const mechanicalSplitContext = `${summarySection}\n${notesSection}`;
    const hasMechanicalSplitBenefit = MECHANICAL_SPLIT_BENEFIT_PATTERNS.some((pattern) =>
      pattern.test(mechanicalSplitContext),
    );
    if (!hasMechanicalSplitBenefit) {
      violations.push({
        rule: 'pr-mechanical-split-benefit',
        message:
          'Mechanical split notes must explain a concrete benefit such as ownership boundaries, call-path clarity, testability, or change safety.',
      });
    }
  }

  return violations;
}

export async function findCompatibilityMetadataViolations(
  changedFiles,
  readFile = (filePath) => fs.promises.readFile(filePath, 'utf8'),
) {
  const relevantChanges = changedFiles
    .map((entry) => ({
      status: (entry?.status ?? 'M').trim(),
      path: normalizePath(entry?.path ?? ''),
    }))
    .filter((entry) => entry.path.length > 0)
    .filter((entry) => isManagedPath(entry.path))
    .filter((entry) => entry.status.startsWith('A'))
    .filter((entry) => isCompatibilityLikePath(entry.path));

  const violations = [];

  for (const entry of relevantChanges) {
    let content = '';
    try {
      content = await readFile(entry.path);
    } catch {
      violations.push({
        rule: 'compat-file-read',
        path: entry.path,
        message: `Could not read compatibility-like file for governance validation: ${entry.path}`,
      });
      continue;
    }

    for (const marker of REQUIRED_COMPATIBILITY_FILE_MARKERS) {
      if (!marker.pattern.test(content)) {
        violations.push({
          rule: marker.rule,
          path: entry.path,
          message: `${marker.message} File: ${entry.path}`,
        });
      }
    }

    const canonicalPathValue = readMarkerValue(content, 'CANONICAL PATH:');
    if (
      hasValue(canonicalPathValue) &&
      (canonicalPathReferencesCompatibilityLayer(canonicalPathValue) ||
        canonicalPathReferencesTemporaryScript(canonicalPathValue))
    ) {
      violations.push({
        rule: 'compat-file-canonical-path-target',
        path: entry.path,
        message: `Compatibility-like files must point \`CANONICAL PATH:\` at a stable path, not another temporary script, shim, or *_new/_v2 path. File: ${entry.path}`,
      });
    }

    if (hasValue(canonicalPathValue) && canonicalPathHasMultipleTargets(canonicalPathValue)) {
      violations.push({
        rule: 'compat-file-canonical-path-multiple',
        path: entry.path,
        message: `Compatibility-like files must set \`CANONICAL PATH:\` to exactly one stable path. File: ${entry.path}`,
      });
    }

    if (hasValue(canonicalPathValue) && !canonicalPathHasRepoRelativeTarget(canonicalPathValue)) {
      violations.push({
        rule: 'compat-file-canonical-path-format',
        path: entry.path,
        message: `Compatibility-like files must write \`CANONICAL PATH:\` as exactly one stable repo-relative path such as \`gitnexus/src/router.ts\`. File: ${entry.path}`,
      });
    }

    const directCutoverRiskValue = readMarkerValue(content, 'DIRECT CUTOVER RISK:');
    if (
      hasValue(directCutoverRiskValue) &&
      isPlaceholderDirectCutoverRisk(directCutoverRiskValue)
    ) {
      violations.push({
        rule: 'compat-file-direct-cutover-risk-quality',
        path: entry.path,
        message: `Compatibility-like files must explain \`DIRECT CUTOVER RISK:\` with a concrete blocker, not a placeholder such as TBD, later, unknown, or keep for safety. File: ${entry.path}`,
      });
    }

    const exitConditionValue = readMarkerValue(content, 'EXIT CONDITION:');
    if (hasValue(exitConditionValue) && isPlaceholderExitCondition(exitConditionValue)) {
      violations.push({
        rule: 'compat-file-exit-condition-quality',
        path: entry.path,
        message: `Compatibility-like files must give \`EXIT CONDITION:\` a concrete retirement trigger, not a placeholder such as TBD or later. File: ${entry.path}`,
      });
    }

    const cleanupTrackingValue = readMarkerValue(content, 'CLEANUP TRACKING:');
    if (
      hasValue(cleanupTrackingValue) &&
      (isPlaceholderCleanupTracking(cleanupTrackingValue) ||
        !hasConcreteCleanupTrackingReference(cleanupTrackingValue))
    ) {
      violations.push({
        rule: 'compat-file-cleanup-tracking-quality',
        path: entry.path,
        message: `Compatibility-like files must give \`CLEANUP TRACKING:\` a concrete milestone, issue, or follow-up task reference such as \`GNX-123\`, \`milestone 4\`, or \`issue ...\`, not a placeholder such as TBD, later, N/A, or same PR. File: ${entry.path}`,
      });
    }
  }

  return violations;
}

export async function findTemporaryScriptMetadataViolations(
  changedFiles,
  readFile = (filePath) => fs.promises.readFile(filePath, 'utf8'),
) {
  const relevantChanges = changedFiles
    .map((entry) => ({
      status: (entry?.status ?? 'M').trim(),
      path: normalizePath(entry?.path ?? ''),
    }))
    .filter((entry) => entry.path.length > 0)
    .filter((entry) => isManagedPath(entry.path))
    .filter((entry) => entry.status.startsWith('A'))
    .filter((entry) => isTemporaryScriptLikePath(entry.path));

  const violations = [];

  for (const entry of relevantChanges) {
    let content = '';
    try {
      content = await readFile(entry.path);
    } catch {
      violations.push({
        rule: 'temp-script-read',
        path: entry.path,
        message: `Could not read temporary script for governance validation: ${entry.path}`,
      });
      continue;
    }

    if (!hasSpecificTemporaryScriptName(entry.path)) {
      violations.push({
        rule: 'temp-script-name-specificity',
        path: entry.path,
        message: `Temporary migration/debug scripts must use an exact-purpose filename, not a generic name such as debug, migration, backfill, or cutover alone. File: ${entry.path}`,
      });
    }

    const canonicalPathValue = readMarkerValue(content, 'CANONICAL PATH:');
    if (!hasValue(canonicalPathValue)) {
      violations.push({
        rule: 'temp-script-canonical-path',
        path: entry.path,
        message: `Temporary migration/debug scripts added in managed script paths must declare non-empty \`CANONICAL PATH:\` metadata. File: ${entry.path}`,
      });
    } else {
      if (
        canonicalPathReferencesCompatibilityLayer(canonicalPathValue) ||
        canonicalPathReferencesTemporaryScript(canonicalPathValue)
      ) {
        violations.push({
          rule: 'temp-script-canonical-path-target',
          path: entry.path,
          message: `Temporary migration/debug scripts must point \`CANONICAL PATH:\` at a stable product path, not another temporary script, debug entry point, shim, or *_new/_v2 path. File: ${entry.path}`,
        });
      }

      if (canonicalPathHasMultipleTargets(canonicalPathValue)) {
        violations.push({
          rule: 'temp-script-canonical-path-multiple',
          path: entry.path,
          message: `Temporary migration/debug scripts must set \`CANONICAL PATH:\` to exactly one stable product path. File: ${entry.path}`,
        });
      }

      if (!canonicalPathHasRepoRelativeTarget(canonicalPathValue)) {
        violations.push({
          rule: 'temp-script-canonical-path-format',
          path: entry.path,
          message: `Temporary migration/debug scripts must write \`CANONICAL PATH:\` as exactly one stable repo-relative product path such as \`gitnexus/src/router.ts\`. File: ${entry.path}`,
        });
      }
    }

    const purposeValue = readMarkerValue(content, 'PURPOSE:');
    if (!hasValue(purposeValue)) {
      violations.push({
        rule: 'temp-script-purpose',
        path: entry.path,
        message: `Temporary migration/debug scripts added in managed script paths must declare non-empty \`PURPOSE:\` metadata. File: ${entry.path}`,
      });
    } else if (isPlaceholderTempScriptPurpose(purposeValue)) {
      violations.push({
        rule: 'temp-script-purpose-quality',
        path: entry.path,
        message: `Temporary migration/debug scripts must describe \`PURPOSE:\` with a specific purpose, not a generic placeholder such as temporary helper or debug script. File: ${entry.path}`,
      });
    }

    const cleanupTrackingValue = readMarkerValue(content, 'CLEANUP TRACKING:');
    if (!hasValue(cleanupTrackingValue)) {
      violations.push({
        rule: 'temp-script-cleanup-tracking',
        path: entry.path,
        message: `Temporary migration/debug scripts added in managed script paths must declare non-empty \`CLEANUP TRACKING:\` metadata. File: ${entry.path}`,
      });
    } else if (
      isPlaceholderCleanupTracking(cleanupTrackingValue) ||
      !hasConcreteCleanupTrackingReference(cleanupTrackingValue)
    ) {
      violations.push({
        rule: 'temp-script-cleanup-tracking-quality',
        path: entry.path,
        message: `Temporary migration/debug scripts must give \`CLEANUP TRACKING:\` a concrete milestone, issue, or follow-up task reference such as \`GNX-123\`, \`milestone 4\`, or \`issue ...\`, not a placeholder such as TBD, later, N/A, or same PR. File: ${entry.path}`,
      });
    }

    const exitConditionValue = readMarkerValue(content, 'EXIT CONDITION:');
    if (!hasValue(exitConditionValue)) {
      violations.push({
        rule: 'temp-script-exit-condition',
        path: entry.path,
        message: `Temporary migration/debug scripts added in managed script paths must declare non-empty \`EXIT CONDITION:\` metadata. File: ${entry.path}`,
      });
      continue;
    }

    if (isPlaceholderExitCondition(exitConditionValue)) {
      violations.push({
        rule: 'temp-script-exit-condition-quality',
        path: entry.path,
        message: `Temporary migration/debug scripts must give \`EXIT CONDITION:\` a concrete retirement trigger, not a placeholder such as TBD or later. File: ${entry.path}`,
      });
    }
  }

  return violations;
}

export async function findDeveloperEntrypointGovernanceViolations(
  paths,
  readFile = (filePath) => fs.promises.readFile(filePath, 'utf8'),
) {
  const candidatePaths = [
    ...new Set(
      paths
        .map(normalizePath)
        .filter(Boolean)
        .filter((filePath) => isDeveloperFacingMarkdownEntrypoint(filePath)),
    ),
  ];

  const violations = [];

  for (const filePath of candidatePaths) {
    let content = '';
    try {
      content = await readFile(filePath);
    } catch {
      violations.push({
        rule: 'markdown-development-rules-read',
        path: filePath,
        message: `Could not read developer-facing markdown entrypoint for governance validation: ${filePath}`,
      });
      continue;
    }

    if (!hasDevelopmentRulesAnchor(content)) {
      violations.push({
        rule: 'markdown-development-rules-anchor',
        path: filePath,
        message: `Developer-facing markdown entrypoints in the repository root or first-level docs/eval/gitnexus directories must reference \`DEVELOPMENT_RULES.md\`. File: ${filePath}`,
      });
    }
  }

  return violations;
}

export async function findPathModeViolations(
  paths,
  readFile = (filePath) => fs.promises.readFile(filePath, 'utf8'),
) {
  const normalizedPaths = paths.map(normalizePath).filter(Boolean);
  const pathViolations = findManagedPathViolations(normalizedPaths);
  const developerEntrypointViolations = await findDeveloperEntrypointGovernanceViolations(
    normalizedPaths,
    readFile,
  );
  const temporaryScriptViolations = await findTemporaryScriptMetadataViolations(
    normalizedPaths.map((filePath) => ({ status: 'A', path: filePath })),
    readFile,
  );

  return [...pathViolations, ...developerEntrypointViolations, ...temporaryScriptViolations];
}

function collectRepositoryPaths(repoRoot) {
  try {
    const output = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );

    return output
      .split('\0')
      .map((entry) => entry.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function collectChangedFiles(repoRoot, baseRef) {
  const output = execFileSync(
    'git',
    ['diff', '--name-status', '--find-renames', `${baseRef}...HEAD`],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  return parseChangedFilesOutput(output);
}

function readPullRequestBody(eventPath) {
  const raw = fs.readFileSync(eventPath, 'utf8');
  const payload = JSON.parse(raw);
  return payload?.pull_request?.body ?? '';
}

function printViolations(violations) {
  for (const violation of violations) {
    console.error(`- [${violation.rule}] ${violation.message}`);
  }
}

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      args.set(current, 'true');
      continue;
    }
    args.set(current, value);
    i += 1;
  }
  return args;
}

async function runPathMode(repoRoot) {
  const paths = collectRepositoryPaths(repoRoot);
  const violations = await findPathModeViolations(paths, (filePath) =>
    fs.promises.readFile(path.join(repoRoot, filePath), 'utf8'),
  );
  if (violations.length > 0) {
    printViolations(violations);
    process.exitCode = 1;
    return;
  }
  console.log('Repository governance path check passed.');
}

async function runPullRequestMode(eventPath, repoRoot, baseRef) {
  const body = readPullRequestBody(eventPath);
  let changedFiles = [];
  if (baseRef) {
    try {
      changedFiles = collectChangedFiles(repoRoot, baseRef);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      printViolations([
        {
          rule: 'pr-changed-files',
          message: `Could not diff changed files against base ref ${baseRef}. Ensure the base ref exists in the checkout before running PR governance checks. Details: ${detail}`,
        },
      ]);
      process.exitCode = 1;
      return;
    }
  }
  const bodyViolations = findPullRequestBodyViolations(body, changedFiles);
  const compatibilityFileViolations = await findCompatibilityMetadataViolations(
    changedFiles,
    (filePath) => fs.promises.readFile(path.join(repoRoot, filePath), 'utf8'),
  );
  const temporaryScriptViolations = await findTemporaryScriptMetadataViolations(
    changedFiles,
    (filePath) => fs.promises.readFile(path.join(repoRoot, filePath), 'utf8'),
  );
  const violations = [
    ...bodyViolations,
    ...compatibilityFileViolations,
    ...temporaryScriptViolations,
  ];
  if (violations.length > 0) {
    printViolations(violations);
    process.exitCode = 1;
    return;
  }
  console.log('Pull request governance body check passed.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.get('--mode');

  if (mode === 'paths') {
    const repoRoot = path.resolve(args.get('--repo-root') ?? process.cwd());
    await runPathMode(repoRoot);
    return;
  }

  if (mode === 'pr-body') {
    const eventPath = args.get('--event-path');
    if (!eventPath) {
      throw new Error('usage: --mode pr-body --event-path <github-event-json>');
    }
    const repoRoot = path.resolve(args.get('--repo-root') ?? process.cwd());
    const baseRef = args.get('--base-ref') ?? '';
    await runPullRequestMode(path.resolve(eventPath), repoRoot, baseRef);
    return;
  }

  throw new Error(
    'usage: --mode <paths|pr-body> [--repo-root <path>] [--base-ref <ref>] [--event-path <path>]',
  );
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
