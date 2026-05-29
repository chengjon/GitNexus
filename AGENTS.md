<!-- version: 1.2.0 -->
<!-- local structured header adapted from upstream template -->

Last reviewed: 2026-04-15

## Repository Development Rules

This repository's top-level development governance lives in `DEVELOPMENT_RULES.md`.

For any work involving migrations, duplicate implementations, compatibility layers, deletions, metric claims, temporary entry points, or backup files, `DEVELOPMENT_RULES.md` is mandatory and takes precedence over local convenience patterns.

**Project:** GitNexus
**Environment:** local development fork
**Maintainer:** repository maintainers and current fork operators

## Scope

| | |
|--|--|
| **Reads** | Repository paths needed for the task, including `gitnexus/`, `gitnexus-web/`, `eval/`, plugin packages, docs, and OpenSpec artifacts. |
| **Writes** | Only files required for the requested change. Keep diffs minimal and preserve unrelated user modifications. |
| **Executes** | `npm`, `npx`, `node`, `git`, `openspec`, and shell utilities used by the documented local workflows. |
| **Off-limits** | Secrets, unrelated repositories, destructive history edits without explicit approval, and invented docs or configs that do not exist locally. |

## Model Configuration

- Prefer explicit named model selections where the host supports them.
- Do not rely on vague `latest` or `auto` assumptions when reproducibility matters.
- The GitNexus CLI/indexer itself does not require an LLM. Optional AI flows depend on user-managed provider or host configuration.

## Execution Sequence For Complex Tasks

Before substantial multi-step work:

1. State which rules from this file, `DEVELOPMENT_RULES.md`, and the GitNexus block apply.
2. State the current scope boundaries for reads, writes, and anything intentionally deferred.
3. State which verification commands will prove the claimed result.

On long threads, restate the active scope before major edits so local governance and current-task rules do not get diluted.

Every non-trivial workline MUST also state a one-line `Line Scope` contract before implementation:

- `Line Scope: this line only delivers <target feature or target slice>; do not add unrelated governance, docs churn, refactors, naming cleanup, formatting-only edits, or side quests.`
- Treat that line-scope statement as a hard boundary, not a soft preference. If new work falls outside it, split it into a later line instead of extending the current one.

## Delivery Priority and Docs Governance

- Day-to-day delivery priority is locked as: functional testing and iteration-to-release work first, historical document convergence second.
- Historical document governance remains active, but only as low-intensity background maintenance. It MUST NOT displace core execution, module-boundary acceptance, critical-path coverage, or release validation work.
- Default resource allocation after planning should favor:
  - end-to-end execution self-test closure
  - module-boundary acceptance and regression checks
  - critical-path test coverage and missing use-case fill-in
  - packaging, release-readiness, and post-change validation
- The existing docs-governance workflow stays in force when a docs slice is needed: single-page slice, boundary/status note, Chinese audit, OpenSpec change, validate, staged risk detection, then commit.
- Do not batch historical-doc cleanup as the main thread. Insert only one or two doc-governance slices after a completed feature iteration, code cleanup pass, or verification round.
- Apply an explicit stop line for low-value historical material. Do not proactively chase:
  - deeply nested legacy design drafts
  - obsolete plans that are already abandoned and no longer consulted
- Prioritize docs governance only for high-traffic or still-referenced historical documents that are easy to misread as active requirements, active gates, or current execution queues.
- If feature delivery, testing closure, or release verification is still incomplete, prefer continuing that mainline work before opening another docs-only slice.

## Workline Separation and Scope Lock

- Separate work into exactly one of these lanes per line and per commit:
  - feature lane: capability addition, bug fix, or product iteration
  - governance lane: docs, historical-boundary sync, audits, and technical-debt records
  - refactor lane: structural cleanup without mixing in product behavior changes
- Do not mix feature, governance, and refactor intent in a single commit unless the extra change is strictly required to make the primary lane work.
- Keep each slice minimal and single-directional:
  - do not cross modules unless the target behavior genuinely spans them
  - do not cross responsibility domains for convenience
  - do not "fix nearby issues" or "clean up while here"
  - do not bundle naming or formatting convergence unless it is required for the target change
- Before committing, use staged `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})` as the scope gate. If it surfaces low-relevance files or cross-domain spillover, trim the slice before continuing.

