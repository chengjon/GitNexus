export function shouldExplicitlyCloseNativeKuzu(
  platform: NodeJS.Platform = process.platform,
): boolean {
  return platform === 'win32';
}
