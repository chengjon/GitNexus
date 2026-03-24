/**
 * Format tabular Cypher result rows as a markdown table for LLM readability.
 */
export function formatCypherAsMarkdown(result: any[]): { markdown: string; row_count: number } {
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('formatCypherAsMarkdown expected a non-empty array of row objects');
  }
  if (!isPlainObjectRow(result[0])) {
    throw new Error('formatCypherAsMarkdown expected each row to be a plain object');
  }

  const keys = Object.keys(result[0]);
  if (keys.length === 0) {
    throw new Error('formatCypherAsMarkdown expected row objects with at least one column');
  }

  for (const row of result) {
    if (!isPlainObjectRow(row)) {
      throw new Error('formatCypherAsMarkdown expected each row to be a plain object');
    }
  }

  const header = '| ' + keys.join(' | ') + ' |';
  const separator = '| ' + keys.map(() => '---').join(' | ') + ' |';
  const dataRows = result.map((row: any) =>
    '| ' + keys.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return escapeMarkdownTableCell(JSON.stringify(v));
      return escapeMarkdownTableCell(String(v));
    }).join(' | ') + ' |'
  );

  return {
    markdown: [header, separator, ...dataRows].join('\n'),
    row_count: result.length,
  };
}

function isPlainObjectRow(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\|/g, '\\|');
}
