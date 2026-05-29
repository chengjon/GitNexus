# AI CLI Local Quick Start

This file is the shortest reliable command guide for AI agents, AI CLIs, and
local coding assistants using the personal GitNexus fork on this machine.

The primary maintained CLI surface for this local workflow remains
`Claude Code + Codex`. Other MCP hosts may still work, but they are optional
integrations rather than the main host pair documented here.

## Development Governance

If you are modifying this repository while following this quick start, top-level development governance lives in [`../DEVELOPMENT_RULES.md`](../DEVELOPMENT_RULES.md).

Treat that document as mandatory for migrations, compatibility layers, duplicate implementations, deletions, metric claims, temporary entry points, and backup files.

When the change becomes a PR, also use the lightweight fields in
[`../.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md):

- one explicit `Line Scope`
- one `Workline Lane`
- one `Current Source of Truth`
- `Execution Path Verification`, `Regression Coverage`, and `Current Docs / Facts Updated`

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

For routine index refreshes, use index-only mode in the target repository root:

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build   # Required after local GitNexus source changes
cd /path/to/target-repo
gitnexus analyze --index-only
```

If you did not change the local GitNexus source code, skip the rebuild and just
run `gitnexus analyze --index-only` in the target repo root.

Expected output after `gitnexus analyze --index-only`:

- `.gitnexus/`

Plain `gitnexus analyze` may update repo-local context files. As of
`d4636249`, this local fork preserves `AGENTS.md`, `CLAUDE.md`, and tracked
GitNexus skill files that contain `<!-- gitnexus:keep -->`; `--index-only` is
still the default low-churn command when context regeneration is not the goal.

If you intentionally need repo-local context files:

```bash
gitnexus analyze
```

Additional outputs after plain `gitnexus analyze`:

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

## Missing Graph Store Recovery

Current GitNexus stores its graph in LadybugDB at `.gitnexus/lbug`. The old
KuzuDB path `.gitnexus/kuzu` is retired migration state. A missing
`.gitnexus/kuzu` directory is not a failure and should not be recreated.

The broken state that requires recovery is:

```bash
.gitnexus/meta.json exists
.gitnexus/lbug is missing or only lbug sidecar files remain
```

Classify a target project from its root:

```bash
test -f .gitnexus/meta.json && echo "meta: yes" || echo "meta: no"
test -e .gitnexus/lbug && echo "lbug: yes" || echo "lbug: no"
test -e .gitnexus/kuzu && echo "old kuzu: yes" || echo "old kuzu: no"
```

Interpretation:

- `old kuzu: no` is normal on current GitNexus.
- `meta: yes` and `lbug: yes` means the current graph store exists.
- `meta: yes` and `lbug: no` means force a rebuild.
- `old kuzu: yes` and `lbug: no` means an old Kuzu index has not been rebuilt
  into the current LadybugDB store.

Recover affected projects one at a time:

```bash
cd /path/to/target-repo
gitnexus analyze --force --index-only --drop-embeddings --workers 0
gitnexus status
```

When operating on an external project, keep the recovery boundary narrow:

- Running `gitnexus analyze`, `gitnexus status`, and process checks is recovery
  work.
- Editing target-project files, including `.gitnexusignore`, `.gitignore`,
  `AGENTS.md`, or host-specific context files, requires explicit project-owner
  approval.
- Committing, amending, fetching, pushing, or otherwise changing the target
  project's git state is out of scope unless explicitly requested.

Do not use `--repair-fts` when `.gitnexus/lbug` is missing; FTS repair requires
an existing graph store. Do not use `gitnexus index` to rebuild a missing graph
store; `index` only registers an index that already exists.

If `--workers 0` runs for a long time without creating `.gitnexus/lbug`, the
repo may contain generated JavaScript, bundled documentation, or demo assets
that stall a native parser path. Stop that attempt and rerun the recovery with
bounded workers so GitNexus can quarantine the offending files:

```bash
gitnexus analyze --force --index-only --drop-embeddings \
  --workers 2 \
  --worker-timeout 20 \
  --max-file-size 256
```

If generated or bundled assets still stall parsing after bounded-worker
recovery, a GitNexus-only `.gitnexusignore` entry may be the right long-term
project fix. Add or commit that file only after explicit approval for the target
project.

If a native worker abort message appears, keep using the same GitNexus install
channel. For this local-source deployment, update by pulling or merging the
local checkout, run `npm run build` in `/opt/claude/GitNexus/gitnexus`, then
restart MCP and CLI clients. Do not switch the affected project to
`npm install -g gitnexus@latest` unless you intentionally want to leave the
local-source workflow.

If a project still fails after all GitNexus analyze and MCP processes have
stopped, remove only generated graph artifacts in that project and rebuild:

```bash
cd /path/to/target-repo
rm -f .gitnexus/lbug \
      .gitnexus/lbug.wal \
      .gitnexus/lbug.lock \
      .gitnexus/lbug.shadow \
      .gitnexus/lbug.wal.checkpoint \
      .gitnexus/lbug.init.lock

gitnexus analyze --force --index-only --drop-embeddings --workers 0
```

Run the removal only after confirming the current directory is the target
project root.

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

After rebuilding local GitNexus source, restart MCP clients so they load the new
`dist/cli/index.js`. During local-source recovery, do not switch MCP back to
`npx -y gitnexus@latest`.

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
