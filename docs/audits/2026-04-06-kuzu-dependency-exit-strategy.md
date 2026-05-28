# GitNexus Kuzu Dependency Exit Strategy

Date: 2026-04-06  
Scope: `/opt/claude/GitNexus`  
Method: prior audit and exact-pinning review synthesis, current npm registry metadata checks, GitHub repository metadata checks, GitNexus process/context review, and targeted local import scans  
Status: decision follow-up to the review-only and exact-pinning slices; this document does not change dependency versions

Historical decision note: the verified inputs, candidate matrix, `Exit Criteria`,
and `Current Decision` below remain the 2026-04-06 dependency-governance
follow-up baseline. Read them as historical exit-strategy context unless the
current roadmap or a later package-changing record explicitly reaffirms them as
still current.

## Goal

Turn the current `kuzu` / `kuzu-wasm` state from "audited and pinned" into an explicit exit strategy with:

- verified current package and repository status
- candidate disposition for `@kuzu/kuzu-wasm`
- track-specific exit criteria for CLI native and web wasm
- a concrete rule for when the repo should keep pinning versus reopen replacement work

## Verified Inputs

### Upstream package and repository facts

- official installation docs still point Node users at `npm install kuzu`: <https://kuzudb.com/docs/installation/>
- official wasm docs still point browser users at `npm i kuzu-wasm`: <https://docs.kuzudb.com/client-apis/wasm/>
- `npm view kuzu version deprecated repository homepage dist-tags dependencies time --json` reports:
  - latest `0.11.3`
  - package deprecation present
  - repo `kuzudb/kuzu`
  - homepage `https://kuzudb.com/`
- `npm view kuzu-wasm version deprecated repository homepage dist-tags dependencies time --json` reports:
  - latest `0.11.3`
  - package deprecation present
  - repo `kuzudb/kuzu`
  - homepage `https://kuzudb.com/`
- `curl https://api.github.com/repos/kuzudb/kuzu` reports:
  - `archived: true`
  - `pushed_at: 2025-10-10T15:34:00Z`
- `npm view @kuzu/kuzu-wasm version deprecated repository homepage dist-tags dependencies time --json` reports:
  - latest `0.7.0`
  - no npm deprecation field in the returned metadata
  - repo `unswdb/kuzu-wasm`
- `curl https://api.github.com/repos/unswdb/kuzu-wasm` reports:
  - `archived: true`
  - `pushed_at: 2025-02-28T07:26:29Z`

Assessment:

- the current officially documented package names are still `kuzu` and `kuzu-wasm`
- both officially documented package lines are deprecated in npm and backed by an archived upstream repo
- the alternate scoped wasm package is not a stronger maintenance signal because it points to a different archived repo and an older package line

### Local usage surface

#### CLI native track

Direct import and type surface:

- [gitnexus/src/core/kuzu/kuzu-adapter.ts](/opt/claude/GitNexus/gitnexus/src/core/kuzu/kuzu-adapter.ts)
- [gitnexus/src/mcp/core/kuzu-adapter.ts](/opt/claude/GitNexus/gitnexus/src/mcp/core/kuzu-adapter.ts)
- [gitnexus/src/core/kuzu/load-graph.ts](/opt/claude/GitNexus/gitnexus/src/core/kuzu/load-graph.ts)
- [gitnexus/test/helpers/shared-kuzu-runtime.ts](/opt/claude/GitNexus/gitnexus/test/helpers/shared-kuzu-runtime.ts)

Observed runtime touchpoints:

- `analyze` and embeddings flows initialize and load Kuzu
- augmentation and wiki query flows depend on the Kuzu database path and query API
- MCP local runtime uses the pooled native adapter for read-only concurrent access

Assessment:

- replacement cost is high
- the CLI path depends on native module construction, database lifecycle handling, connection-pool behavior, read-only concurrency, and current COPY/query semantics
- any CLI dependency decision affects both Claude Code and Codex backed workflows because both CLI hosts sit on the same indexed-runtime layer

#### Web wasm track

Direct import and type surface:

- [gitnexus-web/src/core/kuzu/kuzu-adapter.ts](/opt/claude/GitNexus/gitnexus-web/src/core/kuzu/kuzu-adapter.ts)
- [gitnexus-web/src/types/kuzu-wasm.d.ts](/opt/claude/GitNexus/gitnexus-web/src/types/kuzu-wasm.d.ts)

Observed runtime touchpoints:

