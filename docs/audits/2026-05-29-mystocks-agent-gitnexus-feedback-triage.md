# 2026-05-29 MyStocks Agent Feedback Triage

Line Scope: this line only triages the MyStocks feedback into a GitNexus maintainer action document; no code changes, no external project operations, no runtime changes.

Workline Lane: governance.

Source feedback: [2026-05-29-mystocks-agent-gitnexus-feedback.md](/opt/claude/GitNexus/docs/audits/2026-05-29-mystocks-agent-gitnexus-feedback.md)

Status: maintainer intake draft.

## Summary

The MyStocks feedback confirms that the 2026-05-29 upstream direction is useful for real agent workflows: multi-repo MCP, global registry behavior, lazy LadybugDB graph loading, worktree-aware concepts, API route and shape tooling, and contract-oriented analysis match the needs of a larger governed project.

The main gap is operator flow rather than graph quality. Once a clean, path-limited index existed for the MyStocks worktree, staged scope checking produced the expected low-risk docs-only result. The failure path before that point was confusing: MCP transport closed, repo aliases did not point at the active linked worktree, CLI staged detection missed changes under the wrong alias, and full analyze appeared stalled without enough heartbeat information.

This feedback should be treated as a product-quality issue for agent reliability. A correct graph is not enough if agents cannot reliably select the right repository, detect staged changes from linked worktrees, recover from disconnected MCP transports, or understand whether an index is stale.

## Maintainer Priority

| ID | Priority | Area | Request |
|----|----------|------|---------|
| GN-FB-001 | P0 | CLI staged detection | Make `detect-changes --scope staged` worktree-aware, or add explicit `--cwd` / `--worktree` flags. |
| GN-FB-002 | P1 | MCP failure UX | Replace opaque `Transport closed` outcomes where possible with structured diagnostics and exact reconnect guidance. |
| GN-FB-003 | P1 | Repository resolution | Improve alias mismatch errors for large registries, including nearest-current-cwd suggestions. |
| GN-FB-004 | P1 | Index freshness | Include selected repo path, index path, cwd, indexed commit, current commit, and stale severity in detect-change outputs. |
| GN-FB-005 | P2 | Analyze observability | Add progress heartbeat, phase reporting, and stall hints for long or broad analyzes. |
| GN-FB-006 | P2 | Agent workflow | Provide a first-class staged verification command for agents. |
| GN-FB-007 | P2 | Docs-only indexing | Add docs-only or path-limited indexing mode without requiring temporary ignore-file edits. |
| GN-FB-008 | P3 | Optional grammars | Scope optional grammar warnings to selected paths and detected language mix. |

## GN-FB-001: Worktree-Aware CLI Staged Detection

Problem:

`gitnexus detect-changes --scope staged --repo mystocks` reported no staged changes even though the command was run for a linked MyStocks worktree with staged documentation changes. The likely cause is that the repo alias resolved to a root checkout rather than the linked worktree path.

Why this matters:

Agents use staged detection as the pre-commit scope gate. A false "No changes detected" result defeats the safety check and can cause the agent to proceed with no blast-radius signal.

Requested behavior:

- Add explicit `--cwd <path>` and/or `--worktree <path>` support to the CLI, matching the MCP tool contract.
- When the selected repo alias path differs from the current working directory or explicit worktree path, warn and show both paths.
- Prefer the active linked worktree when the command is launched inside one.
- Return machine-readable fields in JSON mode: `requestedRepo`, `selectedRepo`, `repoPath`, `cwd`, `worktreePath`, `indexPath`, `scope`, `stagedFileCount`, and `stale`.

Acceptance criteria:

- From a linked worktree with staged files, `gitnexus detect-changes --scope staged --cwd <worktree> --repo <root-alias>` either analyzes the worktree correctly or fails with a clear alias/path mismatch diagnostic.
- The same command without `--cwd` works correctly when the process cwd is inside the linked worktree.
- A regression fixture covers a root checkout plus linked worktree with staged docs-only changes.

## GN-FB-002: MCP Transport Failure UX

Problem:

The MCP call failed with `Transport closed`, and the agent had to fall back to the CLI without a structured recovery path.

Boundary:

