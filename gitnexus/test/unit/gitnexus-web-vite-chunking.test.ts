import { describe, expect, it } from 'vitest';
import { createAppManualChunks, createWorkerManualChunks } from '../../../gitnexus-web/scripts/vite-chunking.mjs';

describe('gitnexus-web vite chunking', () => {
  it('keeps browser framework runtime out of the main app entry chunk', () => {
    const appChunks = createAppManualChunks();

    expect(appChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/react/index.js')).toBe('vendor-react');
    expect(appChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/react-dom/client.js')).toBe('vendor-react');
    expect(appChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/lucide-react/dist/esm/icons/search.js')).toBe('vendor-react');
  });

  it('keeps mermaid cytoscape dependencies out of the lazy mermaid entry chunk', () => {
    const appChunks = createAppManualChunks();

    expect(appChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/cytoscape/dist/cytoscape.esm.mjs')).toBe('vendor-cytoscape');
    expect(appChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/cytoscape-cose-bilkent/cytoscape-cose-bilkent.js')).toBe('vendor-cytoscape');
    expect(appChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/layout-base/layout-base.js')).toBe('vendor-cytoscape');
  });

  it('preserves existing worker chunk boundaries for heavy ai dependencies', () => {
    const workerChunks = createWorkerManualChunks();

    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/@langchain/core/dist/utils/async_caller.js')).toBe('worker-langchain-core');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/@langchain/core/dist/messages/base.js')).toBe('worker-langchain-core');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/@langchain/core/dist/runnables/base.js')).toBe('worker-langchain-core');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/@langchain/core/dist/prompts/chat.js')).toBe('worker-langchain-core');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/@langchain/core/dist/output_parsers/string.js')).toBe('worker-langchain-core');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/langsmith/dist/index.js')).toBe('worker-langchain-core');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/onnxruntime-web/dist/ort.all.min.mjs')).toBe('worker-onnx');
  });

  it('keeps heavy ONNX support libraries out of the main worker-onnx runtime chunk', () => {
    const workerChunks = createWorkerManualChunks();

    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/onnxruntime-common/dist/cjs/index.js')).toBe('worker-onnx-support');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/protobufjs/minimal.js')).toBe('worker-onnx-support');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/flatbuffers/js/flatbuffers.js')).toBe('worker-onnx-support');
    expect(workerChunks('/opt/claude/GitNexus/gitnexus-web/node_modules/onnxruntime-web/dist/ort.all.min.mjs')).toBe('worker-onnx');
  });
});
