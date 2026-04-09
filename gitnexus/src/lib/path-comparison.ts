export const samePlatformPath = (
  left: string,
  right: string,
  platform: NodeJS.Platform = process.platform,
): boolean => {
  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();
  return platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
};
