# Dual CLI Manual MCP Command Convergence Design

## Goal

Make Claude Code and Codex manual MCP setup instructions derive from the same
platform command source as the actual MCP entry, so Windows and non-Windows
guidance stay aligned.

## Design Principles

### 1. One command truth source

`getDefaultMcpEntry()` already represents the runtime command that GitNexus
expects each host to execute. Manual instructions should render from that data
instead of duplicating a second platform-specific string.

### 2. Scope the repair to the two primary CLI hosts

This repository mainly targets Claude Code and Codex. The change therefore
converges those two host adapters and the shared docs they rely on, without
expanding into a broader host-adapter refactor.

### 3. Prefer additive shared logic over adapter-specific branching

A small shared formatter in `host-adapters/shared.ts` keeps the platform
quoting and argument-joining logic in one place. Claude Code and Codex can then
prepend their own `mcp add` prefix while reusing the same rendered command
tail.

### 4. Lock behavior with explicit Windows coverage

The existing tests only verify that manual instructions contain the host name.
This change adds platform-specific assertions so Windows command rendering must
stay correct for both CLI hosts.

## Workstreams

### Workstream A: Add the shared formatter

Create a helper that accepts a host CLI prefix and an `McpEntry`, then renders a
manual command string.

### Workstream B: Update the two host adapters

Replace hard-coded manual command constants in the Claude Code and Codex
adapters with the shared formatter output.

### Workstream C: Update repo docs

Show the same cross-platform guidance in the main README, package README, and
quick-start guide.

## Out Of Scope

- changing the configured `McpEntry` behavior
- refactoring other host adapters
- broad CLI setup workflow redesign

## Verification

This change is complete when:

1. Claude Code and Codex manual instructions both derive from shared command
   rendering
2. Windows-specific tests cover both CLI hosts
3. the shared docs no longer hard-code a non-Windows-only command
