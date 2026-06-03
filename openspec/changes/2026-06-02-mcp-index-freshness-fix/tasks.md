## 1. Investigation

- [ ] 1.1 Trace the local CLI analyze write path to confirm where the index
      is stored (path, format, generation marker)
- [ ] 1.2 Trace the MCP stale-check logic to confirm what it compares
      (indexed_commit vs HEAD vs staged diff)
- [ ] 1.3 Confirm whether CLI and MCP use the same storage path or different
      namespaces

## 2. Stale Reason Granularity

- [ ] 2.1 Add a `fresh_for_staged_diff` boolean: true when all staged files
      are covered by the current graph, even if HEAD differs
- [ ] 2.2 Add granular stale reasons:
      - `graph_missing_files` — staged files not in index
      - `head_ahead_uncommitted` — HEAD differs but staged files are indexed
      - `index_path_mismatch` — CLI and MCP point to different storage
- [ ] 2.3 Add `index_path` and `index_generation_id` to MCP metadata

## 3. Index Path Transparency

- [ ] 3.1 Add `analyzer_source` field to detect_changes metadata:
      `local-cli` | `mcp-managed` | `unknown`
- [ ] 3.2 Add `last_analyze_at` and `last_analyze_command` to metadata
- [ ] 3.3 Add `index_matches_local_cli: true | false | unknown`

## 4. CLI Freshness Command

- [ ] 4.1 Add `gitnexus status --json` with fields: repo, repo_path,
      index_path, indexed_commit, current_commit, dirty, staged_files,
      unstaged_files, index_updated_at, fresh_for_staged_diff, fresh_for_head
- [ ] 4.2 Document the command in CLI help and CLAUDE.md

## 5. Testing

- [ ] 5.1 Test: local analyze → immediate MCP detect_changes shows
      `stale: false` or actionable stale reason
- [ ] 5.2 Test: staged-only change after analyze shows
      `fresh_for_staged_diff: true`
- [ ] 5.3 Test: index path mismatch detected and reported
- [ ] 5.4 Update existing detect_changes tests for new metadata fields

## 6. Verification

- [ ] 6.1 Run `gitnexus detect_changes({scope: "staged"})` in a worktree
      after local analyze — confirm stale metadata is accurate
- [ ] 6.2 Run `gitnexus status --json` — confirm output matches expectations
