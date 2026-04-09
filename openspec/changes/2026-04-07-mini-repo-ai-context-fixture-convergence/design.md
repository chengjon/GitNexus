## Design

This slice fixes fixture drift without touching generator behavior.

- keep the current `ai-context` generator unchanged
- add a focused regression test for the checked-in `mini-repo` fixture docs
- update the fixture docs to match the current generated contract

This keeps the fixture layer honest while preserving runtime behavior.
