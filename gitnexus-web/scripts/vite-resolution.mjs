export const onnxRuntimeResolveConditions = ['onnxruntime-web-use-extern-wasm'];

export const createMermaidEntryAlias = (mermaidEntryPath) => {
  return {
    find: /^mermaid$/,
    replacement: mermaidEntryPath,
  };
};

export const createTreeSitterBrowserAliasEntries = (emptyBrowserModulePath) => {
  return [
    {
      find: /^fs$/,
      replacement: emptyBrowserModulePath,
    },
    {
      find: /^path$/,
      replacement: emptyBrowserModulePath,
    },
  ];
};
