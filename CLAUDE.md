<!-- version: 1.9.0 -->
<!--
  Metadata: version, last reviewed, scope, model policy, reference docs, changelog.
  Last updated: 2026-09-02
-->

Last reviewed: 2026-09-02

**Project:** GitNexus · **Environment:** dev · **Maintainer:** repository maintainers (see GitHub)

Follow **AGENTS.md** for the canonical rules; this file adds Claude Code–specific deltas. Cursor-specific notes live only in `AGENTS.md`.

## Scope

See the **Scope** table in [AGENTS.md](AGENTS.md) for read/write/execute/off-limits boundaries. Cursor-specific workflow notes also live only in AGENTS.md.

## Model Configuration

- **Primary:** Pin per **Claude Code** / Anthropic org policy (explicit model id). Do not rely on an unversioned `latest` alias for governed workflows.
- **Fallback:** As configured in Claude Code (organization default or user override).
- **Notes:** The GitNexus CLI analyzer does not call an LLM.

## Execution Sequence (complex tasks)

Same discipline as [AGENTS.md](AGENTS.md): before large multi-step work, state which **AGENTS.md** / **GUARDRAILS.md** rules apply, current **Scope**, and planned validation commands (`npm test`, `tsc`, etc.). When pausing, summarize progress in the chat or a **local** scratch file (do not add `HANDOFF.md` to the repo), then `/clear` and resume with that summary.

## Claude Code hooks

Prefer **PreToolUse** hooks for hard gates (e.g. tests before `git_commit`). Adapt hook commands to `gitnexus/` npm scripts.

## Context budget

If always-on instructions grow, load deep conventions via conditional reads (e.g. *“When writing new code, read STANDARDS.md”*) instead of pasting long blocks here. In Cursor, prefer `.cursor/index.mdc` plus optional `.cursor/rules/*.mdc` globs (see [AGENTS.md](AGENTS.md) § Context budget).

## Rebuild dist (CLI source changes)

The global `gitnexus` binary runs **this repo's own build** (`gitnexus/dist/` via PATH symlink; `.gitnexus/run.cjs` resolves the same way). Rebuild rule:

- Edited `gitnexus/src/**` TypeScript → run `cd gitnexus && npm run build`, or the CLI keeps executing the stale dist.
- Markdown/docs/memory changes only (AGENTS.md, CLAUDE.md, docs/, skills copies) → **no rebuild needed**.

## Reference Documentation

- **This repository:** [AGENTS.md](AGENTS.md) (Cursor + monorepo notes), [ARCHITECTURE.md](ARCHITECTURE.md), [CONTRIBUTING.md](CONTRIBUTING.md), [GUARDRAILS.md](GUARDRAILS.md).
- **Call & inheritance resolution:** See ARCHITECTURE.md § Scope-Resolution Pipeline. Shared pipeline code in `gitnexus/src/core/ingestion/` must not name languages — use `LanguageProvider` / `ScopeResolver` hooks instead (see AGENTS.md). (The legacy call-resolution DAG was removed in #942.)
- **GitNexus:** standard skills in `.claude/skills/gitnexus-*/`; MCP and indexed-repo rules in [docs/law/gitnexus-agent-rules.md](docs/law/gitnexus-agent-rules.md). See **GitNexus rules** below.
- **Engineering plans, execution & review:** `/gitnexus-plan <task>` (implementation-ready plans via GitNexus + statement-level PDG + source verification; Deepen mode for existing plans), `/gitnexus-work [plan]` (executes a plan as impact-checked, detect_changes-gated atomic commits), `/gitnexus-review [PR|branch|range|local]` (read-only graph-backed review), `/gitnexus-lfg <task>` (plan with depth asked up front → proceed/stop gate → work → review pipeline). Specs in `.claude/skills/gitnexus-{plan,work,review,lfg}/SKILL.md` (see AGENTS.md § Engineering planning & execution).

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-09-02 | 1.9.0 | Added "Rebuild dist" rule (rebuild after `gitnexus/src/**` edits; global `gitnexus` runs this repo's dist); lean `gitnexus:keep` blocks + canonical rules moved to docs/law/gitnexus-agent-rules.md. |
| 2026-07-20 | 1.8.0 | The CI review agent runs `gitnexus-review` as a coordinated swarm — six `ci-personas/` lanes dispatched via the `Agent` tool with a bounded critic gate. |
| 2026-07-16 | 1.7.0 | `/gitnexus-plan` asks depth up front in interactive runs; `/gitnexus-lfg` gate slimmed to proceed/stop. |
| 2026-07-16 | 1.6.0 | Renamed `/gitnexus-pr-review` to `/gitnexus-review` and added PR, branch/range, and local-change targets. |
| 2026-07-11 | 1.5.0 | Added `/gitnexus-work` and `/gitnexus-lfg` to the engineering plans & execution pointer. |
| 2026-07-11 | 1.4.0 | Added `/gitnexus-plan` pointer to Reference Documentation. |
| 2026-04-13 | 1.3.0 | Updated GitNexus index stats after DAG refactor. |
| 2026-03-24 | 1.2.0 | Removed duplicated gitnexus:start block and scope table; replaced with pointers to AGENTS.md. |
| 2026-03-23 | 1.1.0 | Updated agent instructions to match AGENTS.md. |
| 2026-03-22 | 1.0.0 | Added structured header and changelog. |

---

## GitNexus rules

The canonical MCP tools, impact-analysis rules, and index instructions live in **[docs/law/gitnexus-agent-rules.md](docs/law/gitnexus-agent-rules.md)**. The lean `gitnexus:start` blocks in AGENTS.md / CLAUDE.md only link there (with `<!-- gitnexus:keep -->`) so `gitnexus analyze` no longer rewrites these files on every run.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This repository is indexed by GitNexus; use its MCP tools for impact analysis, code query, and safe navigation. The full rules — Always/Never, MCP resources, and the CLI skill table — live in **[docs/law/gitnexus-agent-rules.md](docs/law/gitnexus-agent-rules.md)**.

<!-- gitnexus:keep -->
<!-- gitnexus:end -->
