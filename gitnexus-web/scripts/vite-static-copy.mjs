export const createStaticCopyTargets = () => {
  return [
    {
      src: 'node_modules/kuzu-wasm/kuzu_wasm_worker.js',
      dest: 'assets',
    },
    {
      src: 'node_modules/mermaid/dist/**/*.mjs',
      dest: 'vendor/mermaid',
    },
  ];
};
