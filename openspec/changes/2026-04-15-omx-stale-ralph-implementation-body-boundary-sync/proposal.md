## Why

The historical `docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md`
page already states that the fix was implemented locally in the installed OMX
package, but once readers enter the preserved `Publication Status` and
`Recommended Next Step` sections there is no extra local boundary note
explaining that those replay and follow-up statements remain the 2026-04-12
implementation baseline rather than a current active GitNexus task queue or
live upstream handoff.

That still leaves room for the preserved implementation audit body to be
mistaken for current open execution work.

## What Changes

- Add an explicit historical-implementation note before the preserved audit body
- Add an explicit note before `Publication Status` clarifying historical replay
  scope
- Add an explicit note before `Recommended Next Step` clarifying historical
  follow-up posture
- Record the boundary sync in the audits entrypoint and OpenSpec docs

## Capabilities

### New Capabilities

- `omx-stale-ralph-implementation-body-boundary-sync`: Keep the preserved body
  of the 2026-04-12 stale-Ralph implementation audit clearly marked as
  historical implementation and replay context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md`
  - `docs/audits/2026-04-15-omx-stale-ralph-implementation-body-boundary-sync.md`
  - `docs/audits/README.md`
  - `openspec/changes/2026-04-15-omx-stale-ralph-implementation-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-12 stale-Ralph implementation audit
  - current 2026-04-12 stale-Ralph upstream replay note
