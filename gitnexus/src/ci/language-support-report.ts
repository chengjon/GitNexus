import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  getLanguageSupportPolicy,
  type LanguageSupportSummaryEntry,
} from '../core/tree-sitter/language-registry.js';

export interface LanguageSupportCheck {
  name: string;
  status: string;
  detail: string;
  data?: LanguageSupportSummaryEntry[];
}

interface DoctorResultLike {
  checks?: Array<{
    name?: string;
    status?: string;
    detail?: string;
    data?: unknown;
  }>;
}

interface ParsedLanguageSupportRow {
  language: string;
  tier: string;
  status: string;
  supportLevel?: string;
  reasonCode?: string;
  detail: string;
}

function isLanguageSupportSummaryEntryArray(value: unknown): value is LanguageSupportSummaryEntry[] {
  return Array.isArray(value) && value.every((entry) => (
    entry
    && typeof entry === 'object'
    && typeof (entry as { language?: unknown }).language === 'string'
    && typeof (entry as { tier?: unknown }).tier === 'string'
    && typeof (entry as { status?: unknown }).status === 'string'
    && (!('supportLevel' in (entry as object)) || typeof (entry as { supportLevel?: unknown }).supportLevel === 'string')
    && (!('reasonCode' in (entry as object)) || typeof (entry as { reasonCode?: unknown }).reasonCode === 'string')
    && typeof (entry as { source?: unknown }).source === 'string'
    && typeof (entry as { detail?: unknown }).detail === 'string'
  ));
}

export function extractLanguageSupportCheck(doctorResult: DoctorResultLike): LanguageSupportCheck {
  const check = doctorResult?.checks?.find?.((entry) => entry.name === 'language-support');
  if (!check || typeof check.status !== 'string' || typeof check.detail !== 'string') {
    throw new Error('language-support check missing from doctor output');
  }
  return {
    name: 'language-support',
    status: check.status,
    detail: check.detail,
    ...(isLanguageSupportSummaryEntryArray(check.data) ? { data: check.data } : {}),
  };
}

function parseLanguageSupportDetail(detail: string): ParsedLanguageSupportRow[] {
  return detail
    .split(', ')
    .filter(Boolean)
    .map<ParsedLanguageSupportRow | null>((entry) => {
      const match = entry.match(/^([^:]+):([^=]+)=([^\[(]+?)(?: \[([^;\]]+)(?:; ([^\]]+))?\])?(?: \(([\s\S]*)\))?$/);
      if (!match) return null;
      const [, language, tier, status, supportLevel, reasonCode, extra] = match;
      return {
        language,
        tier,
        status: status.trim(),
        supportLevel: supportLevel?.trim(),
        reasonCode: reasonCode?.trim(),
        detail: extra ?? '',
      };
    })
    .filter((entry): entry is ParsedLanguageSupportRow => entry !== null);
}

function getLanguageSupportRows(languageSupportCheck: LanguageSupportCheck): ParsedLanguageSupportRow[] {
  if (languageSupportCheck.data) {
    return languageSupportCheck.data.map((entry) => ({
      language: entry.language,
      tier: entry.tier,
      status: entry.status,
      supportLevel: entry.supportLevel,
      reasonCode: entry.reasonCode,
      detail: entry.detail,
    }));
  }

  return parseLanguageSupportDetail(languageSupportCheck.detail);
}

export function formatLanguageSupportSummary(languageSupportCheck: LanguageSupportCheck): string {
  const rows = getLanguageSupportRows(languageSupportCheck);
  const lines = [
    '## Language Support',
    '',
    `Status: \`${languageSupportCheck.status}\``,
    '',
  ];

  for (const row of rows) {
    const semanticBits = [row.supportLevel, row.reasonCode].filter(Boolean);
    const semanticSuffix = semanticBits.length > 0 ? ` (\`${semanticBits.join('`, `')}\`` : '';
    const detailSuffix = row.detail ? `${semanticBits.length > 0 ? '; ' : ' ('}${row.detail}` : '';
    const suffix = semanticBits.length > 0 || row.detail ? `${semanticSuffix}${detailSuffix})` : '';
    lines.push(`- ${row.tier}: \`${row.language}\` = \`${row.status}\`${suffix}`);
  }

  return lines.join('\n');
}

export function validateLanguageSupportPolicy(languageSupportCheck: LanguageSupportCheck): void {
  const rows = getLanguageSupportRows(languageSupportCheck);
  const policy = getLanguageSupportPolicy();

  for (const language of policy.builtin) {
    const row = rows.find((entry) => entry.language === language && entry.tier === 'builtin');
    if (!row) {
      throw new Error(`builtin language declaration missing: ${language}`);
    }
    if (row.status !== 'available') {
      throw new Error(`builtin language support must be available: ${language}`);
    }
    if (languageSupportCheck.data && row.supportLevel !== 'fully-supported') {
      throw new Error(`builtin language support level must be fully-supported: ${language}`);
    }
    if (languageSupportCheck.data && row.reasonCode !== 'bundled-grammar') {
      throw new Error(`builtin language reason code must be bundled-grammar: ${language}`);
    }
  }

  for (const language of policy.optional) {
    const row = rows.find((entry) => entry.language === language && entry.tier === 'optional');
    if (!row) {
      throw new Error(`optional language declaration missing: ${language}`);
    }
    if (languageSupportCheck.data && !row.supportLevel) {
      throw new Error(`optional language support level missing: ${language}`);
    }
    if (languageSupportCheck.data && !row.reasonCode) {
      throw new Error(`optional language reason code missing: ${language}`);
    }
  }
}

export function main(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): string {
  const filePath = argv[0];
  if (!filePath) {
    throw new Error('usage: node dist/ci/language-support-report.js <doctor-json-file>');
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const doctorResult = JSON.parse(raw) as DoctorResultLike;
  const languageSupportCheck = extractLanguageSupportCheck(doctorResult);
  validateLanguageSupportPolicy(languageSupportCheck);
  const summary = formatLanguageSupportSummary(languageSupportCheck);

  console.log(summary);

  if (env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }

  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
