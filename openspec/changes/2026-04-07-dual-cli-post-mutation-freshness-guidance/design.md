## Design

This slice aligns shared GitNexus freshness guidance with the actual current
host behavior.

- Claude Code keeps the existing PostToolUse automatic-refresh note
- Codex gets an explicit manual-rerun note for `gitnexus analyze`
- quick-start and generated context stay aligned

This preserves real dual-CLI behavior without introducing a new Codex hook.
