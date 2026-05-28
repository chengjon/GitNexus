## Design

This slice updates only governance and historical plan documents.

- treat the truth-synced design doc, technical-debt audit, roadmap status, and
  current source/test anchors as the completion truth source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the incremental-update extraction as unexecuted
- avoid reopening the already-landed wiki incremental-update extraction itself
