## Design

This slice updates only governance and historical plan documents.

- treat the historical design doc, roadmap status, and current route extraction
  file structure as the completion truth source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the refactor as never executed
- update the historical design doc so it is preserved as a landed record rather
  than an active draft
- avoid reopening the original `parse-worker` route extraction refactor itself
