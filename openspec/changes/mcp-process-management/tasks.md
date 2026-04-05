## 1. OpenSpec Artifacts

- [x] 1.1 Finalize proposal, design, and capability spec for MCP process management
- [x] 1.2 Validate the OpenSpec change artifacts

## 2. Runtime Registry

- [x] 2.1 Add runtime config defaults for heartbeat, stale threshold, and idle threshold
- [x] 2.2 Implement global MCP process registry helpers under `src/runtime/`
- [x] 2.3 Add unit tests for registry read/write/list/remove behavior

## 3. Router And Worker Lifecycle

- [x] 3.1 Extend worker bootstrap metadata with `sessionId` and `routerPid`
- [x] 3.2 Register router and repo-worker processes in the runtime registry
- [x] 3.3 Add worker heartbeat refresh and router orphan detection
- [x] 3.4 Add unit and integration coverage for bootstrap metadata and orphan cleanup

## 4. CLI Inspection And Cleanup

- [x] 4.1 Add `gitnexus mcp ps` command wiring in the CLI entrypoint
- [x] 4.2 Add `gitnexus mcp gc` command wiring in the CLI entrypoint
- [x] 4.3 Implement process listing, derived health classification, and cleanup behavior
- [x] 4.4 Add unit tests for `mcp ps` and `mcp gc`

## 5. Analyze Integration

- [x] 5.1 Make analyze cleanup registry-aware before signal-based holder termination
- [x] 5.2 Surface registry-backed holder details in timeout/error output
- [x] 5.3 Add unit coverage for registry-aware holder cleanup logic

## 6. Verification

- [x] 6.1 Run focused unit tests for runtime registry, worker manager, MCP command, and analyze cleanup
- [x] 6.2 Run focused integration tests for repo worker lifecycle
- [x] 6.3 Run `openspec change validate mcp-process-management`

## 7. Cooperative Drain

- [x] 7.1 Extend runtime/process config with drain acknowledgement and completion thresholds
- [x] 7.2 Add cooperative drain handling to repo workers and router-side worker management
- [x] 7.3 Add `gitnexus mcp drain --repo <name>` command wiring and reporting
- [x] 7.4 Make `gitnexus analyze` attempt cooperative drain before signal fallback
- [x] 7.5 Add unit and integration coverage for drain request, acknowledgement, completion, and fallback paths
