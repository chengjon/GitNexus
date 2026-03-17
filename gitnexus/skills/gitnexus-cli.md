---
name: gitnexus-cli
description: "Use when the user needs to run GitNexus CLI commands like analyze/index a repo, check status, clean the index, generate a wiki, or list indexed repos. Examples: \"Index this repo\", \"Reanalyze the codebase\", \"Generate a wiki\""
---

# GitNexus CLI Commands

All commands work via `npx` — no global install required.

## Commands

### analyze — Build or refresh the index

```bash
npx gitnexus analyze
```

Run from the project root. This parses all source files, builds the knowledge graph, writes it to `.gitnexus/`, and generates CLAUDE.md / AGENTS.md context files.

| Flag           | Effect                                                           |
| -------------- | ---------------------------------------------------------------- |
| `--force`      | Force full re-index even if up to date                           |
| `--embeddings` | Enable embedding generation for semantic search (off by default) |

**When to run:** First time in a project, after major code changes, or when `gitnexus://repo/{name}/context` reports the index is stale. In Claude Code, a PostToolUse hook runs `analyze` automatically after `git commit` and `git merge`, preserving embeddings if previously generated.

**Embeddings configuration:**

```bash
# Raise the safety limit / reduce batch size for large repos
GITNEXUS_EMBEDDING_NODE_LIMIT=90000
GITNEXUS_EMBEDDING_BATCH_SIZE=8

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
GITNEXUS_EMBEDDING_BATCH_SIZE=8 \
gitnexus analyze --force --embeddings
```

The same settings can live in `~/.gitnexus/config.json`:

```json
{
  "embeddings": {
    "provider": "ollama",
    "ollamaBaseUrl": "http://localhost:11434",
    "ollamaModel": "qwen3-embedding:0.6b",
    "nodeLimit": 90000,
    "batchSize": 8
  }
}
```

Priority is: environment variables > `~/.gitnexus/config.json` > built-in defaults.

You can inspect or update this without editing JSON manually:

```bash
gitnexus config embeddings show
gitnexus config embeddings set --provider ollama --ollama-base-url http://localhost:11434 --ollama-model qwen3-embedding:0.6b --node-limit 90000 --batch-size 8
gitnexus config embeddings clear
```

### status — Check index freshness

```bash
npx gitnexus status
```

Shows whether the current repo has a GitNexus index, when it was last updated, and symbol/relationship counts. Use this to check if re-indexing is needed.

### clean — Delete the index

```bash
npx gitnexus clean
```

Deletes the `.gitnexus/` directory and unregisters the repo from the global registry. Use before re-indexing if the index is corrupt or after removing GitNexus from a project.

| Flag      | Effect                                            |
| --------- | ------------------------------------------------- |
| `--force` | Skip confirmation prompt                          |
| `--all`   | Clean all indexed repos, not just the current one |

### wiki — Generate documentation from the graph

```bash
npx gitnexus wiki
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
npx gitnexus list
```

Lists all repositories registered in `~/.gitnexus/registry.json`. The MCP `list_repos` tool provides the same information.

## After Indexing

1. **Read `gitnexus://repo/{name}/context`** to verify the index loaded
2. Use the other GitNexus skills (`exploring`, `debugging`, `impact-analysis`, `refactoring`) for your task

## Troubleshooting

- **"Not inside a git repository"**: Run from a directory inside a git repo
- **Index is stale after re-analyzing**: Restart Claude Code to reload the MCP server
- **Embeddings timeout on Hugging Face**: Set `HF_ENDPOINT` / `GITNEXUS_HF_REMOTE_HOST`, configure `GITNEXUS_HF_CACHE_DIR`, or switch to the local Ollama provider via `GITNEXUS_EMBEDDING_PROVIDER=ollama`
