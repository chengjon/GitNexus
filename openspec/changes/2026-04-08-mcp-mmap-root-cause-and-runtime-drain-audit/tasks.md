## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the MCP mmap root-cause audit slice
- [x] 1.2 Bound the slice to docs-only governance updates

## 2. Inputs

- [x] 2.1 Re-read the dedicated MCP mmap root-cause audit
- [x] 2.2 Re-read the technical-debt roadmap entry used as the governance index
- [x] 2.3 Re-read the measured verification commands and outcomes recorded for the repair

## 3. Governance Writeback

- [x] 3.1 Register the bounded docs-only audit slice for the mmap failure repair record
- [x] 3.2 Update the roadmap entry so readers can reach the audit and OpenSpec change from the existing governance path

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit`
  returned `Change '2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit' is valid`
- `node gitnexus/dist/cli/index.js status /opt/claude/GitNexus`
  returned `Status: up-to-date` with `Health: degraded` and `Reasons: dirty-worktree`
- Because the current chat-bound GitNexus MCP transport was already closed, the
  final scope check was run through `gitnexus eval-server`:
  `curl -sS -X POST http://127.0.0.1:4848/tool/detect_changes -H 'Content-Type: application/json' -d '{"scope":"staged","repo":"GitNexus","cwd":"/opt/claude/GitNexus"}'`
- That staged `detect_changes` run returned `No changes detected.`
