---
name: gitnexus-cli
description: "Use when the user needs to run GitNexus CLI commands like analyze/index a repo, check status, clean the index, generate a wiki, or list indexed repos. Examples: \"Index this repo\", \"Reanalyze the codebase\", \"Generate a wiki\""
---

<!-- gitnexus:keep -->

# GitNexus CLI Commands

Commands below use `node .gitnexus/run.cjs <command>` — the project-local runner `gitnexus analyze` drops next to the index. It auto-selects an available runner at call time (global `gitnexus`, else `pnpm dlx`, else `npx`), so no package-manager assumption and no global install is required.

> **Not analyzed yet, or `node .gitnexus/run.cjs` reports `Cannot find module`** (the gitignored runner is absent — e.g. a fresh clone or `git clean`)? (Re)generate it with `npx gitnexus analyze` from the project root. On **npm 11.x**, if `npx` crashes during install (`node.target is null`), install once with `npm i -g gitnexus` (then `gitnexus analyze`) or use `pnpm --allow-build=@ladybugdb/core --allow-build=gitnexus --allow-build=tree-sitter dlx gitnexus@latest analyze`. See [#1939](https://github.com/abhigyanpatwari/GitNexus/issues/1939).

## Commands

### analyze — Build or refresh the index

```bash
node .gitnexus/run.cjs analyze
```

Run from the project root. This parses all source files, builds the knowledge graph, writes it to `.gitnexus/`, and generates CLAUDE.md / AGENTS.md context files.

| Flag           | Effect                                                           |
| -------------- | ---------------------------------------------------------------- |
| `--force`      | Force full re-index even if up to date                           |
| `--embeddings` | Enable embedding generation for semantic search (off by default) |

**When to run:** First time in a project, after major code changes, or when `gitnexus://repo/{name}/context` reports the index is stale. In Claude Code, a PostToolUse hook runs `analyze` automatically after `git commit` and `git merge`, preserving embeddings if previously generated. In Codex, no equivalent automatic hook is installed today, so rerun `gitnexus analyze` manually after those mutations when you need a fresh index.

Use plain `npx gitnexus analyze` when you want the fastest refresh and exact symbol, file, or keyword search is enough.

Graph tools, BM25/FTS search, impact analysis, and context lookups still work without embeddings.

Use `npx gitnexus analyze --embeddings` when natural-language, concept, or fuzzy code search matters.

This enables hybrid retrieval (`BM25 + semantic + RRF`) but takes longer and requires an embedding provider such as Ollama or Hugging Face.

**Embeddings configuration:**

```bash
# Raise the safety limit for large repos.
# Start with 64 on a local Ollama GPU setup; use 32 as a conservative fallback.
GITNEXUS_EMBEDDING_NODE_LIMIT=90000
GITNEXUS_EMBEDDING_BATCH_SIZE=64

# Hugging Face mirror / cache / local-only mode
HF_ENDPOINT=https://hf-mirror.com
GITNEXUS_HF_REMOTE_HOST=https://hf-mirror.com
GITNEXUS_HF_CACHE_DIR=/path/to/hf-cache
GITNEXUS_HF_LOCAL_MODEL_PATH=/path/to/local-models
GITNEXUS_HF_LOCAL_ONLY=1

# Ollama provider
GITNEXUS_EMBEDDING_PROVIDER=ollama
GITNEXUS_OLLAMA_BASE_URL=http://localhost:11434
GITNEXUS_OLLAMA_MODEL=qwen3-embedding:0.6b
```

Recommended local Ollama example:

```bash
GITNEXUS_EMBEDDING_PROVIDER=ollama \
GITNEXUS_OLLAMA_BASE_URL=http://localhost:11434 \
GITNEXUS_OLLAMA_MODEL=qwen3-embedding:0.6b \
GITNEXUS_EMBEDDING_NODE_LIMIT=90000 \
GITNEXUS_EMBEDDING_BATCH_SIZE=64 \
gitnexus analyze --embeddings
```

Use `--force` only for intentional full rebuilds or corrupted indexes.

The same settings can live in `~/.gitnexus/config.json`:

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

Priority is: environment variables > `~/.gitnexus/config.json` > built-in defaults.

You can inspect or update this without editing JSON manually:

```bash
gitnexus config embeddings show
gitnexus config embeddings set --provider ollama --ollama-base-url http://localhost:11434 --ollama-model qwen3-embedding:0.6b --node-limit 90000 --batch-size 64
gitnexus config embeddings clear
```

### status — Check index freshness

```bash
node .gitnexus/run.cjs status
```

Shows whether the current repo has a GitNexus index, when it was last updated, and symbol/relationship counts. Use this to check if re-indexing is needed.

### clean — Delete the index

```bash
node .gitnexus/run.cjs clean
```

Deletes the `.gitnexus/` directory and unregisters the repo from the global registry. Use before re-indexing if the index is corrupt or after removing GitNexus from a project.

| Flag      | Effect                                            |
| --------- | ------------------------------------------------- |
| `--force` | Skip confirmation prompt                          |
| `--all`   | Clean all indexed repos, not just the current one |

### wiki — Generate documentation from the graph

```bash
node .gitnexus/run.cjs wiki
```

Generates repository documentation from the knowledge graph using an LLM. Requires an API key (saved to `~/.gitnexus/config.json` on first use).

| Flag                | Effect                                    |
| ------------------- | ----------------------------------------- |
| `--force`           | Force full regeneration                   |
| `--model <model>`   | LLM model (default: minimax/minimax-m2.5) |
| `--base-url <url>`  | LLM API base URL                          |
| `--api-key <key>`   | LLM API key                               |
| `--concurrency <n>` | Parallel LLM calls (default: 3)           |
| `--gist`            | Publish wiki as a public GitHub Gist      |

### list — Show all indexed repos

```bash
node .gitnexus/run.cjs list
```

Lists all repositories registered in `~/.gitnexus/registry.json`. The MCP `list_repos` tool provides the same information.

## After Indexing

1. **Read `gitnexus://repo/{name}/context`** to verify the index loaded
2. Use the other GitNexus skills (`exploring`, `debugging`, `impact-analysis`, `refactoring`) for your task

## Troubleshooting

- **"Not inside a git repository"**: Run from a directory inside a git repo
- **Index is stale after re-analyzing**: Restart the MCP host session so it reconnects to the updated index. In Claude Code, restart Claude Code. In Codex, restart the Codex session if the existing MCP connection still shows stale context.
- **Embeddings timeout on Hugging Face**: Set `HF_ENDPOINT` / `GITNEXUS_HF_REMOTE_HOST`, configure `GITNEXUS_HF_CACHE_DIR`, or switch to the local Ollama provider via `GITNEXUS_EMBEDDING_PROVIDER=ollama`
