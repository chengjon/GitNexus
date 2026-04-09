## Why

`gitnexus-web` frontend verification was still incomplete because production
builds failed in the current host environment before the app itself was built.

The failure was not caused by TypeScript application code. It came from Vite /
PostCSS config discovery walking outside the repository and hitting unreadable
parent package metadata.

Without a bounded fix, the repo would continue carrying a false-open item in
the remediation roadmap: "frontend build verification still pending" even
though the real blocker is now understood and locally fixable.

## What Changes

- Add explicit local config boundaries for `gitnexus-web` build verification.
- Route the production build through a small Node wrapper that passes inline
  Vite config with `configFile: false`.
- Add an explicit local PostCSS config so config discovery does not walk into
  parent directories outside the repo.
- Record the root cause and validation results in the audit trail.

## Capabilities

### New Capabilities

- `gitnexus-web-build-boundary-fix`: Keep frontend production builds inside the
  repository boundary during verification, even when ancestor package metadata
  outside the repo is unreadable.

### Modified Capabilities

- None.

## Impact

- Affected frontend build files:
  - `gitnexus-web/package.json`
  - `gitnexus-web/postcss.config.mjs`
  - `gitnexus-web/vite.inline.config.mjs`
  - `gitnexus-web/scripts/build-vite.mjs`
- Affected audit and roadmap:
  - `docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
