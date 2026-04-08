## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the local dual-CLI `dist` entry convergence slice
- [x] 1.2 Record that this slice is about local distribution-entry refresh, not new source behavior

## 2. Residual Confirmation

- [x] 2.1 Confirm the local `dist` entry can lag behind current dual-CLI source changes
- [x] 2.2 Record the residual in a dedicated audit document

## 3. Local Distribution Refresh

- [x] 3.1 Rebuild `gitnexus` so the local `dist` entry is refreshed
- [x] 3.2 Verify `node dist/cli/index.js setup --help` now includes `Codex`
- [x] 3.3 Verify `node dist/cli/index.js doctor --json --host codex --repo .` includes the current Codex guidance
- [x] 3.4 Verify `node dist/cli/index.js doctor --json --host claude-code --repo .` includes the current Claude Code guidance

## 4. Validation

- [x] 4.1 Run the targeted `doctor` and host-adapter unit tests
- [x] 4.2 Run the targeted CLI integration test for setup help
- [x] 4.3 Validate the new OpenSpec change
- [x] 4.4 Update the technical-debt roadmap with the new residual-fix status
