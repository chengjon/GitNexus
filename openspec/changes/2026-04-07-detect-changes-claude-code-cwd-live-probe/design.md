## Design

This slice updates only probe, review, and governance documents.

- use a temporary MCP probe server outside the repo to capture raw tool-call
  arguments
- record the result as current-Claude-Code evidence, not as a timeless
  guarantee
- narrow the remaining host uncertainty to Cursor and other clients
