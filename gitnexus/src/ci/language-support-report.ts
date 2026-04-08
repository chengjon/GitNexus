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
  detail: string;
}

function isLanguageSupportSummaryEntryArray(value: unknown): value is LanguageSupportSummaryEntry[] {
  return Array.isArray(value) && value.every((entry) => (
    entry
    && typeof entry === 'object'
    && typeof (entry as { language?: unknown }).language === 'string'
    && typeof (entry as { tier?: unknown }).tier === 'string'
    && typeof (entry as { status?: unknown }).status === 'string'
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
    .map((entry) => {
      const match = entry.match(/^([^:]+):([^=]+)=([^(]+)(?: \(([\s\S]*)\))?$/);
      if (!match) return null;
      const [, language, tier, status, extra] = match;
      return {
        language,
        tier,
        status: status.trim(),
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
    const suffix = row.detail ? ` (${row.detail})` : '';
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
  }

  for (const language of policy.optional) {
    const row = rows.find((entry) => entry.language === language && entry.tier === 'optional');
    if (!row) {
      throw new Error(`optional language declaration missing: ${language}`);
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
