## Design

This slice updates only governance and historical plan documents.

- treat the truth-synced design doc, historical review doc, technical-debt
  audit, roadmap status, and current source/test anchors as the completion
  truth source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the support/run-pipeline extraction as unexecuted
- avoid reopening the already-landed wiki support-helper and run-pipeline
  extraction itself
