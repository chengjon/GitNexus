import path from 'node:path';

export const normalizePlatformPath = (
  candidate: string,
  platform: NodeJS.Platform = process.platform,
): string => {
  const resolved = platform === 'win32'
    ? path.win32.resolve(candidate)
    : path.posix.resolve(candidate);
  return platform === 'win32' ? resolved.toLowerCase() : resolved;
};

export const samePlatformPath = (
  left: string,
  right: string,
  platform: NodeJS.Platform = process.platform,
): boolean => {
  const normalizedLeft = normalizePlatformPath(left.trim(), platform);
  const normalizedRight = normalizePlatformPath(right.trim(), platform);
  return normalizedLeft === normalizedRight;
};
