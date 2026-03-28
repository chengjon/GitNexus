import fs from 'node:fs';

export function extractLanguageSupportCheck(doctorResult) {
  const check = doctorResult?.checks?.find?.((entry) => entry.name === 'language-support');
  if (!check) {
    throw new Error('language-support check missing from doctor output');
  }
  return check;
}

function parseLanguageSupportDetail(detail) {
  return detail
    .split(', ')
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^([^:]+):([^=]+)=([^(]+)(?: \((.*)\))?$/);
      if (!match) return null;
      const [, language, tier, status, extra] = match;
      return {
        language,
        tier,
        status: status.trim(),
        detail: extra ?? '',
      };
    })
    .filter(Boolean);
}

export function formatLanguageSupportSummary(languageSupportCheck) {
  const rows = parseLanguageSupportDetail(languageSupportCheck.detail);
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

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error('usage: node scripts/ci/language-support-report.mjs <doctor-json-file>');
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const doctorResult = JSON.parse(raw);
  const languageSupportCheck = extractLanguageSupportCheck(doctorResult);
  const summary = formatLanguageSupportSummary(languageSupportCheck);

  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
