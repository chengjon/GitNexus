## Design

This slice updates only governance and historical plan documents.

- treat the truth-synced design doc, roadmap status, and current source/test
  anchors as the completion truth source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the module-tree extraction as unexecuted
- avoid reopening the already-landed wiki module-tree extraction itself
