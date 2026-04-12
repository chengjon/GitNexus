## Why

GitNexus encountered a recurring local OMX warning:

```text
warning: OMX Ralph is still active (phase: starting)
```

The observed state was a stale half-started Ralph run rather than legitimate
work in progress. There was no single documented operator command in the repo
for cleaning that state up safely.

Because GitNexus carries local OMX governance and troubleshooting records, this
behavior needs a formal change record that captures:

- the shortest safe operator command
- the safety boundaries around stale cleanup
- the verification evidence that the command actually clears the warning

## What Changes

- record `omx cancel ralph --stale` as the shortest safe cleanup command for a
  stale Ralph startup session
- document the stale-detection safety rules and refusal cases
- record implementation and verification evidence from the locally installed OMX
  package
- add an upstream replay note so the verified local fix can be ported into the
  canonical `oh-my-codex` source repository later

## Capabilities

### New Capabilities

- `omx-stale-ralph-cancel`: Keep a formal repository record for the safe local
  operator command that clears stale Ralph `starting` state.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-04-12-omx-stale-ralph-cancel-design.md`
  - `docs/superpowers/plans/2026-04-12-omx-stale-ralph-cancel-implementation-plan.md`
  - `docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md`
  - `docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md`
- Affected OMX runtime evidence:
  - local installed package under `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex`
  - local `.omx/state/*` Ralph and skill-active files in the GitNexus workspace
