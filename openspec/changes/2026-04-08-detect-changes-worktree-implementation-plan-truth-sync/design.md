## Design

This slice updates only governance and historical plan documents.

- treat the truth-synced design doc, truth-synced review doc, roadmap status,
  and current source/test anchors as the completion truth source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the fix as never executed
- avoid reopening the original `detect_changes` worktree resolution fix itself
