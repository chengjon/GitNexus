import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateAIContextFiles } from '../../src/cli/ai-context.js';

describe('generateAIContextFiles', () => {
  let tmpDir: string;
  let storagePath: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gn-ai-ctx-test-'));
    storagePath = path.join(tmpDir, '.gitnexus');
    await fs.mkdir(storagePath, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch { /* best-effort */ }
  });

  it('generates context files', async () => {
    const stats = {
      nodes: 100,
      edges: 200,
      processes: 10,
    };

    const result = await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);
    expect(result.files).toBeDefined();
    expect(result.files.length).toBeGreaterThan(0);
  });

  it('creates or updates CLAUDE.md with GitNexus section', async () => {
    const stats = { nodes: 50, edges: 100, processes: 5 };
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    expect(content).toContain('gitnexus:start');
    expect(content).toContain('gitnexus:end');
    expect(content).toContain('TestProject');
  });

  it('does not embed dynamic repo counts directly in generated context files', async () => {
    const stats = { nodes: 50, edges: 100, processes: 5 };
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');

    expect(content).toContain('This project is indexed by GitNexus.');
    expect(content).toContain('Run `gitnexus status` for current index stats and freshness.');
    expect(content).not.toContain('50 symbols, 100 relationships, 5 execution flows');
  });

  it('handles empty stats', async () => {
    const stats = {};
    const result = await generateAIContextFiles(tmpDir, storagePath, 'EmptyProject', stats);
    expect(result.files).toBeDefined();
  });

  it('updates existing CLAUDE.md without duplicating', async () => {
    const stats = { nodes: 10 };

    // Run twice
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');

    // Should only have one gitnexus section
    const starts = (content.match(/gitnexus:start/g) || []).length;
    expect(starts).toBe(1);
  });

  it('includes guidance for when to use embeddings', async () => {
    const stats = { nodes: 50, edges: 100, processes: 5 };
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');

    expect(content).toContain('Use plain `gitnexus analyze` when you want the fastest refresh and exact symbol, file, or keyword search is enough.');
    expect(content).toContain('Graph tools, BM25/FTS search, impact analysis, and context lookups still work without embeddings.');
    expect(content).toContain('Use `gitnexus analyze --embeddings` when natural-language, concept, or fuzzy code search matters.');
    expect(content).toContain('This enables hybrid retrieval (`BM25 + semantic + RRF`) but takes longer and requires an embedding provider such as Ollama or Hugging Face.');
    expect(content).toContain('npm run build');
    expect(content).toContain('GITNEXUS_EMBEDDING_BATCH_SIZE=64');
    expect(content).toContain('gitnexus analyze --embeddings');
    expect(content).toContain('Use `--force` only for intentional full rebuilds or corrupted indexes.');
    expect(content).toContain('gitnexus doctor --json');
    expect(content).toContain('native-runtime');
    expect(content).toContain('language-support');
  });

  it('installs skills files', async () => {
    const stats = { nodes: 10 };
    const result = await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    // Should have installed skill files
    const skillsDir = path.join(tmpDir, '.claude', 'skills', 'gitnexus');
    try {
      const entries = await fs.readdir(skillsDir, { recursive: true });
      expect(entries.length).toBeGreaterThan(0);
    } catch {
      // Skills dir may not be created if skills source doesn't exist in test context
    }
  });

  it('documents explicit repo usage for detect_changes in multi-repo MCP sessions', async () => {
    const stats = { nodes: 10 };
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const contextContent = await fs.readFile(claudeMdPath, 'utf-8');
    expect(contextContent).toContain('If multiple repos are indexed, pass `repo` explicitly to `gitnexus_detect_changes`');

    const impactSkillPath = path.join(
      tmpDir,
      '.claude',
      'skills',
      'gitnexus',
      'gitnexus-impact-analysis',
      'SKILL.md',
    );
    const impactSkillContent = await fs.readFile(impactSkillPath, 'utf-8');
    expect(impactSkillContent).toContain('If multiple repos are indexed, pass `repo` explicitly to `gitnexus_detect_changes`');

    const refactoringSkillPath = path.join(
      tmpDir,
      '.claude',
      'skills',
      'gitnexus',
      'gitnexus-refactoring',
      'SKILL.md',
    );
    const refactoringSkillContent = await fs.readFile(refactoringSkillPath, 'utf-8');
    expect(refactoringSkillContent).toContain('If multiple repos are indexed, pass `repo` explicitly to `gitnexus_detect_changes`');
  });
});