If the MCP process has already exited or stdio transport is already closed, the server cannot return a normal tool payload from inside that dead transport. The product still needs better recovery at the edges: in-process tool errors should be structured, host documentation should explain reconnect steps, and `doctor` should distinguish CLI health from MCP transport availability.

Requested behavior:

- Wrap internal MCP tool errors as structured JSON with `code`, `message`, `repo`, `cwd`, `suggestedCliCommand`, and `hostRecovery`.
- Add a documented recovery message for closed-transport cases: restart the MCP host/session, then retry with the suggested CLI fallback if reconnect is not available.
- Extend `gitnexus doctor --json` or an MCP-specific doctor path to distinguish:
  - CLI can read registry and indexes.
  - MCP server is configured.
  - MCP transport is currently connected or disconnected.
  - Native graph runtime is loadable.

Acceptance criteria:

- Recoverable MCP tool failures return a compact structured diagnostic rather than an unbounded stack or opaque string.
- Documentation explains that a fully closed transport requires host/session reconnect and cannot be repaired by the already-dead server process.
- The CLI fallback command is shown at the failure point for staged scope checks.

## GN-FB-003: Repository Alias Diagnostics

Problem:

The workflow referred to `mystocks_spec`, while the registry had `mystocks`. The resulting error payload listed too much registry data and did not clearly suggest the repository closest to the current cwd.

Requested behavior:

- On alias mismatch, return a compact diagnostic instead of dumping a large registry.
- Include nearest candidates by:
  - exact path prefix match against cwd.
  - basename similarity.
  - recent index freshness.
- Include a clear hint such as `gitnexus list --all` or the existing equivalent registry inspection command.
- In JSON mode, expose `requestedRepo`, `candidateRepos`, `nearestByCwd`, `registryCount`, and `truncated`.

Acceptance criteria:

- Large registries produce a short, bounded error message.
- When cwd is inside a registered repo or worktree, the nearest alias is presented first.
- The diagnostic tells the operator how to re-run with the correct alias.

## GN-FB-004: Stale Index Metadata In Detect-Changes

Problem:

Stale index state was relevant to the failed scope checks but did not appear prominently in the detect-change result.

Requested behavior:

Every detect-change result should include index freshness metadata:

- `selectedRepo`
- `repoPath`
- `cwd`
- `indexPath`
- `indexedCommit`
- `currentCommit`
- `stale`
- `staleReason`
- `staleSeverity`

Acceptance criteria:

- Text output prints a short freshness block before the risk summary.
- JSON output includes the metadata even when no changes are detected.
- Stale root-index usage from a linked worktree is visible without requiring a separate `status` command.

## GN-FB-005: Analyze Progress And Stall Hints

Problem:

Full worktree analyze appeared stalled for several minutes. Logs showed early grammar and skipped-file output, but did not provide enough phase progress, worker status, or elapsed-time heartbeat to distinguish slow progress from a hang.

Requested behavior:

- Print phase heartbeat during broad analyzes.
- Include elapsed time, scanned files, included files, skipped files, parsed files, queued worker tasks, active workers, and current phase.
- When `--worker-timeout` is set, report which worker or file exceeded the timeout.
- In quiet or JSON modes, provide equivalent structured progress events.

Acceptance criteria:

- A long analyze emits bounded progress at a predictable interval.
- Operators can see whether the process is scanning, parsing, writing graph data, or waiting on workers.
- Timeout reports identify the phase and relevant file path when available.

## GN-FB-006: First-Class Agent Staged Verification

Problem:

Agents need one command that performs the intended safety check without requiring them to know the correct combination of analyze, repo alias, worktree path, stale index, and staged diff options.

Proposed command:

```bash
gitnexus verify-staged --cwd <worktree> --json
```

Requested behavior:

- Resolve the active repo/worktree.
- Verify index freshness or clearly state stale status.
- Run staged detect changes.
- Return bounded, agent-friendly output with risk, changed symbols, affected processes, selected repo metadata, and suggested next action.

Possible alternative:

```bash
gitnexus detect-changes --scope staged --cwd <worktree> --strict-agent --json
```

Acceptance criteria:

- One command is sufficient for a pre-commit agent gate in linked worktrees.
- Output is deterministic and compact enough for MCP/agent use.
- Failure states include the exact recovery command.

