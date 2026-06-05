#!/usr/bin/env node
/**
 * Remove install/build byproducts from vendored grammar source trees.
 *
 * The postinstall grammar build runs against materialized copies under
 * node_modules/. Some node-gyp/node-addon-api paths can still leave makefile
 * fragments under vendor/node_modules. Those artifacts are not source and
 * violate the packaged-install smoke invariant (#836).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const vendorRoot = path.join(root, 'vendor');
const grammarDirs = ['tree-sitter-dart', 'tree-sitter-proto', 'tree-sitter-swift'];

function removeIfPresent(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

removeIfPresent(path.join(vendorRoot, 'node_modules'));

for (const name of grammarDirs) {
  const dir = path.join(vendorRoot, name);
  removeIfPresent(path.join(dir, 'build'));
  removeIfPresent(path.join(dir, 'node_modules'));
}
