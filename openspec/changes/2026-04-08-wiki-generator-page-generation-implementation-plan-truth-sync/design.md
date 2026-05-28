## Design

This slice updates only governance and historical plan documents.

- treat the truth-synced design doc, roadmap status, and current source/test
  anchors as the completion truth source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the page-generation extraction as unexecuted
- avoid reopening the already-landed wiki leaf/parent page-generation
  extraction itself
