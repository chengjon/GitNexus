# GitNexus Function Tree

Last updated: 2026-06-07

This file tracks the repository-level function tree and durable governance notes.
It is an orientation map, not a source of runtime behavior.

## Status Registry

| Status | Meaning |
| --- | --- |
| `active` | Current product or engineering capability. |
| `planned` | Accepted direction that still needs implementation. |
| `hold` | Known work item that must not proceed until explicit gates pass. |
| `closed` | Completed governance or implementation track retained for history. |
| `archived` | Historical reference only. |

## Feature Map

### GitNexus CLI and MCP Runtime

Status: `active`

- Repository analysis and graph indexing.
- MCP server for code intelligence tools.
- Impact, query, context, rename, route, shape, tool, and change-detection workflows.
- Local-first operation with persisted `.gitnexus/` graph stores.

### GitNexus Web UI

Status: `active`

- Browser interface for graph exploration and repository navigation.
- Thin client over the `gitnexus serve` HTTP API.

### Shared Contracts

Status: `active`

- `gitnexus-shared/` provides shared TypeScript types and constants.
- Contract-aware multi-repo and monorepo service analysis is part of the active architecture.

### Agent and Editor Integrations

Status: `active`

- Claude, Cursor, and MCP-oriented setup assets.
- Repository rules, agent skills, and operational guardrails.

### Dependency PR Governance

Status: `closed`

- A/B/C Dependabot dependency governance, risk assessment, and merge-readiness planning are closed as of 2026-06-07.
- Local evaluation artifacts are retained under `docs/dependency-pr-evaluations/` for replay and retrospective use.
- No evaluation, test, or temporary-build work should continue from the closed A/B/C batch unless a new task explicitly reopens that scope.

#### Follow-Up Node: #10 Dockerfile.test Route 1

Status: `hold`

- #10 remains `HOLD, but actionable`.
- The accepted path is route 1: keep `gitnexus/Dockerfile.test` as a focused Node 26 native grammar smoke image.
- Required implementation direction:
  - Add configurable apt mirror build args with official Debian defaults.
  - Replace apt source URIs before `apt-get update`.
  - Run `node scripts/materialize-vendor-grammars.cjs` immediately after `npm ci --ignore-scripts`.
  - Change the default CMD to a focused runtime grammar/native smoke for Swift and Kotlin grammar loading.
- Do not request #10 merge until the route 1 code change is implemented and CI is fully green.

## Evidence Index

| Evidence | Purpose |
| --- | --- |
| `docs/dependency-pr-evaluations/2026-06-06-c-batch-pr-readiness.md` | C batch readiness report, including #10 route 1 evidence and final HOLD/actionable status. |
| `docs/dependency-pr-evaluations/2026-06-06-post-c-open-pr-queue.md` | Post-C open PR queue snapshot. |

## Maintenance Rules

- Keep source edits separate from governance documentation updates unless a task explicitly authorizes both.
- Before editing functions, classes, or methods, run the GitNexus impact workflow required by `AGENTS.md`.
- Before committing code changes, run GitNexus change detection and the project-specific build/test gates for the touched package.
- For dependency PR governance, update this tree only with durable status changes, accepted follow-up nodes, or closed evidence links.
