import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { createAppManualChunks, createWorkerManualChunks } from './scripts/vite-chunking.mjs';
import { createMermaidEntryAlias, onnxRuntimeResolveConditions } from './scripts/vite-resolution.mjs';

const rootDir = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/kuzu-wasm/kuzu_wasm_worker.js',
          dest: 'assets'
        }
      ]
    }),
  ],
  resolve: {
    conditions: onnxRuntimeResolveConditions,
    alias: [
      {
        find: '@',
        replacement: path.resolve(rootDir, './src'),
      },
      {
        find: '@anthropic-ai/sdk/lib/transform-json-schema',
        replacement: path.resolve(rootDir, 'node_modules/@anthropic-ai/sdk/lib/transform-json-schema.mjs'),
      },
      createMermaidEntryAlias(
        path.resolve(rootDir, 'node_modules/mermaid/dist/mermaid.esm.min.mjs'),
      ),
    ],
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['kuzu-wasm'],
    include: ['buffer'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: createAppManualChunks(),
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      allow: ['..'],
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
    rollupOptions: {
      output: {
        manualChunks: createWorkerManualChunks(),
      },
    },
  },
});
