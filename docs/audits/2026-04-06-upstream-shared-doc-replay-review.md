# GitNexus Upstream Shared Doc Replay Review

Date: 2026-04-06  
Scope: `/opt/claude/GitNexus` shared top-level doc and governance surfaces only  
Method: refreshed `git fetch upstream`, updated divergence count, targeted diff review of `README.md`, `AGENTS.md`, `CLAUDE.md`, and `gitnexus/README.md`, then local source cross-check against current CLI/package reality  
Status: review-only follow-up to the earlier upstream doc/governance convergence baseline
Status sync (2026-04-08): after refreshed fetch to `be24010`, the live shared replay baseline moved to `285 209`; no new safe shared-file replay slice was identified, and the current follow-up record is [2026-04-08-upstream-shared-doc-replay-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-upstream-shared-doc-replay-status-sync.md).

## Refresh Summary

- `git fetch upstream` advanced `upstream/main` from `9eeb20b` to `cb772b9`
- refreshed branch divergence is now `280` commits unique to `upstream/main` and `208` commits unique to local `main`
- the shared replay hotspot set remains:
  - [README.md](/opt/claude/GitNexus/README.md)
  - [AGENTS.md](/opt/claude/GitNexus/AGENTS.md)
  - [CLAUDE.md](/opt/claude/GitNexus/CLAUDE.md)
  - [gitnexus/README.md](/opt/claude/GitNexus/gitnexus/README.md)

This review supersedes the earlier same-day "current replay baseline" wording in the baseline report. The live shared-doc replay baseline after the latest fetch is `280 208`.

## High-Level Decision

No additional safe shared-file replay slice should be applied right now.

The previously landed safe local convergence slices remain correct:

- local docs already expose `Codex` as a supported host where local code supports it
- local docs already preserve the current dual-CLI guidance for `Claude Code` and `Codex`
- local `AGENTS.md` / `CLAUDE.md` already use a rewritten structured header that points only to real local governance sources

What remains on `upstream/main` is still mostly code-coupled, product-divergent, or references local files and commands that do not exist in this fork.

## Evidence Review

### 1. Root `README.md`: no new safe replay

Upstream-only themes still visible in the shared diff:

- enterprise SaaS/self-hosted marketing block
- `LadybugDB` storage wording
- a simplified "one command does everything" `analyze` narrative
- development links to `ARCHITECTURE.md`, `RUNBOOK.md`, `GUARDRAILS.md`, `CONTRIBUTING.md`, and `TESTING.md`

Why these should stay deferred:

- this local root still documents `KuzuDB` / `KuzuDB WASM`, which matches the current dependency line and the separate Kuzu review/exit-strategy slices
- local analyze behavior is intentionally documented as index-only by default, with explicit `--with-context` / `--with-gitignore` expansion; upstream wording would erase that distinction
- the referenced root governance docs do not exist locally
- the safe `Codex` support wording from upstream was already forward-ported into local docs earlier in this wave

Supporting local facts:

- [gitnexus/package.json](/opt/claude/GitNexus/gitnexus/package.json) still declares `kuzu`
- [README.md](/opt/claude/GitNexus/README.md) already documents the current local dual-CLI setup and explicit analyze/context behavior
- `ls ARCHITECTURE.md RUNBOOK.md GUARDRAILS.md CONTRIBUTING.md TESTING.md` fails in repo root because those paths do not exist locally

### 2. `AGENTS.md` and `CLAUDE.md`: keep local rewritten header

Upstream-only themes still visible in the shared diff:

- generic structured header referencing absent root docs
- auto-generated symbol/relationship/process counts from upstream state
- simplified GitNexus block that drops local multi-repo `repo` / `cwd` guidance
- blanket `npx gitnexus analyze` wording instead of current local operational guidance

Why these should stay deferred:

- local agent instructions intentionally preserve multi-repo `detect_changes` rules and worktree-aware `cwd` guidance
- current local rewritten header points at real local governance material such as `DEVELOPMENT_RULES.md`
- importing upstream numeric counts would not be trustworthy unless regenerated from the current local index
- importing upstream root-doc references would create broken governance pointers immediately

Supporting local facts:

- [AGENTS.md](/opt/claude/GitNexus/AGENTS.md) and [CLAUDE.md](/opt/claude/GitNexus/CLAUDE.md) already reflect the local structured-header adaptation
- the missing root-doc check above confirms the upstream header would point at nonexistent files

### 3. `gitnexus/README.md`: keep local package README direction

Safe upstream slices were already absorbed earlier:

- `Codex` host support wording
- Windows manual MCP guidance aligned with the current local dual-CLI flow

Remaining upstream-only package README claims still do not match local code:

- `analyze` as an always-refresh-context operation
- `gitnexus index`
- repository-group commands
- `--skip-agents-md`
- `LadybugDB` storage wording
- Ruby support claims
- remote embedding endpoint env vars as documented feature surface

Supporting local facts:

- [gitnexus/src/cli/index.ts](/opt/claude/GitNexus/gitnexus/src/cli/index.ts) includes `setup` support for `Codex`, but does not define `index` or `group` commands
- [gitnexus/src/cli/index.ts](/opt/claude/GitNexus/gitnexus/src/cli/index.ts) documents `analyze` with explicit `--with-context` rather than default context generation
- [gitnexus/src/config/supported-languages.ts](/opt/claude/GitNexus/gitnexus/src/config/supported-languages.ts) still comments out Ruby
- [gitnexus/package.json](/opt/claude/GitNexus/gitnexus/package.json) still depends on `kuzu`, not `LadybugDB`

## Replay Rule After This Review

Only reopen shared-file upstream replay when at least one of these becomes true:

1. local code converges to the upstream-documented capability
2. the referenced root governance docs are added locally
3. an upstream wording slice is independently verified against current local source and test reality

Until then:

- keep the local shared-doc direction as the source of truth
- continue to defer enterprise, `LadybugDB`, Ruby, `index`, repository-group, and similar upstream wording
- keep future replay slices narrow and evidence-backed

## Output Mapping

This review is operationalized by:

- `openspec/changes/2026-04-06-upstream-shared-doc-replay-review/`

It builds on:

- [2026-04-06-upstream-doc-governance-convergence-baseline.md](/opt/claude/GitNexus/docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md)
- `openspec/changes/2026-04-06-upstream-doc-governance-convergence/`