## Functional Completion Standard

- Feature work is not complete when code compiles or the local edit looks finished. A feature line is complete only after all required closure steps are done.
- Every feature delivery MUST close the loop with all of the following:
  - capability self-check through the actual CLI, runtime, or user-facing execution path touched by the change
  - guard coverage added or updated through unit tests, feature tests, or focused verification scripts appropriate to the changed behavior
  - repository-level anti-regression coverage when the change affects a shared or release-critical path
  - fact registration in the canonical docs when the change alters behavior, boundaries, enablement conditions, or known limits
- No guard test plus no execution-path verification means the work is still a draft, not a finished delivery.
- Each completed iteration should leave behind regression assets, not only changed implementation files.

## Source of Truth and Session Alignment

- `OpenSpec` is the first source of truth for architecture, capability contracts, and accepted change intent.
- Current repository entrypoint docs such as `README.md`, `docs/README.md`, and other actively maintained operator-facing docs describe the present local operating state when they are kept current in the same change.
- Historical audits, design notes, and legacy plans are records, not execution authority, unless a current source explicitly points back to them.
- Do not invent hidden rules, hidden compatibility promises, or private simplifications inside one session. If a limitation, temporary compromise, or cross-module rule matters, record it in `OpenSpec` or another current repository source-of-truth document added or updated in the same line.
- When switching to a new workline or resuming with fresh context, re-read:
  - the current baseline source of truth for that area
  - the active line scope
  - the known local limitations or temporary constraints documented for that area

## Ownership and Cross-Domain Changes

- Treat directory and module boundaries as ownership boundaries even when the code is technically editable from one session.
- Before modifying files outside the obvious target area, confirm whether the change is:
  - a small compatibility adjustment required by the primary line
  - or a separate responsibility-domain change that should be queued independently
- Cross-domain edits that are unavoidable for the target line MUST be called out explicitly in the user update and commit scope.
- If a change would materially invade another active line, split it into a follow-up instead of quietly absorbing it into the current patch.
- When parallel lines are active, prefer branch isolation that matches the lane:
  - `feat/*` for feature lines
  - `chore/docs/*` for governance lines
  - dedicated refactor branches for structural cleanup
- `main` should remain the integration branch for verified, converged work rather than a place to interleave unrelated active lines.

## Context Budget

- Keep the repository grounded in current local source-of-truth docs instead of generic playbooks.
- This repository currently does **not** ship root `ARCHITECTURE.md`, `RUNBOOK.md`, `GUARDRAILS.md`, `CONTRIBUTING.md`, or `TESTING.md`. Do not cite them as existing references unless they are added in the same change.
- If future work introduces `.cursor/` rule files or other host-specific overlays, document them explicitly before treating them as always-on instructions.

## Reference Documentation

- `DEVELOPMENT_RULES.md` first for repository-wide governance and merge blockers
- `README.md` next for the primary product surface and supported host/setup guidance
- `docs/README.md` for documentation navigation across quick starts, audits, and historical records
- `docs/ai-cli-local-quick-start.md` for local CLI and host expectations after the main README framing
- `docs/audits/README.md` and `openspec/changes/` for status verification, active repo-hygiene records, and convergence history
- the `gitnexus:start` ... `gitnexus:end` block below for GitNexus-specific MCP, index, and impact-analysis rules

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-04-15 | 1.2.0 | Added line-scope contracts, workline separation, functional completion closure rules, source-of-truth alignment, and cross-domain ownership boundaries for day-to-day development. |
| 2026-04-15 | 1.1.0 | Added delivery-priority rules that keep feature/test/release work ahead of historical-doc convergence, while retaining the existing low-intensity docs governance workflow. |
| 2026-04-06 | 1.0.0 | Added a local structured header adapted from upstream, but rewritten to point only at real local sources. |

<!-- gitnexus:start -->
<!-- gitnexus:keep -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus.

Run `gitnexus status` for current index stats and freshness.

Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `gitnexus analyze` in terminal first.

