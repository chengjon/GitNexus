import type { RepoMeta } from '../storage/repo-manager.js';
import type { PipelineResult } from '../types/pipeline.js';
import type { GeneratedSkillInfo } from './skill-gen.js';

export interface AnalyzeFinalizationScope {
  registerRepo: boolean;
  updateGitignore: boolean;
  refreshContext: boolean;
}

export interface AnalyzeFinalizationStats {
  nodes: number;
  edges: number;
  embeddings: number;
}

export interface AnalyzeFinalizationInput {
  repoPath: string;
  storagePath: string;
  projectName: string;
  currentCommit: string;
  gitNexusVersion: string;
  scope: AnalyzeFinalizationScope;
  generateSkills: boolean;
  pipelineResult: PipelineResult;
  stats: AnalyzeFinalizationStats;
}

export interface AnalyzeFinalizationDeps {
  saveMeta: (storagePath: string, meta: RepoMeta) => Promise<void>;
  registerRepo: (repoPath: string, meta: RepoMeta) => Promise<void>;
  addToGitignore: (repoPath: string) => Promise<void>;
  generateSkillFiles: (
    repoPath: string,
    projectName: string,
    pipelineResult: PipelineResult,
  ) => Promise<{ skills: GeneratedSkillInfo[]; outputPath: string }>;
  generateAIContextFiles: (
    repoPath: string,
    storagePath: string,
    projectName: string,
    stats: {
      files?: number;
      nodes?: number;
      edges?: number;
      communities?: number;
      clusters?: number;
      processes?: number;
    },
    generatedSkills?: GeneratedSkillInfo[],
  ) => Promise<{ files: string[] }>;
}

type CommunityLike = {
  heuristicLabel?: string | null;
  label?: string | null;
  symbolCount?: number | null;
};

export function countAggregatedClusters(communities: CommunityLike[] = []): number {
  const groups = new Map<string, number>();
  for (const community of communities) {
    const label = community.heuristicLabel || community.label || 'Unknown';
    const symbolCount = community.symbolCount || 0;
    groups.set(label, (groups.get(label) || 0) + symbolCount);
  }
  return Array.from(groups.values()).filter((count) => count >= 5).length;
}

export async function finalizeAnalyzeArtifacts(
  input: AnalyzeFinalizationInput,
  deps: AnalyzeFinalizationDeps,
): Promise<{
  meta: RepoMeta;
  generatedSkills: GeneratedSkillInfo[];
  aiContext: { files: string[] };
  aggregatedClusterCount: number;
  communityCount: number;
  processCount: number;
}> {
  const communityCount = input.pipelineResult.communityResult?.stats.totalCommunities || 0;
  const processCount = input.pipelineResult.processResult?.stats.totalProcesses || 0;
  const aggregatedClusterCount = countAggregatedClusters(
    input.pipelineResult.communityResult?.communities || [],
  );

  const meta: RepoMeta = {
    repoPath: input.repoPath,
    lastCommit: input.currentCommit,
    indexedAt: new Date().toISOString(),
    toolVersion: input.gitNexusVersion,
    stats: {
      files: input.pipelineResult.totalFileCount,
      nodes: input.stats.nodes,
      edges: input.stats.edges,
      communities: communityCount,
      processes: processCount,
      embeddings: input.stats.embeddings,
    },
  };
  await deps.saveMeta(input.storagePath, meta);

  if (input.scope.registerRepo) {
    await deps.registerRepo(input.repoPath, meta);
  }

  if (input.scope.updateGitignore) {
    await deps.addToGitignore(input.repoPath);
  }

  let generatedSkills: GeneratedSkillInfo[] = [];
  if (input.generateSkills && input.pipelineResult.communityResult) {
    const skillResult = await deps.generateSkillFiles(
      input.repoPath,
      input.projectName,
      input.pipelineResult,
    );
    generatedSkills = skillResult.skills;
  }

  let aiContext = { files: [] as string[] };
  if (input.scope.refreshContext) {
    aiContext = await deps.generateAIContextFiles(
      input.repoPath,
      input.storagePath,
      input.projectName,
      {
        files: input.pipelineResult.totalFileCount,
        nodes: input.stats.nodes,
        edges: input.stats.edges,
        communities: communityCount,
        clusters: aggregatedClusterCount,
        processes: processCount,
      },
      generatedSkills,
    );
  }

  return {
    meta,
    generatedSkills,
    aiContext,
    aggregatedClusterCount,
    communityCount,
    processCount,
  };
}
