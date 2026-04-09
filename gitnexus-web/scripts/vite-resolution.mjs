export const onnxRuntimeResolveConditions = ['onnxruntime-web-use-extern-wasm'];

export const createMermaidEntryAlias = (mermaidEntryPath) => {
  return {
    find: /^mermaid$/,
    replacement: mermaidEntryPath,
  };
};
