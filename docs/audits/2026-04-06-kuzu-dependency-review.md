# GitNexus Kuzu Dependency Review

Date: 2026-04-06  
Scope: `/opt/claude/GitNexus`  
Method: local `package.json` / `package-lock.json` review plus npm registry metadata checks (`npm view` with writable cache under `/tmp/.npm`)  
Status: review-only decision baseline; no package versions were changed in this slice

Historical review note: the `Current Repository State`, dependency-graph
findings, `Provisional Recommendation`, and operator guidance below remain the
2026-04-06 review-only decision baseline. Read them as historical dependency
review context unless the later exit-strategy slice, current roadmap, or a
future package-changing record explicitly reaffirms them as still current.

## Review Goal

Turn the previously recorded `kuzu` / `kuzu-wasm` dependency debt into a bounded decision surface for the next operator.

This review does not pick a replacement yet. It clarifies what is true now, what is ambiguous, and what outcomes are acceptable for CLI and web separately.

## Primary Sources

- `kuzu` npm package: <https://www.npmjs.com/package/kuzu>
- `kuzu-wasm` npm package: <https://www.npmjs.com/package/kuzu-wasm>
- legacy scoped wasm package: <https://www.npmjs.com/package/@kuzu/kuzu-wasm>
- official Kuzu repository: <https://github.com/kuzudb/kuzu>
- official Kuzu installation docs: <https://kuzudb.com/docs/installation/>
- official Kuzu wasm docs: <https://docs.kuzudb.com/client-apis/wasm/>
- legacy scoped wasm repository: <https://github.com/unswdb/kuzu-wasm>

## Current Repository State

### Direct dependencies in this repo

- CLI package [package.json](/opt/claude/GitNexus/gitnexus/package.json) declares `kuzu@^0.11.3`
- Web package [package.json](/opt/claude/GitNexus/gitnexus-web/package.json) declares `kuzu-wasm@^0.11.1`
- CLI lockfile [package-lock.json](/opt/claude/GitNexus/gitnexus/package-lock.json) resolves `node_modules/kuzu@0.11.3` and records it as deprecated
- Web lockfile [package-lock.json](/opt/claude/GitNexus/gitnexus-web/package-lock.json) resolves `node_modules/kuzu-wasm@0.11.3` and records it as deprecated

### npm registry facts captured on 2026-04-06

- `npm view kuzu version deprecated time --json` reports latest `0.11.3` and a package-level deprecation message
- `npm view kuzu-wasm version deprecated time --json` reports latest `0.11.3` and a package-level deprecation message
- `npm view kuzu repository homepage dist-tags dependencies --json` points at the official `kuzudb/kuzu` repo and `kuzudb.com`
- `npm view kuzu-wasm repository homepage dist-tags dependencies --json` also points at the official `kuzudb/kuzu` repo and `kuzudb.com`
- `npm view @kuzu/kuzu-wasm version time repository homepage --json` reports a different package line: latest `0.7.0`, repo `unswdb/kuzu-wasm`, and no deprecation field in the returned metadata

### Official documentation mismatch

- the official Kuzu installation docs still tell Node.js users to run `npm install kuzu`
- the official Kuzu wasm docs still tell browser users to run `npm i kuzu-wasm`
- both packages are simultaneously marked deprecated in npm registry metadata
- the official `kuzudb/kuzu` GitHub repository is archived as of 2025-10-10, so any package-line decision must assume no normal ongoing upstream maintenance flow

Assessment:

- this is an upstream source-of-truth mismatch, not only a local lockfile issue
- we should not assume deprecation automatically means "stop using immediately" if official docs still point to the same package names
- but we also should not treat the docs as proof that the deprecation flags are harmless
- the next dependency decision needs to explicitly resolve this contradiction under an archived-upstream risk model

## Dependency Graph Findings

### CLI native track

- `kuzu@0.11.3` depends on `cmake-js@^7.3.0` and `node-addon-api@^6.0.0`
- `cmake-js@7.3.0` depends on `npmlog@^6.0.2` and `tar@^6.2.0`
- the local CLI lockfile records deprecations for:
  - `kuzu`
  - `tar@6.2.1`
  - `npmlog`
  - `gauge`
  - `are-we-there-yet`
  - `boolean`

Assessment:

- the CLI risk is not just one deprecated direct dependency
- it includes a native-build-oriented transitive chain that already carries multiple deprecated packages
- this is the higher-risk track because it affects install and native build behavior

### Web wasm track

