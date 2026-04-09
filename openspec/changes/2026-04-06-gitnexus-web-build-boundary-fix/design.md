# GitNexus Web Build Boundary Fix Design

## Goal

Make `gitnexus-web` production build verification pass in the current repo
without changing application behavior.

## Design Principles

### 1. Fix the boundary, not the app

The app's TypeScript code was already healthy. The failure sat in config
loading. The design therefore changes build/config boundaries, not app logic.

### 2. Keep config discovery local

Build tooling should not need to walk into ancestor directories outside the
repository to find package metadata or PostCSS configuration.

### 3. Use the smallest stable bypass

Instead of rewriting Vite internals, the build path uses Vite's normal build
API with `configFile: false` and a local imported config object.

## Verification

This change is complete when:

1. `npx tsc -b --noEmit` passes
2. `npm run build` passes
3. targeted log-hygiene verification still passes
