const createManualChunks = (groups) => {
  return (id) => {
    if (!id.includes('/node_modules/')) {
      return;
    }

    for (const [chunkName, patterns] of groups) {
      if (patterns.some((pattern) => id.includes(pattern))) {
        return chunkName;
      }
    }
  };
};

const appChunkGroups = [
  ['vendor-react', ['/node_modules/react/', '/node_modules/react-dom/', '/node_modules/scheduler/', '/node_modules/lucide-react/']],
  ['vendor-cytoscape', ['/node_modules/cytoscape/', '/node_modules/cytoscape-cose-bilkent/', '/node_modules/cytoscape-fcose/', '/node_modules/layout-base/', '/node_modules/cose-base/']],
  ['vendor-graph', ['/node_modules/sigma/', '/node_modules/graphology', '/node_modules/d3-', '/node_modules/cose-bilkent/', '/node_modules/dagre/', '/node_modules/@dagrejs/']],
  ['vendor-text', ['/node_modules/react-markdown/', '/node_modules/remark-', '/node_modules/rehype-', '/node_modules/micromark', '/node_modules/mdast-', '/node_modules/hast-', '/node_modules/unist-', '/node_modules/unified/', '/node_modules/vfile', '/node_modules/property-information/', '/node_modules/space-separated-tokens/', '/node_modules/comma-separated-tokens/', '/node_modules/katex/', '/node_modules/react-syntax-highlighter/', '/node_modules/refractor/', '/node_modules/prismjs/']],
  ['vendor-git', ['/node_modules/isomorphic-git/', '/node_modules/@isomorphic-git/', '/node_modules/jszip/']],
];

const workerChunkGroups = [
  ['worker-langchain-vendor', ['/node_modules/zod/', '/node_modules/@cfworker/json-schema/', '/node_modules/uuid/', '/node_modules/p-queue/', '/node_modules/mustache/', '/node_modules/ansi-styles/', '/node_modules/camelcase/', '/node_modules/decamelize/']],
  ['worker-langchain-core', ['/node_modules/@langchain/core/', '/node_modules/langsmith/']],
  ['worker-langgraph', ['/node_modules/@langchain/langgraph/', '/node_modules/@langchain/langgraph-checkpoint/', '/node_modules/@langchain/langgraph-sdk/']],
  ['worker-llm-providers', ['/node_modules/langchain/', '/node_modules/@langchain/openai/', '/node_modules/@langchain/anthropic/', '/node_modules/@langchain/google-genai/', '/node_modules/@langchain/ollama/', '/node_modules/openai/', '/node_modules/@anthropic-ai/', '/node_modules/@google/']],
  ['worker-transformers', ['/node_modules/@huggingface/transformers/', '/node_modules/@xenova/']],
  ['worker-onnx-support', ['/node_modules/onnxruntime-common/', '/node_modules/protobufjs/', '/node_modules/flatbuffers/', '/node_modules/long/', '/node_modules/platform/', '/node_modules/guid-typescript/']],
  ['worker-onnx', ['/node_modules/onnxruntime-', '/node_modules/onnxruntime/']],
  ['worker-tree-sitter', ['/node_modules/web-tree-sitter/', '/node_modules/tree-sitter-wasms/']],
  ['worker-graph', ['/node_modules/graphology', '/node_modules/d3-', '/node_modules/sigma/', '/node_modules/cose-bilkent/', '/node_modules/dagre/', '/node_modules/@dagrejs/']],
  ['worker-zip', ['/node_modules/jszip/']],
];

export const createAppManualChunks = () => createManualChunks(appChunkGroups);
export const createWorkerManualChunks = () => createManualChunks(workerChunkGroups);
