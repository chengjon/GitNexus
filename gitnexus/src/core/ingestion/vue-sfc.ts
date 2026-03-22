export function isVueFilePath(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.vue');
}

export function extractVueScriptContent(source: string): string | null {
  if (!source || !source.toLowerCase().includes('<script')) return null;

  const lines = source.split('\n');
  const extractedLines = new Array<string>(lines.length).fill('');
  let inScript = false;

  for (let i = 0; i < lines.length; i++) {
    let remaining = lines[i];
    let extracted = '';

    while (remaining.length > 0) {
      if (!inScript) {
        const openMatch = remaining.match(/<script\b[^>]*>/i);
        if (!openMatch || openMatch.index === undefined) break;
        remaining = remaining.slice(openMatch.index + openMatch[0].length);
        inScript = true;
        continue;
      }

      const closeMatch = remaining.match(/<\/script>/i);
      if (!closeMatch || closeMatch.index === undefined) {
        extracted += remaining;
        remaining = '';
        continue;
      }

      extracted += remaining.slice(0, closeMatch.index);
      remaining = remaining.slice(closeMatch.index + closeMatch[0].length);
      inScript = false;
    }

    extractedLines[i] = extracted;
  }

  if (!extractedLines.some(line => line.trim().length > 0)) return null;
  return extractedLines.join('\n');
}

export function normalizeContentForParsing(filePath: string, source: string): string {
  if (!isVueFilePath(filePath)) return source;
  return extractVueScriptContent(source) ?? '';
}
