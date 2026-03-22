import { describe, it, expect } from 'vitest';
import { runPipelineFromRepo, shouldUseWorkerPool } from '../../src/core/ingestion/pipeline.js';

describe('pipeline', () => {
  it('exports runPipelineFromRepo function', () => {
    expect(typeof runPipelineFromRepo).toBe('function');
  });

  it('disables worker pool under vitest', () => {
    expect(shouldUseWorkerPool()).toBe(false);
  });
});