> If GitNexus behaves differently across machines or CI, run `gitnexus doctor --json` to inspect `native-runtime`, `language-support`, and host configuration checks.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- If multiple repos are indexed, pass `repo` explicitly to `gitnexus_detect_changes`. In multi-repo MCP sessions, use `gitnexus_detect_changes({scope: "staged", repo: "GitNexus"})`. If the server cwd may not match the active worktree, also pass `cwd`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/GitNexus/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main", repo: "GitNexus"})` — see what your branch changed in multi-repo MCP sessions

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all", repo: "GitNexus"})` to verify only expected files changed in multi-repo MCP sessions.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged", repo: "GitNexus"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/GitNexus/context` | Codebase overview, check index freshness |
| `gitnexus://repo/GitNexus/clusters` | All functional areas |
| `gitnexus://repo/GitNexus/processes` | All execution flows |
| `gitnexus://repo/GitNexus/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope, with `repo: "GitNexus"` whenever multiple repos are indexed
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
gitnexus analyze
```

If you have modified the local GitNexus source code under `/opt/claude/GitNexus/gitnexus/src`, rebuild first so the CLI picks up the updated `dist` files:

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build
gitnexus analyze
```

Use plain `gitnexus analyze` when you want the fastest refresh and exact symbol, file, or keyword search is enough.

Graph tools, BM25/FTS search, impact analysis, and context lookups still work without embeddings.

Use `gitnexus analyze --embeddings` when natural-language, concept, or fuzzy code search matters.

This enables hybrid retrieval (`BM25 + semantic + RRF`) but takes longer and requires an embedding provider such as Ollama or Hugging Face.

During `gitnexus analyze`, GitNexus automatically detects and stops local `gitnexus mcp` processes that are holding the target repo's `.gitnexus/kuzu` file open. This avoids the common KuzuDB lock conflict when you have multiple CLI or editor sessions open.

Use `gitnexus doctor --json` when you need to verify whether optional grammars such as Kotlin / Swift are actually available in the current environment.

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

If embedding generation is enabled, these environment variables control the provider and runtime behavior:

```bash
# Raise the CLI safety limit for large repos.
# Start with 64 on a local Ollama GPU setup; use 32 as a conservative fallback.
GITNEXUS_EMBEDDING_NODE_LIMIT=90000
GITNEXUS_EMBEDDING_BATCH_SIZE=64

# Use a Hugging Face mirror / custom endpoint
HF_ENDPOINT=https://hf-mirror.com
# or
GITNEXUS_HF_REMOTE_HOST=https://hf-mirror.com

# Persist downloaded model files
GITNEXUS_HF_CACHE_DIR=/path/to/hf-cache

# Use a predownloaded local Hugging Face model only
GITNEXUS_HF_LOCAL_MODEL_PATH=/path/to/local-models
GITNEXUS_HF_LOCAL_ONLY=1

# Use Ollama instead of Hugging Face for both indexing and query embeddings
GITNEXUS_EMBEDDING_PROVIDER=ollama
GITNEXUS_OLLAMA_BASE_URL=http://localhost:11434
GITNEXUS_OLLAMA_MODEL=qwen3-embedding:0.6b
```

Recommended Ollama example:

```bash
GITNEXUS_EMBEDDING_PROVIDER=ollama \
GITNEXUS_OLLAMA_BASE_URL=http://localhost:11434 \
GITNEXUS_OLLAMA_MODEL=qwen3-embedding:0.6b \
GITNEXUS_EMBEDDING_NODE_LIMIT=90000 \
GITNEXUS_EMBEDDING_BATCH_SIZE=64 \
gitnexus analyze --embeddings
```

Use `--force` only for intentional full rebuilds or corrupted indexes.

The same settings can also be stored in `~/.gitnexus/config.json`:

```json
{
  "embeddings": {
    "provider": "ollama",
    "ollamaBaseUrl": "http://localhost:11434",
    "ollamaModel": "qwen3-embedding:0.6b",
    "nodeLimit": 90000,
    "batchSize": 64
  }
}
```

Priority is: environment variables > `~/.gitnexus/config.json` > built-in defaults.

You can inspect or update this without editing JSON manually:

```bash
gitnexus config embeddings show
gitnexus config embeddings set --provider ollama --ollama-base-url http://localhost:11434 --ollama-model qwen3-embedding:0.6b --node-limit 90000 --batch-size 64
gitnexus config embeddings clear
```

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
