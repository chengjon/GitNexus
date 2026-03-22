# AI CLI Local Quick Start

This file is the shortest reliable guide for AI agents, AI CLIs, and local coding assistants using the personal GitNexus fork on this machine.

## Assumptions

- Local GitNexus repository: `/opt/claude/GitNexus`
- Active CLI build: `/opt/claude/GitNexus/gitnexus/dist/cli/index.js`
- Linked global command: `gitnexus`
- Personal remote: `chengjon/GitNexus`
- Upstream remote is reference-only and is not the default push target

## Preferred Command Path

Use the linked global command first:

```bash
gitnexus --version
```

If `gitnexus` is unavailable on `PATH`, use:

```bash
node /opt/claude/GitNexus/gitnexus/dist/cli/index.js --version
```

## Per-Project Workflow

In the target repository root:

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build   # Required after local GitNexus source changes
cd /path/to/target-repo
gitnexus analyze
```

If you did not change the local GitNexus source code, skip the rebuild and just run `gitnexus analyze` in the target repo root.

Expected outputs:

- `.gitnexus/`
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/skills/gitnexus/`

Optional project-local workflows:

```bash
gitnexus init-project
gitnexus refresh-context
```

Verification:

```bash
gitnexus status
gitnexus doctor --host codex
gitnexus doctor --host claude
```

## MCP Host Commands

Direct stdio command:

```bash
gitnexus mcp
```

Absolute-path fallback:

```bash
node /opt/claude/GitNexus/gitnexus/dist/cli/index.js mcp
```

## Host Expectations

### Codex

Expected MCP config:

```bash
codex mcp get gitnexus
```

Expected command:

```text
command: gitnexus
args: mcp
```

### Claude Code

Expected MCP config:

```bash
claude mcp get gitnexus
```

Expected command:

```text
Command: gitnexus
Args: mcp
```

## When Rebuild Is Required

Rebuild GitNexus only after source changes inside `/opt/claude/GitNexus/gitnexus/src` or after dependency updates:

```bash
cd /opt/claude/GitNexus/gitnexus
npm install
npm run build
```

## Non-Goals

- Do not assume changes should be proposed to `abhigyanpatwari/GitNexus`
- Do not switch hosts back to `npx -y gitnexus@latest` unless explicitly requested
- Do not treat upstream sync branches as the default workflow
