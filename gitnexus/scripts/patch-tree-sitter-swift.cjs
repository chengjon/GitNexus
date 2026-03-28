#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const cliModule = await import('../dist/cli/swift-patch.js');
  const swiftDir = path.join(__dirname, '..', 'node_modules', 'tree-sitter-swift');

  await cliModule.applySwiftPatch({
    swiftDir,
  }, {
    exists: async (targetPath) => fs.existsSync(targetPath),
    readFile: async (targetPath) => fs.readFileSync(targetPath, 'utf8'),
    writeFile: async (targetPath, content) => {
      fs.writeFileSync(targetPath, content);
    },
    rebuild: async (cwd) => {
      execSync('npx node-gyp rebuild', {
        cwd,
        stdio: 'pipe',
        timeout: 120000,
      });
    },
    logger: {
      log: (message) => console.log(message),
      warn: (message) => console.warn(message),
    },
  });
}

main().catch((error) => {
  console.warn('[tree-sitter-swift] Could not run patch entrypoint:', error?.message || String(error));
});
