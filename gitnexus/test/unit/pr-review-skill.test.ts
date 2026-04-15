import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('gitnexus PR review skill docs', () => {
  it('document current detect_changes repo and cwd guidance in both source and installed skill copies', async () => {
    const skillPaths = [
      path.join(process.cwd(), 'skills', 'gitnexus-pr-review.md'),
      path.join(process.cwd(), '..', '.claude', 'skills', 'gitnexus', 'gitnexus-pr-review', 'SKILL.md'),
    ];

    for (const skillPath of skillPaths) {
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('gitnexus_detect_changes({scope: "compare", base_ref: "main", repo: "<repo-name>"})');
      expect(content).toContain('In multi-repo MCP sessions, pass `repo` explicitly');
      expect(content).toContain('In worktrees, also pass `cwd` if the MCP server may not be in the PR worktree');
      expect(content).toContain('gitnexus_detect_changes({scope: "compare", base_ref: "main", repo: "<repo-name>", cwd: "/path/to/repo/.worktrees/pr-42"})');
    }
  });

  it('documents PR governance scope and validation review fields in both source and installed skill copies', async () => {
    const skillPaths = [
      path.join(process.cwd(), 'skills', 'gitnexus-pr-review.md'),
      path.join(process.cwd(), '..', '.claude', 'skills', 'gitnexus', 'gitnexus-pr-review', 'SKILL.md'),
    ];

    for (const skillPath of skillPaths) {
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Read the PR governance fields first: Line Scope, Workline Lane, Scope Deviations, Current Source of Truth');
      expect(content).toContain('Cross-check Validation notes: Execution Path Verification, Regression Coverage, Current Docs / Facts Updated');
      expect(content).toContain('## PR Governance Read');
      expect(content).toContain('`Line Scope` tells you the intended slice boundary.');
      expect(content).toContain('`Workline Lane` should be exactly one of `feature`, `governance`, or `refactor`.');
      expect(content).toContain('`Current Source of Truth` should start with `OpenSpec`');
      expect(content).toContain('`Execution Path Verification` should prove the changed runtime, CLI, API, or user-facing path was actually exercised.');
    }
  });
});
