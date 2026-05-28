## 1. Refresh Baseline

- [x] 1.1 Run `git fetch upstream` before recording any convergence counts
- [x] 1.2 Record the refreshed branch divergence baseline for `upstream/main` versus local `main`
- [x] 1.3 Save a dedicated doc/governance convergence baseline report under `docs/audits/`

## 2. Classify Local-Only Scope

- [x] 2.1 Identify local-only doc/governance paths in the review scope
- [x] 2.2 Separate fork-local governance records from possible future upstream candidates

## 3. Classify Upstream-Only Scope

- [x] 3.1 Identify upstream-only doc/governance paths in the review scope
- [x] 3.2 Mark which upstream docs are code-coupled and should be deferred
- [x] 3.3 Mark which shared files require manual reconcile now

## 4. Define Replay Order

- [x] 4.1 Record the shared hotspot files in priority order
- [x] 4.2 Write the rule that agent-behavior docs reconcile before README polish
- [x] 4.3 Write the rule that code-coupled upstream docs stay deferred until matching code convergence exists

## 5. First Shared Replay Slice

- [x] 5.1 Forward-port the safe `Codex` support wording into `README.md`
- [x] 5.2 Keep upstream-only `LadybugDB`, enterprise, and other code-coupled wording deferred when it conflicts with current local product truth
- [x] 5.3 Sync `gitnexus/README.md` host-support wording with the same local `Codex` reality
- [x] 5.4 Adapt the upstream structured header into `AGENTS.md` using only real local references
- [x] 5.5 Adapt the upstream structured header into `CLAUDE.md` using only real local references

## 6. Validation

- [x] 6.1 Validate the OpenSpec change artifacts
- [x] 6.2 Re-run scoped repository status and confirm only intended convergence-review files changed
