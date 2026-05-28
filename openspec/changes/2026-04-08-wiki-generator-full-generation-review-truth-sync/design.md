## Design

This slice updates only governance and historical review documents.

- treat the historical review doc, the `2026-03-28` technical-debt audit,
  roadmap status, and current source anchors as the completion truth source
- keep the original review comments, but add explicit status-sync framing so
  the document no longer reads like an active pre-implementation gate
- annotate the `failedModules` finding with its landed resolution in the helper
  and wrapper code paths
- avoid reopening the already-landed wiki full-generation extraction itself
