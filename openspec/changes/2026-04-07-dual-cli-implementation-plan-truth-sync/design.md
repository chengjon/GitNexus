## Design

This slice updates only governance and planning documents.

- use the corresponding `openspec/changes/<change-id>/tasks.md` files as the
  execution-truth source
- sync the four historical implementation plans to that recorded completion
- do not reopen or re-implement the original dual-CLI behavior changes

This keeps the planning ledger aligned with completed work without changing any
Claude Code or Codex runtime behavior.
