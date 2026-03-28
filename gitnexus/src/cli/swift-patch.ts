import path from 'node:path';

export interface SwiftPatchLogger {
  log(message: string): void;
  warn(message: string): void;
}

export interface SwiftPatchDeps {
  exists(targetPath: string): Promise<boolean>;
  readFile(targetPath: string): Promise<string>;
  writeFile(targetPath: string, content: string): Promise<void>;
  rebuild(swiftDir: string): Promise<void>;
  logger: SwiftPatchLogger;
}

export interface SwiftPatchOptions {
  swiftDir: string;
}

export type SwiftPatchResult =
  | { status: 'not-installed' }
  | { status: 'already-ok'; patched: boolean; rebuilt: boolean }
  | { status: 'patched-and-built'; patched: boolean; rebuilt: boolean }
  | { status: 'build-failed'; patched: boolean; rebuilt: boolean; error: string };

export async function applySwiftPatch(
  options: SwiftPatchOptions,
  deps: SwiftPatchDeps,
): Promise<SwiftPatchResult> {
  const bindingPath = path.join(options.swiftDir, 'binding.gyp');
  const bindingNodePath = path.join(options.swiftDir, 'build', 'Release', 'tree_sitter_swift_binding.node');

  if (!(await deps.exists(bindingPath))) {
    return { status: 'not-installed' };
  }

  const content = await deps.readFile(bindingPath);
  let patched = false;
  let rebuilt = false;

  if (content.includes('"actions"')) {
    const cleaned = content.replace(/#[^\n]*/g, '');
    const gyp = JSON.parse(cleaned);
    if (gyp.targets?.[0]?.actions) {
      delete gyp.targets[0].actions;
      await deps.writeFile(bindingPath, `${JSON.stringify(gyp, null, 2)}\n`);
      deps.logger.log('[tree-sitter-swift] Patched binding.gyp (removed actions array)');
      patched = true;
    }
  }

  const bindingExists = await deps.exists(bindingNodePath);
  const needsRebuild = patched || !bindingExists;
  if (!needsRebuild) {
    return { status: 'already-ok', patched, rebuilt };
  }

  try {
    deps.logger.log('[tree-sitter-swift] Rebuilding native binding...');
    await deps.rebuild(options.swiftDir);
    deps.logger.log('[tree-sitter-swift] Native binding built successfully');
    rebuilt = true;
    return { status: 'patched-and-built', patched, rebuilt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    deps.logger.warn(`[tree-sitter-swift] Could not build native binding: ${message}`);
    deps.logger.warn('[tree-sitter-swift] You may need to manually run: cd node_modules/tree-sitter-swift && npx node-gyp rebuild');
    return {
      status: 'build-failed',
      patched,
      rebuilt,
      error: message,
    };
  }
}
