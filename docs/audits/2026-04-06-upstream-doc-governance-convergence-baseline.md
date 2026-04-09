# GitNexus Upstream Doc And Governance Convergence Baseline

Date: 2026-04-06
Scope: `/opt/claude/GitNexus`
Method: `git fetch upstream`, refreshed divergence count, and bidirectional diff review limited to `README.md`, `docs/**`, `openspec/**`, `AGENTS.md`, `CLAUDE.md`, `gitnexus/AGENTS.md`, and `gitnexus/CLAUDE.md`

Status note:

- this baseline captured the first refreshed same-day convergence pass
- after a later `git fetch upstream` on `2026-04-06`, `upstream/main` advanced again and the live shared replay baseline moved to `280 208`
- the latest shared replay decision now lives in [2026-04-06-upstream-shared-doc-replay-review.md](/opt/claude/GitNexus/docs/audits/2026-04-06-upstream-shared-doc-replay-review.md)
- after another `git fetch upstream` on `2026-04-08`, `upstream/main` advanced to `be24010` and the live shared replay baseline moved to `285 209`; see [2026-04-08-upstream-shared-doc-replay-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-upstream-shared-doc-replay-status-sync.md)

## Refresh Summary

- `git fetch upstream` advanced `upstream/main` from `ffabe85` to `9eeb20b`
- refreshed branch divergence is `276` commits unique to `upstream/main` and `208` commits unique to local `main`
- local doc/governance-side diff versus refreshed `upstream/main` covers `53` paths
- upstream doc/governance-side diff versus local `main` covers `13` paths

This report supersedes the earlier pre-fetch convergence count used during the repository-hygiene audit. The current replay baseline for any future `upstream/main` doc review is `276 208`.

Execution note:

- the first safe replay slice has already been applied to `README.md` by surfacing `Codex` as an MCP-supported host in shared overview/setup text
- a second safe replay slice has already been applied to `AGENTS.md` and `CLAUDE.md` by adapting the upstream structured header to real local sources and preserving `DEVELOPMENT_RULES.md` as the primary root-governance entrypoint
- a third safe replay slice has already been applied to the shared manual-setup guidance so `Claude Code` and `Codex` both document the current cross-platform MCP command shape
- upstream-only `LadybugDB`, enterprise, and code-coupled doc wording remains deferred because it does not yet match current local product reality

## Shared Hotspots Requiring Manual Reconcile

### `README.md`

Local-only themes visible in the refreshed local history:

- AI CLI and local-fork quick-start guidance
- recent runtime, test-foundation, and MCP reliability upgrades
- embeddings configuration CLI and Ollama tuning guidance
- worktree-safe analyze guidance and local operational notes

Upstream-only themes visible in the refreshed upstream history:

- enterprise offering and commercial messaging
- Codex support and related setup snippets
- `gitnexus-shared` build-step guidance before `gitnexus-web`
- supported-language table and product-surface updates tied to upstream code evolution

Convergence rule:

- keep the latest local operational truth as the baseline
- selectively forward-port upstream product messaging or install guidance only when it still matches the local code and contributor workflow
- do not bulk replace the current local README with upstream text
- verified deferred items after local CLI/source review: enterprise marketing blocks, `LadybugDB` storage wording, `gitnexus-shared` prebuild instructions, expanded supported-language matrix, and any command surfaces not present in current local CLI help

### `AGENTS.md` and `CLAUDE.md`

Local-only themes visible in the refreshed local history:

- explicit multi-repo `detect_changes` guidance
- stronger GitNexus tool rules and index freshness notes
- current embeddings configuration and analyze-lock guidance

Upstream-only themes visible in the refreshed upstream history:

- refreshed symbol and relationship counts
- upstream template updates associated with newer OSS releases
- a generic agent-header layer that references root docs such as `ARCHITECTURE.md`, `GUARDRAILS.md`, `CONTRIBUTING.md`, and `TESTING.md`

Convergence rule:

