## Design

This slice updates only governance and historical plan documents.

- treat the archived OpenSpec change, historical design/review records,
  roadmap status, and current runtime/CLI/test anchors as the completion truth
  source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the landed feature as still open
- update the historical design doc so it is preserved as a landed record rather
  than an active draft
- avoid reopening the original MCP process-management implementation itself
