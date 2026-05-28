## Design

This slice updates only governance and historical review documents.

- treat the historical review doc, truth-synced design record, roadmap status,
  and current source/test anchors as the completion truth source
- keep the original review comments, but add explicit status-sync framing so
  the document no longer reads like an active pre-implementation gate
- avoid reopening the already-landed wiki support-helper and run-pipeline
  extraction itself
