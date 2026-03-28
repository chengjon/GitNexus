import fs from 'fs/promises';
import path from 'path';

import type { ModuleTreeNode } from './module-tree/types.js';

export async function readProjectInfo(repoPath: string): Promise<string> {
  const candidates = ['package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod', 'pom.xml', 'build.gradle'];
  const lines: string[] = [`Project: ${path.basename(repoPath)}`];

  for (const file of candidates) {
    const fullPath = path.join(repoPath, file);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      if (file === 'package.json') {
        const pkg = JSON.parse(content);
        if (pkg.name) lines.push(`Name: ${pkg.name}`);
        if (pkg.description) lines.push(`Description: ${pkg.description}`);
        if (pkg.scripts) lines.push(`Scripts: ${Object.keys(pkg.scripts).join(', ')}`);
      } else {
        // Include first 500 chars of other config files
        lines.push(`\n${file}:\n${content.slice(0, 500)}`);
      }
      break;
    } catch {
      continue;
    }
  }

  for (const readme of ['README.md', 'readme.md', 'README.txt']) {
    try {
      const content = await fs.readFile(path.join(repoPath, readme), 'utf-8');
      lines.push(`\nREADME excerpt:\n${content.slice(0, 1000)}`);
      break;
    } catch {
      continue;
    }
  }

  return lines.join('\n');
}

export function extractModuleFiles(tree: ModuleTreeNode[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      result[node.name] = node.children.flatMap((child) => child.files);
      for (const child of node.children) {
        result[child.name] = child.files;
      }
    } else {
      result[node.name] = node.files;
    }
  }
  return result;
}
