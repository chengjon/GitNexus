# AI CLI Local Quick Start

This file is the shortest reliable command guide for AI agents, AI CLIs, and
local coding assistants using the personal GitNexus fork on this machine.

The primary maintained CLI surface for this local workflow remains
`Claude Code + Codex`. Other MCP hosts may still work, but they are optional
integrations rather than the main host pair documented here.

## Development Governance

If you are modifying this repository while following this quick start, top-level development governance lives in [`../DEVELOPMENT_RULES.md`](../DEVELOPMENT_RULES.md).

Treat that document as mandatory for migrations, compatibility layers, duplicate implementations, deletions, metric claims, temporary entry points, and backup files.

Audit entrypoint:
[`audits/README.md`](audits/README.md)

Primary repository entrypoint:
[`../README.md`](../README.md)

## Host Scope

For this local GitNexus fork, the primary maintained CLI surface is
`Claude Code + Codex`.

Other MCP hosts may still work via generic MCP setup, but they are optional
integrations rather than the primary support surface for this machine.

This quick start therefore records the concrete local expectations only for the
two maintained CLI hosts: Codex and Claude Code.

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

Expected output after `gitnexus analyze`:

- `.gitnexus/`

If you also need repo-local context files:

```bash
gitnexus analyze --with-context
```

Additional outputs after `--with-context`:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/skills/gitnexus/`

Standard host-readiness checks for the two maintained CLI hosts:

```bash
gitnexus doctor --host codex --repo .
gitnexus doctor --host claude-code --repo .
```

Optional project-local workflows:

```bash
gitnexus init-project
gitnexus refresh-context
```

Additional verification:

```bash
gitnexus status
```

## Language Support Availability

GitNexus has two language-support tiers:

- Built-in grammars:
  TypeScript, JavaScript, Python, Java, C, C++, C#, Go, Rust, PHP
- Optional native grammars:
  Kotlin, Swift

Kotlin and Swift are environment-dependent optional grammars. Do not describe
them as universally available without checking the current host.

Use `gitnexus doctor` or `gitnexus doctor --json` and inspect the
`language-support` check:

- `status` reports whether the grammar is currently available
- `supportLevel` reports whether support is built-in or optional
- `reasonCode` explains why an optional grammar is unavailable on this host

## detect_changes Guidance

Use `repo` explicitly in multi-repo sessions:

```text
gitnexus_detect_changes({ scope: "staged", repo: "target-repo" })
```

If the active worktree does not match the MCP server cwd, also pass `cwd`:

```text
gitnexus_detect_changes({ scope: "staged", repo: "target-repo", cwd: "/path/to/worktree" })
```

Codex is more likely to need the explicit worktree hint. For Claude Code, add `cwd` when `detect_changes` metadata shows the server cwd does not match the active worktree.

## Related Entry Points

- [`../README.md`](../README.md) - primary repository entrypoint
- [`gitnexus-quick-start-guide.md`](gitnexus-quick-start-guide.md) - Chinese quick start guide
- [`audits/README.md`](audits/README.md) - status-verification and audit index

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

This section intentionally lists only the primary maintained CLI pair for this
local fork.

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
- Do not read this quick start as an equal-support contract for every external
  MCP host
