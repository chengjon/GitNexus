## Why

The repository now has a bounded audit for the `.git` read-only submount and
the alternate index/object-store workaround, but without an OpenSpec change the
result is still easy to miss or treat as an ad hoc chat-only workaround.

The current boundary also matters because it can be confused with the already
repaired MCP mmap incident. Maintainers need a durable governance record that
separates:

- the repaired mmap/runtime-drain failure
- the current host/filesystem `.git` read-only boundary
- the approved temporary validation flow that keeps docs-only staged checks
  working without writing the real `.git/index`

## What Changes

- Add a docs-only OpenSpec change for the `.git` read-only submount and
  alternate object-store audit
- Register the new audit as the current follow-up record from the existing MCP
  mmap audit
- Keep the mount evidence, inferred cause, and temporary validation workflow
  explicitly traceable

## Capabilities

### New Capabilities

- `read-only-git-index-and-alternate-object-store-audit`: Keep the repository's
  `.git` read-only boundary and temporary staged-validation workflow recorded as
  a bounded governance slice.

### Modified Capabilities

- `mcp-mmap-root-cause-and-runtime-drain-audit`: Point readers from the repaired
  mmap incident to the newer `.git` read-only audit when current validation is
  blocked by filesystem policy rather than runtime failure.

## Impact

- Affected docs:
  - `docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md`
  - `docs/audits/2026-04-09-read-only-git-index-and-alternate-object-store.md`
- Reused verification evidence:
  - `findmnt -R /opt/claude/GitNexus -o TARGET,SOURCE,FSTYPE,OPTIONS,PROPAGATION`
  - `findmnt -T /opt/claude/GitNexus/.git -o TARGET,SOURCE,FSTYPE,OPTIONS,PROPAGATION`
  - `dmesg | tail -n 40`
  - alternate `GIT_INDEX_FILE` / `GIT_OBJECT_DIRECTORY` / `GIT_ALTERNATE_OBJECT_DIRECTORIES` staged verification
  - `detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})` under alternate git storage
