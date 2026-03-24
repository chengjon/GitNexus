/**
 * Format raw Cypher result rows as a markdown table for LLM readability.
 * Falls back to raw result if rows aren't tabular objects.
 */
export function formatCypherAsMarkdown(result: any): any {
  if (!Array.isArray(result) || result.length === 0) return result;

  const firstRow = result[0];
  if (typeof firstRow !== 'object' || firstRow === null) return result;

  const keys = Object.keys(firstRow);
  if (keys.length === 0) return result;

  const header = '| ' + keys.join(' | ') + ' |';
  const separator = '| ' + keys.map(() => '---').join(' | ') + ' |';
  const dataRows = result.map((row: any) =>
    '| ' + keys.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    }).join(' | ') + ' |'
  );

  return {
    markdown: [header, separator, ...dataRows].join('\n'),
    row_count: result.length,
  };
}
