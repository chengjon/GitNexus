## Design

This slice updates only governance and historical plan documents.

- treat the landed design doc, roadmap status, and current file structure as
  the completion truth source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the refactor as never executed
- avoid reopening the original LocalBackend refactor itself
