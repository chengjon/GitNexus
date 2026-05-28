## Design

This slice updates only governance and historical review documents.

- treat the historical review doc, truth-synced design record, archived
  OpenSpec change, roadmap status, and current runtime/CLI/test anchors as the
  completion truth source
- keep the original review comments, but add explicit status-sync framing so
  the document no longer reads like an active pre-implementation gate
- avoid reopening the already-landed MCP process-management implementation
