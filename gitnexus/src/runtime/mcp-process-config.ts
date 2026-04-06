export interface McpProcessTimingConfig {
  drainAckTimeoutMs: number;
  drainCompletionTimeoutMs: number;
  heartbeatIntervalMs: number;
  idleThresholdMs: number;
  staleThresholdMs: number;
}

export const DEFAULT_MCP_DRAIN_ACK_TIMEOUT_MS = 2_000;
export const DEFAULT_MCP_DRAIN_COMPLETION_TIMEOUT_MS = 15_000;
export const DEFAULT_MCP_HEARTBEAT_INTERVAL_MS = 20_000;
export const DEFAULT_MCP_STALE_THRESHOLD_MS = 60_000;
export const DEFAULT_MCP_IDLE_THRESHOLD_MS = 120_000;

const readPositiveInt = (raw: string | undefined, fallback: number): number => {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const getDefaultMcpProcessTimingConfig = (
  env: NodeJS.ProcessEnv = process.env,
): McpProcessTimingConfig => ({
  drainAckTimeoutMs: readPositiveInt(
    env.GITNEXUS_MCP_DRAIN_ACK_TIMEOUT_MS,
    DEFAULT_MCP_DRAIN_ACK_TIMEOUT_MS,
  ),
  drainCompletionTimeoutMs: readPositiveInt(
    env.GITNEXUS_MCP_DRAIN_COMPLETION_TIMEOUT_MS,
    DEFAULT_MCP_DRAIN_COMPLETION_TIMEOUT_MS,
  ),
  heartbeatIntervalMs: readPositiveInt(
    env.GITNEXUS_MCP_HEARTBEAT_INTERVAL_MS,
    DEFAULT_MCP_HEARTBEAT_INTERVAL_MS,
  ),
  idleThresholdMs: readPositiveInt(
    env.GITNEXUS_MCP_IDLE_THRESHOLD_MS,
    DEFAULT_MCP_IDLE_THRESHOLD_MS,
  ),
  staleThresholdMs: readPositiveInt(
    env.GITNEXUS_MCP_STALE_THRESHOLD_MS,
    DEFAULT_MCP_STALE_THRESHOLD_MS,
  ),
});
