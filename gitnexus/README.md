# GitNexus

**Graph-powered code intelligence for AI agents.** Index any codebase into a knowledge graph, then query it via MCP or CLI.

Works with **Cursor**, **Claude Code**, **Windsurf**, **Cline**, **OpenCode**, and any MCP-compatible tool.

[![npm version](https://img.shields.io/npm/v/gitnexus.svg)](https://www.npmjs.com/package/gitnexus)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)

---

## Why?

AI coding tools don't understand your codebase structure. They edit a function without knowing 47 other functions depend on it. GitNexus fixes this by **precomputing every dependency, call chain, and relationship** into a queryable graph.

**Three commands to give your AI agent full codebase awareness.**

## Quick Start

```bash
# Index your repo (run from repo root)
npx gitnexus analyze
```

That remains the main indexing command. By default it also refreshes `AGENTS.md` / `CLAUDE.md`, installs repo-local skills, updates `.gitignore`, and registers the repo for multi-repo MCP discovery.

To configure MCP for your editor, run `npx gitnexus setup` once — or set it up manually below.

`gitnexus setup` auto-detects your editors and writes the correct global MCP config. You only need to run it once.

Use `npx gitnexus init-project` when you only want project-local scaffolding (`.gitignore`, `AGENTS.md`, `CLAUDE.md`, repo skills) without a full re-index. Use `npx gitnexus refresh-context` when the index is already present and you only want to regenerate context files from current metadata. After global setup, `npx gitnexus doctor --host <name>` checks whether host config, registry entries, and repo indexing are all ready.

### AI-Readable Quick Start

For AI CLIs or local agents on this machine, prefer the linked local command:

Canonical single-file reference:
[`docs/ai-cli-local-quick-start.md`](/opt/claude/GitNexus/docs/ai-cli-local-quick-start.md)

```bash
# 0. Optional: verify the active binary
which gitnexus
gitnexus --version

# 1. In the target repository root
gitnexus analyze

# Expected outputs:
# - .gitnexus/
# - AGENTS.md
# - CLAUDE.md
# - .claude/skills/gitnexus/

# 2. Verify MCP readiness for the host you are using
gitnexus doctor --host codex
gitnexus doctor --host claude

# 3. Only initialize project-local files
gitnexus init-project

# 4. Only refresh AI context files
gitnexus refresh-context

# 5. Start MCP manually when the host needs a stdio command
gitnexus mcp
```

If `gitnexus` is not on `PATH`, use the local build directly:

```bash
node /opt/claude/GitNexus/gitnexus/dist/cli/index.js analyze
node /opt/claude/GitNexus/gitnexus/dist/cli/index.js doctor --host codex
node /opt/claude/GitNexus/gitnexus/dist/cli/index.js mcp
```

### Editor Support

| Editor | MCP | Skills | Hooks (auto-augment) | Support |
|--------|-----|--------|---------------------|---------|
| **Claude Code** | Yes | Yes | Yes (PreToolUse) | **Full** |
| **Cursor** | Yes | Yes | — | MCP + Skills |
| **Windsurf** | Yes | — | — | MCP |
| **OpenCode** | Yes | Yes | — | MCP + Skills |

> **Claude Code** gets the deepest integration: MCP tools + agent skills + PreToolUse hooks that automatically enrich grep/glob/bash calls with knowledge graph context.

### Community Integrations

| Agent | Install | Source |
|-------|---------|--------|
| [pi](https://pi.dev) | `pi install npm:pi-gitnexus` | [pi-gitnexus](https://github.com/tintinweb/pi-gitnexus) |

## MCP Setup (manual)

If you prefer to configure manually instead of using `gitnexus setup`:

### Claude Code (full support — MCP + skills + hooks)

```bash
claude mcp add gitnexus -- npx -y gitnexus@latest mcp
```

### Cursor / Windsurf

Add to `~/.cursor/mcp.json` (global — works for all projects):

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

### OpenCode

Add to `~/.config/opencode/config.json`:

```json
{
  "mcp": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

## How It Works

GitNexus builds a complete knowledge graph of your codebase through a multi-phase indexing pipeline:

1. **Structure** — Walks the file tree and maps folder/file relationships
2. **Parsing** — Extracts functions, classes, methods, and interfaces using Tree-sitter ASTs
3. **Resolution** — Resolves imports and function calls across files with language-aware logic
4. **Clustering** — Groups related symbols into functional communities
5. **Processes** — Traces execution flows from entry points through call chains
6. **Search** — Builds hybrid search indexes for fast retrieval

The result is a **KuzuDB graph database** stored locally in `.gitnexus/` with full-text search and semantic embeddings.

## MCP Tools

Your AI agent gets these tools automatically:

| Tool | What It Does | `repo` Param |
|------|-------------|--------------|
| `list_repos` | Discover all indexed repositories | — |
| `query` | Process-grouped hybrid search (BM25 + semantic + RRF) | Optional |
| `context` | 360-degree symbol view — categorized refs, process participation | Optional |
| `impact` | Blast radius analysis with depth grouping and confidence | Optional |
| `detect_changes` | Git-diff impact — maps changed lines to affected processes | Optional |
| `rename` | Multi-file coordinated rename with graph + text search | Optional |
| `cypher` | Raw Cypher graph queries | Optional |

> With one indexed repo, the `repo` param is optional. With multiple, specify which: `query({query: "auth", repo: "my-app"})`.

## MCP Resources

| Resource | Purpose |
|----------|---------|
| `gitnexus://repos` | List all indexed repositories (read first) |
| `gitnexus://repo/{name}/context` | Codebase stats, staleness check, and available tools |
| `gitnexus://repo/{name}/clusters` | All functional clusters with cohesion scores |
| `gitnexus://repo/{name}/cluster/{name}` | Cluster members and details |
| `gitnexus://repo/{name}/processes` | All execution flows |
| `gitnexus://repo/{name}/process/{name}` | Full process trace with steps |
| `gitnexus://repo/{name}/schema` | Graph schema for Cypher queries |

## MCP Prompts

| Prompt | What It Does |
|--------|-------------|
| `detect_impact` | Pre-commit change analysis — scope, affected processes, risk level |
| `generate_map` | Architecture documentation from the knowledge graph with mermaid diagrams |

## CLI Commands

```bash
gitnexus setup                    # Configure MCP for your editors (one-time)
gitnexus doctor --host codex      # Verify host MCP readiness and repo/index state
gitnexus analyze [path]           # Index a repository (default: also register + gitignore + context refresh)
gitnexus analyze --force          # Force full re-index
gitnexus analyze --skills         # Generate repo-specific skill files from detected communities
gitnexus analyze --no-context     # Index only, skip AGENTS.md / CLAUDE.md refresh
gitnexus analyze --no-gitignore   # Index only, skip .gitignore update
gitnexus analyze --no-register    # Index only, skip global registry update
gitnexus analyze --embeddings     # Enable embedding generation for semantic search
gitnexus analyze --verbose        # Log skipped files when parsers are unavailable
gitnexus config embeddings show   # Show stored/effective embeddings config
gitnexus config embeddings set    # Persist embeddings config to ~/.gitnexus/config.json
gitnexus config embeddings clear  # Remove only embeddings settings from ~/.gitnexus/config.json
gitnexus init-project [path]      # Initialize .gitignore, AGENTS.md / CLAUDE.md, and repo skills
gitnexus refresh-context [path]   # Regenerate AGENTS.md / CLAUDE.md and repo skills only
gitnexus mcp                     # Start MCP server (stdio) — serves all indexed repos
gitnexus serve                   # Start local HTTP server (multi-repo) for web UI
gitnexus list                    # List all indexed repositories
gitnexus status                  # Show index status for current repo
gitnexus clean                   # Delete index for current repo
gitnexus clean --all --force     # Delete all indexes
gitnexus wiki [path]             # Generate LLM-powered docs from knowledge graph
gitnexus wiki --model <model>    # Wiki with custom LLM model (default: gpt-4o-mini)
```

### Embeddings Configuration

Use plain `gitnexus analyze` when you want the fastest refresh and exact symbol, file, or keyword search is enough.

Graph tools, BM25/FTS search, impact analysis, and context lookups still work without embeddings.

Use `gitnexus analyze --embeddings` when natural-language, concept, or fuzzy code search matters.

This enables hybrid retrieval (`BM25 + semantic + RRF`) but takes longer and requires an embedding provider such as Ollama or Hugging Face.

For normal refreshes, prefer `gitnexus analyze --embeddings` without `--force` so GitNexus can reuse existing embeddings.

For a local Ollama GPU setup, start with `batchSize=64`; if you want a more conservative baseline, try `32`.

You can configure embeddings once in `~/.gitnexus/config.json` instead of exporting shell variables every time:

```json
{
  "embeddings": {
    "provider": "ollama",
    "ollamaBaseUrl": "http://localhost:11434",
    "ollamaModel": "qwen3-embedding:0.6b",
    "nodeLimit": 90000,
    "batchSize": 64
  }
}
```

Use the CLI helpers to inspect or update it:

```bash
gitnexus config embeddings show
gitnexus config embeddings set --provider ollama --ollama-base-url http://localhost:11434 --ollama-model qwen3-embedding:0.6b --node-limit 90000 --batch-size 64
gitnexus config embeddings clear
```

Environment variables still take precedence over `~/.gitnexus/config.json`.

## Multi-Repo Support

GitNexus supports indexing multiple repositories. Each `gitnexus analyze` registers the repo in a global registry (`~/.gitnexus/registry.json`). The MCP server serves all indexed repos automatically.

`gitnexus setup` and the host adapters own global editor/MCP configuration. `gitnexus doctor` is the matching diagnostics layer for that global setup. `gitnexus init-project` and `gitnexus refresh-context` only touch project-local files inside the target repository.

## Supported Languages

TypeScript, JavaScript, Python, Java, C, C++, C#, Go, Rust, PHP, Kotlin, Swift

### Language Feature Matrix

| Language | Imports | Types | Exports | Named Bindings | Config | Frameworks | Entry Points | Heritage |
|----------|---------|-------|---------|----------------|--------|------------|-------------|----------|
| TypeScript | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| JavaScript | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Python | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| C# | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Java | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Kotlin | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Go | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| Rust | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| PHP | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Swift | — | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| C | — | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| C++ | — | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |

**Imports** — cross-file import resolution · **Types** — type annotation extraction · **Exports** — public/exported symbol detection · **Named Bindings** — `import { X }` tracking · **Config** — language toolchain config parsing (tsconfig, go.mod, etc.) · **Frameworks** — AST-based framework pattern detection · **Entry Points** — entry point scoring heuristics · **Heritage** — class inheritance / interface implementation

## Agent Skills

GitNexus ships with skill files that teach AI agents how to use the tools effectively:

- **Exploring** — Navigate unfamiliar code using the knowledge graph
- **Debugging** — Trace bugs through call chains
- **Impact Analysis** — Analyze blast radius before changes
- **Refactoring** — Plan safe refactors using dependency mapping

Installed automatically by `gitnexus analyze`, `gitnexus init-project`, and `gitnexus refresh-context` for repo-local usage, plus `gitnexus setup` for supported global integrations.

When you run `gitnexus analyze --skills`, GitNexus also generates repo-specific `SKILL.md` files under `.claude/skills/generated/`, derived from detected functional communities. These skills give agents focused context for the module they are currently modifying.

## Requirements

- Node.js >= 18
- Git repository (uses git for commit tracking)

## Privacy

- All processing happens locally on your machine
- No code is sent to any server
- Index stored in `.gitnexus/` inside your repo (gitignored)
- Global registry at `~/.gitnexus/` stores only paths and metadata

## Web UI

GitNexus also has a browser-based UI at [gitnexus.vercel.app](https://gitnexus.vercel.app) — 100% client-side, your code never leaves the browser.

**Local Backend Mode:** Run `gitnexus serve` and open the web UI locally — it auto-detects the server and shows all your indexed repos, with full AI chat support. No need to re-upload or re-index. The agent's tools (Cypher queries, search, code navigation) route through the backend HTTP API automatically.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

Free for non-commercial use. Contact for commercial licensing.
