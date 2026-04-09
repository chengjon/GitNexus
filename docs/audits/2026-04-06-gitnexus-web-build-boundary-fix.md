# GitNexus Web Build Boundary Fix

Date: 2026-04-06  
Scope: `/opt/claude/GitNexus/gitnexus-web`  
Method: failing build reproduction, local dependency restoration, TypeScript verification, targeted root-cause debugging, and mitigation validation  
Status: fixed and verified in the current repo

## Problem

`gitnexus-web` type-level verification was pending because full production build
verification had not been completed in the current workspace.

Once dependencies were restored, the failure reproduced consistently:

- `npm run build` failed before completing Vite config loading
- direct Vite CLI runs reported `Cannot read file "../../package.json": permission denied`
- the blocked path resolved to `/opt/claude/package.json`

## Root Cause

There were two coupled issues:

1. Vite CLI config loading in this host environment crossed the repository
   boundary and attempted to read parent package metadata outside the repo.
2. PostCSS config discovery also walked upward from `gitnexus-web` and hit the
   same unreadable parent package path.

This was not a TypeScript application failure:

- `npx tsc -b --noEmit` passed once dependencies were present

It was also not a broken Vite config body:

- importing the config module directly succeeded

The failing layer was the config-discovery / config-loading path that assumed
all ancestor package metadata was readable.

## Fix

The repository now uses two local mitigations:

1. explicit local PostCSS config:
   - [postcss.config.mjs](/opt/claude/GitNexus/gitnexus-web/postcss.config.mjs)
2. an explicit build wrapper that imports a local inline Vite config and calls
   Vite with `configFile: false`:
   - [build-vite.mjs](/opt/claude/GitNexus/gitnexus-web/scripts/build-vite.mjs)
   - [vite.inline.config.mjs](/opt/claude/GitNexus/gitnexus-web/vite.inline.config.mjs)

The package build script now uses the wrapper:

- [package.json](/opt/claude/GitNexus/gitnexus-web/package.json)

## Verification

Validated in the current workspace:

- `npx tsc -b --noEmit`
- `npm run build`
- `bash gitnexus-web/scripts/check-log-hygiene.sh`

Observed build result:

- production build completed successfully
- `vite-plugin-static-copy` copied the wasm worker as expected
- Vite emitted existing non-blocking warnings about large chunks and
  `web-tree-sitter` browser externalization

## Residual Notes

- `dev` and `preview` scripts still use the normal Vite CLI entrypoint. This
  slice only fixes the production build path that was blocking validation.
- build warnings about large chunks remain informational follow-up work, not a
  failure in this slice.

## Output Mapping

This fix is operationalized by:

- `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/`
