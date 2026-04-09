import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { createAppManualChunks, createWorkerManualChunks } from './scripts/vite-chunking.mjs';
import { createStaticCopyTargets } from './scripts/vite-static-copy.mjs';
import { createScopedBuildOnWarn } from './scripts/vite-warnings.mjs';
import {
  createMermaidEntryAlias,
  createTreeSitterBrowserAliasEntries,
  onnxRuntimeResolveConditions,
} from './scripts/vite-resolution.mjs';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    viteStaticCopy({
      targets: createStaticCopyTargets(),
    }),
  ],
  resolve: {
    conditions: onnxRuntimeResolveConditions,
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        // Fix for Rollup failing to resolve this deep import from @langchain/anthropic
        find: '@anthropic-ai/sdk/lib/transform-json-schema',
        replacement: path.resolve(__dirname, 'node_modules/@anthropic-ai/sdk/lib/transform-json-schema.mjs'),
      },
      // Keep the Vercel workaround on the bare package only; subpath imports must bypass it.
      createMermaidEntryAlias(
        path.resolve(__dirname, 'node_modules/mermaid/dist/mermaid.esm.min.mjs'),
      ),
      ...createTreeSitterBrowserAliasEntries(
        path.resolve(__dirname, 'src/shims/empty-browser-module.js'),
      ),
    ],
  },
  // Polyfill Buffer for isomorphic-git (Node.js API needed in browser)
  define: {
    global: 'globalThis',
  },
  // Optimize deps - exclude kuzu-wasm from pre-bundling (it has WASM files)
  optimizeDeps: {
    exclude: ['kuzu-wasm'],
    include: ['buffer'],
  },
  build: {
    rollupOptions: {
      onwarn: createScopedBuildOnWarn(),
      output: {
        manualChunks: createAppManualChunks(),
      },
    },
  },
  // Required for KuzuDB WASM (SharedArrayBuffer needs Cross-Origin Isolation)
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    // Allow serving files from node_modules
    fs: {
      allow: ['..'],
    },
  },
  // Also set for preview/production builds
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // Worker configuration
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
