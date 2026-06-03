## 1. Investigation

- [x] 1.1 Trace the local CLI analyze write path to confirm where the index
      is stored (path, format, generation marker)
- [x] 1.2 Trace the MCP stale-check logic to confirm what it compares
      (indexed_commit vs HEAD vs staged diff)
- [x] 1.3 Confirm whether CLI and MCP use the same storage path or different
      namespaces

## 2. Stale Reason Granularity

- [x] 2.1 Add a `fresh_for_staged_diff` boolean: true when all staged files
      are covered by the current graph, even if HEAD differs
- [x] 2.2 Add granular stale reasons:
      - `commit_mismatch` — HEAD differs from indexed commit

## 3. CLI Freshness Command

- [x] 3.1 Add `gitnexus status --json` with fields: repo, repo_path,
      indexed_commit, current_commit, dirty, staged_files,
      index_updated_at, fresh_for_staged_diff
- [x] 3.2 Document the command in CLI help and zh-CN i18n

## 4. Testing

- [ ] 4.1 Test: fresh_for_staged_diff populated in index status
- [ ] 4.2 Test: stale_reasons populated when commits differ
- [ ] 4.3 Test: gitnexus status --json structured output

## 5. Verification

- [ ] 5.1 Run `gitnexus status --json` — confirm output matches expectations
- [ ] 5.2 Run MCP detect_changes after local analyze — confirm stale metadata
