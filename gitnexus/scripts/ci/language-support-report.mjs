import { pathToFileURL } from 'node:url';

export async function main(argv = process.argv.slice(2), env = process.env) {
  const reporter = await import(new URL('../../dist/ci/language-support-report.js', import.meta.url));
  return reporter.main(argv, env);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