## GN-FB-007: Docs-Only Or Path-Limited Indexing Mode

Problem:

The successful MyStocks recovery used a temporary whitelist-style `.gitnexusignore` to produce a lightweight docs-only index. That worked, but it required mutating the target project, which violates the operator boundary for external projects unless explicitly approved.

Requested behavior:

- Add a CLI-supported docs-only or include-path mode that does not require editing `.gitnexusignore`.
- Example:

```bash
gitnexus analyze \
  --index-only \
  --docs-only \
  --include .planning/ \
  --include docs/reports/ \
  --include governance/mainline/task-cards/ \
  --name <alias> \
  <worktree>
```

Acceptance criteria:

- The same lightweight index can be generated without modifying the target repo.
- The selected include/exclude rules appear in analyze metadata.
- Detect-change output can state that the index is path-limited, not full-repo.

## GN-FB-008: Optional Grammar Warning Scope

Problem:

The `tree-sitter-proto` optional grammar warning was technically correct but noisy when the selected worktree slice had no relevant proto files.

Requested behavior:

- Defer optional grammar warnings until after selected path/language discovery when feasible.
- Demote or summarize optional grammar warnings when the selected include set contains no files for that language.
- Keep warnings visible for full-repo indexes where the language is present or unknown.

Acceptance criteria:

- Docs-only runs do not prominently warn about unrelated optional grammars.
- Full code indexes still report missing grammars that affect parsed source coverage.

## Open Product Questions

1. Should `verify-staged` be a new command, or should the existing `detect-changes` command gain an agent-safe mode?
2. Should worktree aliases be stored as first-class registry entries, or should the root repo alias dynamically resolve the active linked worktree by cwd?
3. Should path-limited indexes be considered acceptable for scope checks, or should they be marked as partial and require explicit operator acknowledgement?
4. Where should MCP reconnect guidance live for each host: GitNexus docs, generated MCP setup output, `doctor`, or all three?
5. What output size limit should be enforced for repository alias diagnostics in large registries?

## Suggested Implementation Slices

These should be separate worklines and separate commits:

1. Worktree-aware `detect-changes` CLI path resolution.
2. Bounded alias mismatch diagnostics.
3. Detect-change freshness metadata in text and JSON output.
4. Analyze heartbeat and worker timeout reporting.
5. Agent-safe staged verification command or mode.
6. Docs-only/path-limited analyze mode.
7. Optional grammar warning scoping.
8. MCP structured error and reconnect documentation.

## Verification Matrix

| Scenario | Expected Result |
|----------|-----------------|
| Linked worktree with staged docs, cwd inside worktree | Staged changes are detected without requiring a separate worktree alias. |
| Linked worktree with root alias mismatch | CLI warns about selected root path versus active worktree path. |
| Large global registry, bad alias | Error is compact and suggests nearest cwd-matching repo. |
| Stale index | Detect-change output includes indexed/current commit metadata and stale severity. |
| Long analyze | Heartbeat reports phase and file counts before operator timeout. |
| Docs-only analyze | No target repo file mutation is required; metadata says the index is path-limited. |
| Missing optional grammar with no matching files | Warning is demoted or summarized. |
| Recoverable MCP tool failure | Structured diagnostic includes CLI fallback and host reconnect guidance. |

## Immediate Recommendation

Start with GN-FB-001, GN-FB-003, and GN-FB-004. Together they address the highest-risk failure mode: an agent running the right safety check against the wrong checkout or stale index and receiving a misleading empty result.

Treat GN-FB-002 as two tracks: improve in-process MCP tool errors in code, and document the hard boundary that a fully closed transport requires host/session reconnect.

## Local Intake Verification Note

During this GitNexus-side intake, three audit-document files were staged:

- `docs/audits/2026-05-29-mystocks-agent-gitnexus-feedback.md`
- `docs/audits/2026-05-29-mystocks-agent-gitnexus-feedback-triage.md`
- `docs/audits/README.md`

The local fallback command returned `No changes detected`:

```bash
node gitnexus/dist/cli/index.js detect-changes --scope staged --repo GitNexus
```

This does not block the governance documentation update, but it confirms that staged docs-only checks can currently produce a misleading empty GitNexus result unless the repository/index selection and docs coverage are known to match the staged paths.
