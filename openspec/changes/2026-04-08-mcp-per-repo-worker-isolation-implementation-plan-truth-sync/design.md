## Design

This slice updates only governance and historical plan/status documents.

- treat the current router/worker source/test anchors, later archived
  `mcp-process-management` docs, and roadmap status as the completion truth
  source
- keep the historical implementation plan, but backfill its execution state so
  it no longer reports the landed router/worker architecture as still proposed
- update the related design/status docs so they describe the current MCP
  baseline accurately
- avoid reopening the original router/worker architecture implementation itself
