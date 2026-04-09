## Design

This slice updates only governance and historical plan documents.

- treat the truth-synced design doc, the `2026-03-28` technical-debt audit,
  roadmap status, and current source/test anchors as the completion truth
  source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the full-generation extraction as unexecuted
- align the old `failedModules` wording with the landed implementation shape:
  helper-owned accumulation plus wrapper-level mergeback
- avoid reopening the already-landed wiki full-generation extraction itself