- `kuzu-wasm@0.11.3` is directly deprecated in the registry and in the local web lockfile
- its direct dependency set is smaller: `threads`, `tiny-worker`, `uuid`
- the web lockfile still contains unrelated deprecated packages such as `boolean`, but the main flagged issue here is the direct `kuzu-wasm` line itself

Assessment:

- the web track is still real dependency debt
- but the immediate graph is shallower than the native CLI chain
- the main ambiguity is whether the current official wasm package line has a maintained successor, a renamed package, or only a deprecated-but-still-published line

### Scoped wasm package ambiguity

- `@kuzu/kuzu-wasm` exists as a separate npm package line
- it points to `unswdb/kuzu-wasm`, not `kuzudb/kuzu`
- its latest visible version is `0.7.0`, much older than the `0.11.3` line used by this repo

Assessment:

- this package must not be assumed to be the automatic successor to `kuzu-wasm`
- it is a candidate to inspect during the next decision round, not a safe drop-in migration target by default

## Decision Framework

Each track must end in exactly one of these outcomes:

1. Upgrade to a supported maintained package/version line.
2. Replace with a different supported implementation.
3. Keep the current line pinned as a documented exception with explicit rationale.

## Provisional Recommendation

Historical review note: the recommendation below records the review-time
decision posture for this dependency-governance baseline, not a standalone live
package-policy source after the later exit-strategy follow-up.

Based on the currently available evidence, the recommended near-term decision is:

- CLI `kuzu`: rationale-backed pin, not blind upgrade
- Web `kuzu-wasm`: rationale-backed pin, not blind upgrade
- `@kuzu/kuzu-wasm`: do not adopt as a successor without a separate compatibility review

Why:

- the official repo is archived
- npm still marks the currently documented package names as deprecated
- official docs still point to those same package names, so there is no clean documented replacement path yet
- no stronger upstream maintenance signal was found in this review than the archived repo plus stale install guidance

This is a provisional engineering recommendation, not a final package policy. It means the next package-changing slice should start from "pin with rationale unless a concrete supported replacement is proven" rather than from "upgrade must exist somewhere".

Current repository mitigation status:

- CLI direct dependency is now pinned exactly to `kuzu@0.11.3`
- Web direct dependency is now pinned exactly to `kuzu-wasm@0.11.3`
- this exact pinning is containment only, not evidence that the dependency line is healthy
- the next follow-up decision record now lives at `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/`

### CLI acceptance questions

- Is there a maintained official Node binding line beyond the currently deprecated `kuzu` package?
- If official docs still recommend `kuzu`, is the npm deprecation flag temporary, stale, or signaling an unannounced migration?
- Given the archived upstream repo, is there any realistic expectation of a future supported Node package line, or should this be treated as effectively frozen?
- If not, is there a supported non-`cmake-js` integration path that preserves local embedding, indexing, and MCP workflows?
- If no supported replacement exists now, what exact pinned version and risk rationale should be recorded?

### Web acceptance questions

- Is `kuzu-wasm` still the intended official browser package despite the deprecation flag, or is there a replacement package/documented install path?
- Is `@kuzu/kuzu-wasm` a real successor candidate or a legacy/parallel line?
- If official wasm docs still recommend `kuzu-wasm`, does the npm deprecation reflect package retirement, publication hygiene, or only support-policy wording?
- Given the archived upstream repo, should the web package be treated as a frozen dependency line even if the docs still mention it?
- If neither yields a clean supported path, what explicit pin-and-monitor rationale is acceptable for the web app?

## Immediate Operating Rule

Reader note: the operating rule and next-step wording below preserve the
2026-04-06 review-only baseline. For current tracked-exception reading or any
future package-change trigger, defer to the later exit-strategy record before
treating this older wording as the live dependency policy.

Until this review becomes a package-change slice:

- treat both current dependency lines as tracked exceptions
- do not expand new product surface around `kuzu` or `kuzu-wasm` in unrelated changes
- keep CLI and web decisions separate; do not force a single package conclusion onto both

## Recommended Next Step

The dedicated follow-up decision slice is now:

- `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/`
- `docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md`

That follow-up keeps the current recommended near-term posture:

- keep CLI `kuzu` pinned exactly
- keep web `kuzu-wasm` pinned exactly
- treat `@kuzu/kuzu-wasm` only as an explicitly reviewed candidate, not an assumed successor

Unless new upstream evidence appears, the burden of proof remains on upgrade or replacement, not on the current pin recommendation.
