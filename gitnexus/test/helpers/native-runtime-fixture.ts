type CleanupFn = () => Promise<void> | void;

export interface NativeRuntimeFixture {
  addCleanup(fn: CleanupFn): void;
  cleanup(): Promise<void>;
}

export function createNativeRuntimeFixture(): NativeRuntimeFixture {
  const cleanups: CleanupFn[] = [];

  return {
    addCleanup(fn: CleanupFn) {
      cleanups.push(fn);
    },
    async cleanup() {
      while (cleanups.length > 0) {
        const fn = cleanups.pop()!;
        try {
          await fn();
        } catch {
          // best-effort fixture cleanup only
        }
      }
    },
  };
}
