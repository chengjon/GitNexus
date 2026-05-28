## Why

The repository currently tells users to register GitNexus MCP manually with
hard-coded CLI strings for both Claude Code and Codex:

- `claude mcp add gitnexus -- npx -y gitnexus@latest mcp`
- `codex mcp add gitnexus -- npx -y gitnexus@latest mcp`

Those strings match non-Windows environments, but they do not reuse the actual
platform command source that already exists in `getDefaultMcpEntry()`. On
Windows, the configured entry is `cmd /c npx -y gitnexus@latest mcp`, so the
manual instructions and docs can drift from the real runtime behavior.

Because this repository primarily targets Claude Code and Codex workflows, the
repair should converge both CLI paths together instead of fixing only one side.

## What Changes

- Add a shared formatter that renders manual MCP registration commands from the
  same `McpEntry` data used for configuration.
- Update the Claude Code and Codex host adapters to build manual instructions
  from that shared source instead of hard-coded command strings.
- Sync the shared docs so their manual MCP examples reflect the same
  cross-platform behavior.

## Capabilities

### New Capabilities

- `dual-cli-manual-mcp-command-convergence`: Keep Claude Code and Codex manual
  MCP registration instructions aligned with real platform command entries.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `gitnexus/src/cli/host-adapters/shared.ts`
  - `gitnexus/src/cli/host-adapters/claude-code.ts`
  - `gitnexus/src/cli/host-adapters/codex.ts`
- Affected tests:
  - `gitnexus/test/unit/host-adapters.test.ts`
- Affected docs:
  - `README.md`
  - `gitnexus/README.md`
  - `docs/gitnexus-quick-start-guide.md`