- dynamic import of `kuzu-wasm`
- `init`, `Database`, `Connection`, and `FS` APIs
- in-memory database setup plus CSV bulk load and query execution inside the web worker path

Assessment:

- replacement cost is medium, not trivial
- the web track is more localized than the CLI track, but it still depends on a specific wasm API shape and virtual filesystem behavior

## Candidate Disposition Matrix

| Track | Current line | Current status | Candidate decision |
| --- | --- | --- | --- |
| CLI native | `kuzu@0.11.3` | deprecated in npm, official docs still reference it, upstream repo archived | keep exact pin as tracked exception until a maintained supported replacement is proven |
| Web wasm | `kuzu-wasm@0.11.3` | deprecated in npm, official docs still reference it, upstream repo archived | keep exact pin as tracked exception until a maintained supported replacement is proven |
| Web alternate candidate | `@kuzu/kuzu-wasm@0.7.0` | different repo, different version line, repo archived, no official docs found that position it as successor | reject as an automatic successor; only reopen if separate compatibility evidence appears |

## Exit Criteria

Historical decision note: the criteria below record the 2026-04-06
dependency-governance exit conditions for this tracked-exception baseline. They
should not be treated as an automatically current migration checklist unless a
later dependency record or roadmap note reaffirms them.

### CLI native track exit criteria

The repository should only replace or unpin the CLI `kuzu` line if all of the following are true:

1. There is a maintained, non-archived package/repository line with an explicit support signal stronger than the current deprecated archived state.
2. The package preserves or intentionally replaces the runtime capabilities used in:
   - [gitnexus/src/core/kuzu/kuzu-adapter.ts](/opt/claude/GitNexus/gitnexus/src/core/kuzu/kuzu-adapter.ts)
   - [gitnexus/src/mcp/core/kuzu-adapter.ts](/opt/claude/GitNexus/gitnexus/src/mcp/core/kuzu-adapter.ts)
   - [gitnexus/src/core/kuzu/load-graph.ts](/opt/claude/GitNexus/gitnexus/src/core/kuzu/load-graph.ts)
3. Read-only multi-connection behavior, lock handling, and bulk load/query semantics are either compatible or have a bounded migration plan.
4. Dual CLI support remains intact for both Claude Code and Codex, with at minimum:
   - `npx vitest run test/unit/host-adapters.test.ts`
   - `npx vitest run --config vitest.integration.config.ts test/integration/cli-e2e.test.ts --testNamePattern "shows Codex in setup help because setup supports the dual CLI workflow"`
   - `npx vitest run test/unit/doctor.test.ts`
5. Indexed-runtime smoke coverage is rechecked for analyze, MCP runtime, and wiki/augmentation query entry points touched by the Kuzu layer.

### Web wasm track exit criteria

The repository should only replace or unpin the web `kuzu-wasm` line if all of the following are true:

1. There is a maintained, non-archived package/repository line with explicit browser or wasm support documentation.
2. The package preserves or intentionally replaces the runtime capabilities used in:
   - [gitnexus-web/src/core/kuzu/kuzu-adapter.ts](/opt/claude/GitNexus/gitnexus-web/src/core/kuzu/kuzu-adapter.ts)
   - [gitnexus-web/src/types/kuzu-wasm.d.ts](/opt/claude/GitNexus/gitnexus-web/src/types/kuzu-wasm.d.ts)
3. The replacement supports dynamic import, initialization, in-memory database creation, virtual filesystem writes, and the query cursor behavior the adapter expects.
4. Once local `gitnexus-web` dependencies are available again, build and type-level validation passes before any migration is accepted.

## Current Decision

Reader note: the decision and reopen-trigger wording below preserve the
2026-04-06 exit-strategy baseline. For current live package policy, defer to
the current remediation roadmap and any later dependency-changing slice before
treating this older wording as the sole authoritative trigger source.

The repository should keep the exact pins introduced by the current mitigation slice:

- CLI: `kuzu@0.11.3`
- Web: `kuzu-wasm@0.11.3`

This is still a tracked exception, not an endorsement of dependency health.

The next dependency-changing slice should only open when at least one trigger happens:

- a maintained supported successor becomes explicit
- current install or runtime behavior starts failing
- security or compliance requirements force the repo to leave the current line

Absent one of those triggers, the correct short-term action is to keep the current pins and avoid speculative migration work.

## Output Mapping

This document is operationalized by:

- `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/`

It depends on the previously completed slices:

- `openspec/changes/2026-04-06-kuzu-dependency-review/`
- `openspec/changes/2026-04-06-kuzu-dependency-exception-pinning/`
