## Design

This slice intentionally does not introduce new source behavior.

The problem is that dual-CLI source convergence already landed, while the
repository also documents a local direct `dist` entry that depends on a fresh
build. Since `dist/` is ignored at the repository root, stale local build
artifacts do not appear in normal git scope checks.

The repair therefore stays narrow:

1. rebuild `gitnexus` locally
2. verify the direct `dist` entry reflects current Codex + Claude Code behavior
3. record the residual and the operator rule in durable docs

This keeps the fix bounded to local distribution-entry convergence rather than
reopening the earlier source-level dual-CLI slices.