- preserve the local fork's GitNexus-specific operating instructions
- only import upstream factual count or template refreshes if they are regenerated from the current local index and do not weaken local operational guardrails
- defer the generic upstream agent-header layer until the referenced root docs either exist locally or the header is rewritten to point at real local sources
- current replay decision: keep the rewritten local structured header and do not reintroduce upstream references to absent root docs

### `gitnexus/README.md`

Local replay status:

- safe local replay applied: `Codex` is now surfaced as an MCP-supported host in the package README
- upstream README slices remain deferred when they depend on unsupported local CLI or runtime claims

Verified deferred items after local CLI/source review:

- `skip-agents-md` and other CLI flags that do not appear in current local help output
- `group` / `index` subcommands that do not exist in the current local CLI
- remote-embedding endpoint env vars not present in the current local source
- `LadybugDB` database wording and Ruby support claims that do not match the current local implementation

Resolved in the current local doc direction:

- Windows-specific manual MCP wording for both `Claude Code` and `Codex` is now documented directly in the shared setup guidance, so it is no longer a deferred replay item

### `gitnexus/AGENTS.md` and `gitnexus/CLAUDE.md`

- these files are local-only additions in the doc/governance comparison
- there is no upstream counterpart to replay directly
- keep them local unless the project explicitly chooses to upstream repo-internal agent instructions later

## Local-Only Doc And Governance Inventory

### Keep local-only by default

These files primarily record local fork execution history, governance state, or operator workflow and should not be replayed upstream by default:

- `docs/superpowers/plans/**/*`
- `docs/superpowers/specs/**/*`
- `docs/plans/2026-03-18-personal-fork-workflow.md`
- `openspec/config.yaml`
- `openspec/changes/archive/2026-04-06-mcp-process-management/**/*`
- `gitnexus/AGENTS.md`
- `gitnexus/CLAUDE.md`

### Review selectively for possible future upstream value

These local docs may contain reusable product or operator guidance, but they should be proposed upstream only after local wording stabilizes and the guidance is detached from fork-specific assumptions:

- `docs/ai-cli-local-quick-start.md`
- `docs/gitnexus-quick-start-guide.md`
- `docs/2026-03-21-gitnexus-embedding-performance-and-ollama-gpu.md`
- `docs/mcp-per-repo-worker-isolation-design.md`
- `docs/gitnexus-skills-review.md`
- `docs/gitnexus-skills-modification-suggestions.md`
- `docs/sigusr1-cooperative-release-design.md`

## Upstream-Only Doc And Governance Inventory

### Defer until corresponding code convergence exists

These upstream docs appear to describe code or feature work that is not yet part of the current local replay baseline. They should not be pulled in as doc-only changes:

- `docs/code-indexing/cobol/*`
- `docs/plans/2026-03-26-feat-cobol-full-language-coverage-plan.md`
- `docs/superpowers/plans/2026-04-02-pr626-high-fixes.md`
- `docs/superpowers/specs/2026-04-02-pr626-high-fixes-design.md`

### Review during shared-file reconcile

These upstream changes touch shared top-level governance surfaces and need manual reconcile, not blind replay:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`

## Convergence Decision Rules

- Treat current local `main` as the authoritative wording source for docs that describe already merged local behavior.
- Refresh `upstream/main` before every convergence review; do not reason from stale remote refs.
- Do not import upstream docs that explain code paths or features which have not yet landed locally.
- Keep local fork governance records local unless there is an intentional publication decision.
- Reconcile shared top-level docs manually and in small slices.

## Recommended Replay Order

1. Start from a clean review branch based on local `main` after the current repo-hygiene wave is committed.
2. Re-run `git fetch upstream` and confirm the divergence baseline again before touching docs.
3. Review `AGENTS.md` and `CLAUDE.md` first, because they affect future agent behavior across the repository.
4. Review `README.md` second, preserving current local operational truth while selectively porting upstream messaging or setup details that still apply.
5. Defer upstream-only code-coupled docs such as COBOL and PR626 notes until their matching code convergence is planned.
6. Keep local superpowers and OpenSpec history fork-local unless there is a deliberate upstream publication pass.

## Output Mapping

This baseline is operationalized by OpenSpec change:

- `openspec/changes/2026-04-06-upstream-doc-governance-convergence/`
