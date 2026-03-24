/**
 * Format tabular Cypher result rows as a markdown table for LLM readability.
 */
export function formatCypherAsMarkdown(result: any[]): { markdown: string; row_count: number } {
  const keys = Object.keys(result[0]);
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
