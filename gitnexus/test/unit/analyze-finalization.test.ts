import { describe, expect, it, vi } from 'vitest';

import {
  countAggregatedClusters,
  finalizeAnalyzeArtifacts,
} from '../../src/cli/analyze-finalization.js';

describe('analyze finalization helpers', () => {
  it('aggregates communities by label and counts only significant cluster groups', () => {
    expect(countAggregatedClusters([
      { heuristicLabel: 'API', label: 'API', symbolCount: 3 },
      { heuristicLabel: 'API', label: 'API duplicate', symbolCount: 2 },
      { heuristicLabel: 'UI', label: 'UI', symbolCount: 4 },
      { heuristicLabel: '', label: 'Unknown-ish', symbolCount: 5 },
    ] as any)).toBe(2);
  });

  it('persists metadata without refreshing repo context unless explicitly requested', async () => {
    const saveMeta = vi.fn(async () => undefined);
    const registerRepo = vi.fn(async () => undefined);
    const addToGitignore = vi.fn(async () => undefined);
    const addToGitInfoExclude = vi.fn(async () => undefined);
    const generateSkillFiles = vi.fn(async () => ({
      skills: [{ name: 'api', label: 'API', symbolCount: 5, fileCount: 2 }],
      outputPath: '/tmp/repo/.claude/skills/generated',
    }));
    const generateAIContextFiles = vi.fn(async () => ({
      files: ['AGENTS.md', 'CLAUDE.md'],
    }));

    const result = await finalizeAnalyzeArtifacts({
      repoPath: '/tmp/repo',
      storagePath: '/tmp/repo/.gitnexus',
      projectName: 'repo',
      currentCommit: 'abc123',
      gitNexusVersion: '1.4.0',
      scope: {
        registerRepo: true,
        updateGitignore: false,
        refreshContext: false,
      },
      generateSkills: true,
      pipelineResult: {
        totalFileCount: 42,
        communityResult: {
          communities: [
            { heuristicLabel: 'API', label: 'API', symbolCount: 3 },
            { heuristicLabel: 'API', label: 'API 2', symbolCount: 2 },
            { heuristicLabel: 'UI', label: 'UI', symbolCount: 1 },
          ],
          stats: {
            totalCommunities: 3,
          },
        },
        processResult: {
          stats: {
            totalProcesses: 7,
          },
        },
      } as any,
      stats: {
        nodes: 120,
        edges: 240,
        embeddings: 9,
      },
    }, {
      saveMeta,
      registerRepo,
      addToGitignore,
      addToGitInfoExclude,
      generateSkillFiles,
      generateAIContextFiles,
    });

    expect(saveMeta).toHaveBeenCalledTimes(1);
    expect(registerRepo).toHaveBeenCalledTimes(1);
    expect(addToGitignore).not.toHaveBeenCalled();
    expect(addToGitInfoExclude).toHaveBeenCalledTimes(1);
    expect(generateSkillFiles).toHaveBeenCalledTimes(1);
    expect(generateAIContextFiles).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      generatedSkills: [{ name: 'api', label: 'API', symbolCount: 5, fileCount: 2 }],
      aiContext: { files: [] },
    }));
  });

  it('refreshes repo context when explicitly requested', async () => {
    const saveMeta = vi.fn(async () => undefined);
    const registerRepo = vi.fn(async () => undefined);
    const addToGitignore = vi.fn(async () => undefined);
    const addToGitInfoExclude = vi.fn(async () => undefined);
    const generateSkillFiles = vi.fn(async () => ({
      skills: [{ name: 'api', label: 'API', symbolCount: 5, fileCount: 2 }],
      outputPath: '/tmp/repo/.claude/skills/generated',
    }));
    const generateAIContextFiles = vi.fn(async () => ({
      files: ['AGENTS.md', 'CLAUDE.md'],
    }));

    const result = await finalizeAnalyzeArtifacts({
      repoPath: '/tmp/repo',
      storagePath: '/tmp/repo/.gitnexus',
      projectName: 'repo',
      currentCommit: 'abc123',
      gitNexusVersion: '1.4.0',
      scope: {
        registerRepo: true,
        updateGitignore: true,
        refreshContext: true,
      },
      generateSkills: true,
      pipelineResult: {
        totalFileCount: 42,
        communityResult: {
          communities: [
            { heuristicLabel: 'API', label: 'API', symbolCount: 3 },
            { heuristicLabel: 'API', label: 'API 2', symbolCount: 2 },
            { heuristicLabel: 'UI', label: 'UI', symbolCount: 1 },
          ],
          stats: {
            totalCommunities: 3,
          },
        },
        processResult: {
          stats: {
            totalProcesses: 7,
          },
        },
      } as any,
      stats: {
        nodes: 120,
        edges: 240,
        embeddings: 9,
      },
    }, {
      saveMeta,
      registerRepo,
      addToGitignore,
      addToGitInfoExclude,
      generateSkillFiles,
      generateAIContextFiles,
    });

    expect(saveMeta).toHaveBeenCalledWith('/tmp/repo/.gitnexus', expect.objectContaining({
      repoPath: '/tmp/repo',
      lastCommit: 'abc123',
      toolVersion: '1.4.0',
      stats: expect.objectContaining({
        files: 42,
        nodes: 120,
        edges: 240,
        communities: 3,
        processes: 7,
        embeddings: 9,
      }),
    }));
    expect(registerRepo).toHaveBeenCalledTimes(1);
    expect(addToGitignore).toHaveBeenCalledTimes(1);
    expect(addToGitInfoExclude).not.toHaveBeenCalled();
    expect(generateSkillFiles).toHaveBeenCalledWith('/tmp/repo', 'repo', expect.any(Object));
    expect(generateAIContextFiles).toHaveBeenCalledWith(
      '/tmp/repo',
      '/tmp/repo/.gitnexus',
      'repo',
      expect.objectContaining({
        files: 42,
        nodes: 120,
        edges: 240,
        communities: 3,
        clusters: 1,
        processes: 7,
      }),
      [{ name: 'api', label: 'API', symbolCount: 5, fileCount: 2 }],
    );
    expect(result).toEqual(expect.objectContaining({
      aggregatedClusterCount: 1,
      generatedSkills: [{ name: 'api', label: 'API', symbolCount: 5, fileCount: 2 }],
      aiContext: { files: ['AGENTS.md', 'CLAUDE.md'] },
      communityCount: 3,
      processCount: 7,
    }));
  });

  it('skips optional side effects when disabled', async () => {
    const saveMeta = vi.fn(async () => undefined);
    const registerRepo = vi.fn(async () => undefined);
    const addToGitignore = vi.fn(async () => undefined);
    const addToGitInfoExclude = vi.fn(async () => undefined);
    const generateSkillFiles = vi.fn(async () => ({
      skills: [],
      outputPath: '/tmp/repo/.claude/skills/generated',
    }));
    const generateAIContextFiles = vi.fn(async () => ({
      files: [],
    }));

    const result = await finalizeAnalyzeArtifacts({
      repoPath: '/tmp/repo',
      storagePath: '/tmp/repo/.gitnexus',
      projectName: 'repo',
      currentCommit: 'abc123',
      gitNexusVersion: '1.4.0',
      scope: {
        registerRepo: false,
        updateGitignore: false,
        refreshContext: false,
      },
      generateSkills: false,
      pipelineResult: {
        totalFileCount: 3,
      } as any,
      stats: {
        nodes: 5,
        edges: 8,
        embeddings: 0,
      },
    }, {
      saveMeta,
      registerRepo,
      addToGitignore,
      addToGitInfoExclude,
      generateSkillFiles,
      generateAIContextFiles,
    });

    expect(saveMeta).toHaveBeenCalledTimes(1);
    expect(registerRepo).not.toHaveBeenCalled();
    expect(addToGitignore).not.toHaveBeenCalled();
    expect(addToGitInfoExclude).toHaveBeenCalledTimes(1);
    expect(generateSkillFiles).not.toHaveBeenCalled();
    expect(generateAIContextFiles).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      aggregatedClusterCount: 0,
      generatedSkills: [],
      aiContext: { files: [] },
      communityCount: 0,
      processCount: 0,
    }));
  });
});
