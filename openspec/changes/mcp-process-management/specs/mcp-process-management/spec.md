## ADDED Requirements

### Requirement: GitNexus SHALL publish MCP process registry records
GitNexus SHALL publish registry records for GitNexus-owned MCP router and
repo-worker processes under a global runtime directory so that operator-facing
commands can inspect lifecycle and ownership information.

#### Scenario: Router publishes a registry record
- **WHEN** `gitnexus mcp` starts in router mode
- **THEN** GitNexus writes a router process record with PID, role, session ID,
  timestamps, cwd, and command metadata

#### Scenario: Repo worker publishes a registry record
- **WHEN** a repo worker initializes successfully
- **THEN** GitNexus writes a repo-worker record with PID, role, session ID,
  router PID, repo identity, and heartbeat timestamp

### Requirement: GitNexus SHALL report MCP process state through CLI
GitNexus SHALL provide a CLI command that lists GitNexus-owned MCP router and
repo-worker processes together with lifecycle and derived health information.

#### Scenario: Operator lists active MCP processes
- **WHEN** the operator runs `gitnexus mcp ps`
- **THEN** GitNexus prints each known router and worker with PID, role, session
  identity, last heartbeat age, lifecycle state, and derived health

#### Scenario: Reader derives stale health from a dead PID
- **WHEN** a registry record exists for a PID that is no longer alive
- **THEN** `gitnexus mcp ps` classifies that record as `stale`

### Requirement: GitNexus SHALL clean stale metadata and orphaned workers
GitNexus SHALL provide a cleanup command that removes stale registry entries
and terminates GitNexus-owned orphaned workers after revalidating PID liveness
and ownership.

#### Scenario: Cleanup removes stale records
- **WHEN** the operator runs `gitnexus mcp gc`
- **THEN** GitNexus removes registry entries whose PIDs are no longer alive

#### Scenario: Cleanup terminates orphaned worker processes
- **WHEN** the operator runs `gitnexus mcp gc` and GitNexus finds a live
  repo-worker whose router PID is no longer alive
- **THEN** GitNexus sends termination to that worker and reports the cleanup

### Requirement: Repo workers SHALL self-terminate when the owning router dies
Repo workers SHALL detect loss of their owning router and shut down without
requiring manual intervention.

#### Scenario: Worker exits after router loss
- **WHEN** a repo worker observes that its recorded router PID is no longer
  alive
- **THEN** the worker disconnects its local backend and exits

### Requirement: Analyze SHALL use runtime registry data when quiescing holders
`gitnexus analyze` SHALL consult runtime registry data when interpreting and
reporting GitNexus-owned MCP holders for the target repo's Kuzu path.

#### Scenario: Analyze classifies holder PIDs using registry records
- **WHEN** `gitnexus analyze` finds GitNexus MCP holder PIDs for a target Kuzu
  path
- **THEN** it correlates those PIDs with registry records before reporting or
  cleaning them

### Requirement: GitNexus SHALL support cooperative repo-worker drain
GitNexus SHALL support asking a GitNexus-owned repo worker to enter a draining
state, stop accepting new work, release its repo runtime, and exit.

#### Scenario: Operator drains a repo worker by repo name
- **WHEN** the operator runs `gitnexus mcp drain --repo repo-a`
- **THEN** GitNexus identifies the matching repo-worker from runtime registry
  metadata, requests a cooperative drain, and reports whether the worker
  acknowledged and exited

#### Scenario: Worker reports draining before exit
- **WHEN** a repo worker receives a cooperative drain request
- **THEN** it updates its lifecycle state to `draining`, rejects new repo
  requests, and exits after in-flight work finishes or shutdown begins

### Requirement: Analyze SHALL prefer cooperative drain before signal fallback
`gitnexus analyze` SHALL attempt cooperative drain of GitNexus-owned repo
workers holding the target repo before sending termination signals.

#### Scenario: Analyze drains a matching holder before signal escalation
- **WHEN** `gitnexus analyze` finds a GitNexus-owned repo-worker holding the
  target repo's Kuzu path
- **THEN** it first sends a cooperative drain request and waits for
  acknowledgement/completion before falling back to `SIGTERM`
