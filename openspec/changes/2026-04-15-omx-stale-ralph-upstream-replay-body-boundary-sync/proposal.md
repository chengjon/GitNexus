## Why

The historical `docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md`
page already explains that it exists to replay the locally verified stale-Ralph
fix into the canonical OMX source repository, but once readers enter the
preserved `Upstream Source Replay Status`, `Replay Strategy`, and checklist
sections there is no extra local boundary note explaining that those branch,
PR, and replay instructions remain the 2026-04-12 replay baseline rather than
current active GitNexus execution work.

That still leaves room for the preserved replay note body to be mistaken for a
live upstream handoff queue.

## What Changes

- Add an explicit historical-replay note before the preserved replay-note body
- Add an explicit note before `Upstream Source Replay Status` clarifying
  historical publication-snapshot scope
- Add an explicit note before `Replay Strategy` clarifying historical replay
  guidance scope
- Record the boundary sync in the audits entrypoint and OpenSpec docs

## Capabilities

### New Capabilities

- `omx-stale-ralph-upstream-replay-body-boundary-sync`: Keep the preserved body
  of the 2026-04-12 stale-Ralph upstream replay note clearly marked as
  historical replay context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md`
  - `docs/audits/2026-04-15-omx-stale-ralph-upstream-replay-body-boundary-sync.md`
  - `docs/audits/README.md`
  - `openspec/changes/2026-04-15-omx-stale-ralph-upstream-replay-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-12 stale-Ralph upstream replay note
  - current 2026-04-12 stale-Ralph implementation audit
