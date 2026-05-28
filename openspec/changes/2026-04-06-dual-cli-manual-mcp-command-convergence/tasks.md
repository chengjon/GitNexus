## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the dual-CLI manual MCP command convergence slice
- [x] 1.2 Record the scoped design and capability delta for Claude Code and Codex only

## 2. Test-First Coverage

- [x] 2.1 Add a failing Windows-specific manual-instruction assertion for `createClaudeCodeAdapter`
- [x] 2.2 Add a failing Windows-specific manual-instruction assertion for `createCodexAdapter`
- [x] 2.3 Run the targeted host adapter tests and confirm the new assertions fail before implementation

## 3. Shared Formatter Implementation

- [x] 3.1 Add a shared helper that renders a manual command string from `McpEntry`
- [x] 3.2 Update the Claude Code adapter to use the shared helper
- [x] 3.3 Update the Codex adapter to use the shared helper

## 4. Doc Convergence

- [x] 4.1 Sync `README.md` manual setup text with the dual-CLI cross-platform behavior
- [x] 4.2 Sync `gitnexus/README.md` manual setup text with the same behavior
- [x] 4.3 Sync `docs/gitnexus-quick-start-guide.md` with the same behavior

## 5. Validation

- [x] 5.1 Re-run the targeted host adapter tests and confirm they pass
- [x] 5.2 Validate the new OpenSpec change
- [x] 5.3 Re-run scoped repository status and confirm only intended files changed for this slice
