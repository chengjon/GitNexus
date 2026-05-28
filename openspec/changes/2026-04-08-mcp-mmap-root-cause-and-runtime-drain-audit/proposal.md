## Why

The `Mmap for size 8796093022208 failed` incident now has a verified repair
path, but that result currently lives only in a dedicated audit note and local
verification outputs.

Without a bounded governance slice, later maintainers can still misread the
failure as unresolved index corruption, or miss the remaining boundary that is
outside repository runtime code: a manually terminated host MCP transport bound
to this chat session.

## What Changes

- Record a docs-only audit slice for the MCP mmap failure root cause and runtime
  drain repair
- Register the audit in the technical-debt roadmap so it becomes part of the
  repository's existing governance entry path
- Keep the measured repair evidence, inferred root cause, and historical
  baseline explicitly separated

## Capabilities

### New Capabilities

- `mcp-mmap-root-cause-and-runtime-drain-audit`: Keep the MCP mmap failure
  root-cause and runtime-drain repair record traceable after the underlying
  runtime fix is verified.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused verification evidence:
  - `npm run build`
  - `npx vitest run --config vitest.integration.native.config.ts test/integration/repo-worker.test.ts test/integration/router-backend-worker.test.ts`
  - `npx vitest run gitnexus/test/unit/analyze-scope.test.ts gitnexus/test/unit/mcp-process-registry.test.ts gitnexus/test/unit/mcp-command.test.ts`
  - `node gitnexus/dist/cli/index.js analyze -f --no-register`
