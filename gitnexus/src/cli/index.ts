#!/usr/bin/env node

// Heap re-spawn removed — only analyze.ts needs the 8GB heap (via its own ensureHeap()).
// Removing it from here improves MCP server startup time significantly.

import { Command } from 'commander';
import { createLazyAction } from './lazy-action.js';
import { getGitNexusVersion } from './index-freshness.js';

const program = new Command();

program
  .name('gitnexus')
  .description('GitNexus local CLI and MCP server')
  .version(getGitNexusVersion());

program
  .command('setup')
  .description('One-time setup: configure MCP for Cursor, Claude Code, OpenCode')
  .action(createLazyAction(() => import('./setup.js'), 'setupCommand'));

program
  .command('doctor [path]')
  .description('Diagnose index, registry, and host MCP readiness')
  .option('--host <name>', 'Check a specific host configuration')
  .option('--repo <path>', 'Check a specific repository path')
  .option('--gpu', 'Also run GPU readiness checks for Ollama / NVIDIA setups')
  .option('--fix', 'Attempt safe GPU-related fixes and print remaining manual steps')
  .option('--json', 'Print structured JSON output')
  .action(createLazyAction(() => import('./doctor.js'), 'doctorCommand'));

program
  .command('analyze [path]')
  .description('Index a repository (default: no repo-context refresh)')
  .option('-f, --force', 'Force full re-index even if up to date')
  .option('--embeddings', 'Enable embedding generation for semantic search (off by default)')
  .option('--skills', 'Generate repo-specific skill files from detected communities')
  .option('-v, --verbose', 'Enable verbose ingestion warnings (default: false)')
  .option('--with-context', 'Also refresh AGENTS.md / CLAUDE.md context files after indexing')
  .option('--no-context', 'Legacy compatibility flag; context refresh is already disabled by default')
  .option('--with-gitignore', 'Also ensure .gitnexus is listed in .gitignore')
  .option('--no-gitignore', 'Skip ensuring .gitnexus is listed in .gitignore')
  .option('--no-register', 'Skip updating the global indexed repository registry')
  .action(createLazyAction(() => import('./analyze.js'), 'analyzeCommand'));

program
  .command('init-project [path]')
  .description('Initialize .gitignore and AI context files for a repository')
  .action(createLazyAction(() => import('./init-project.js'), 'initProjectCommand'));

program
  .command('refresh-context [path]')
  .description('Refresh AGENTS.md / CLAUDE.md context files and repo skills')
  .action(createLazyAction(() => import('./refresh-context.js'), 'refreshContextCommand'));

const configProgram = program
  .command('config')
  .description('View or update global GitNexus config');

const embeddingsConfigProgram = configProgram
  .command('embeddings')
  .description('Manage embeddings configuration');

embeddingsConfigProgram
  .command('show')
  .description('Show stored and effective embeddings configuration')
  .option('--json', 'Print structured JSON output')
  .action(createLazyAction(() => import('./config.js'), 'embeddingsConfigShowCommand'));

embeddingsConfigProgram
  .command('set')
  .description('Persist embeddings configuration to ~/.gitnexus/config.json')
  .option('--provider <provider>', 'Embedding provider: huggingface or ollama')
  .option('--ollama-base-url <url>', 'Ollama base URL')
  .option('--ollama-model <model>', 'Ollama embedding model name')
  .option('--node-limit <n>', 'Maximum embeddable node count before skipping embeddings')
  .option('--batch-size <n>', 'Embedding batch size')
  .option('--hf-remote-host <url>', 'Custom Hugging Face remote host / mirror')
  .option('--hf-cache-dir <path>', 'Directory to cache Hugging Face model files')
  .option('--hf-local-model-path <path>', 'Path to predownloaded local Hugging Face model files')
  .option('--local-only <true|false>', 'Use only local Hugging Face model files')
  .action(createLazyAction(() => import('./config.js'), 'embeddingsConfigSetCommand'));

embeddingsConfigProgram
  .command('clear')
  .description('Remove only embeddings settings from ~/.gitnexus/config.json')
  .action(createLazyAction(() => import('./config.js'), 'embeddingsConfigClearCommand'));

program
  .command('serve')
  .description('Start local HTTP server for web UI connection')
  .option('-p, --port <port>', 'Port number', '4747')
  .option('--host <host>', 'Bind address (default: 127.0.0.1, use 0.0.0.0 for remote access)')
  .action(createLazyAction(() => import('./serve.js'), 'serveCommand'));

program
  .command('mcp')
  .description('Start MCP server (stdio) — serves all indexed repos')
  .action(createLazyAction(() => import('./mcp.js'), 'mcpCommand'));

program
  .command('list')
  .description('List all indexed repositories')
  .action(createLazyAction(() => import('./list.js'), 'listCommand'));

program
  .command('status')
  .description('Show index status for current repo')
  .action(createLazyAction(() => import('./status.js'), 'statusCommand'));

program
  .command('clean')
  .description('Delete GitNexus index for current repo')
  .option('-f, --force', 'Skip confirmation prompt')
  .option('--all', 'Clean all indexed repos')
  .action(createLazyAction(() => import('./clean.js'), 'cleanCommand'));

program
  .command('wiki [path]')
  .description('Generate repository wiki from knowledge graph')
  .option('-f, --force', 'Force full regeneration even if up to date')
  .option('--model <model>', 'LLM model name (default: minimax/minimax-m2.5)')
  .option('--base-url <url>', 'LLM API base URL (default: OpenAI)')
  .option('--api-key <key>', 'LLM API key (saved to ~/.gitnexus/config.json)')
  .option('--concurrency <n>', 'Parallel LLM calls (default: 3)', '3')
  .option('--gist', 'Publish wiki as a public GitHub Gist after generation')
  .action(createLazyAction(() => import('./wiki.js'), 'wikiCommand'));

program
  .command('augment <pattern>')
  .description('Augment a search pattern with knowledge graph context (used by hooks)')
  .action(createLazyAction(() => import('./augment.js'), 'augmentCommand'));

// ─── Direct Tool Commands (no MCP overhead) ────────────────────────
// These invoke LocalBackend directly for use in eval, scripts, and CI.

program
  .command('query <search_query>')
  .description('Search the knowledge graph for execution flows related to a concept')
  .option('-r, --repo <name>', 'Target repository (omit if only one indexed)')
  .option('-c, --context <text>', 'Task context to improve ranking')
  .option('-g, --goal <text>', 'What you want to find')
  .option('-l, --limit <n>', 'Max processes to return (default: 5)')
  .option('--content', 'Include full symbol source code')
  .action(createLazyAction(() => import('./tool.js'), 'queryCommand'));

program
  .command('context [name]')
  .description('360-degree view of a code symbol: callers, callees, processes')
  .option('-r, --repo <name>', 'Target repository')
  .option('-u, --uid <uid>', 'Direct symbol UID (zero-ambiguity lookup)')
  .option('-f, --file <path>', 'File path to disambiguate common names')
  .option('--content', 'Include full symbol source code')
  .action(createLazyAction(() => import('./tool.js'), 'contextCommand'));

program
  .command('impact <target>')
  .description('Blast radius analysis: what breaks if you change a symbol')
  .option('-d, --direction <dir>', 'upstream (dependants) or downstream (dependencies)', 'upstream')
  .option('-r, --repo <name>', 'Target repository')
  .option('--depth <n>', 'Max relationship depth (default: 3)')
  .option('--include-tests', 'Include test files in results')
  .action(createLazyAction(() => import('./tool.js'), 'impactCommand'));

program
  .command('cypher <query>')
  .description('Execute raw Cypher query against the knowledge graph')
  .option('-r, --repo <name>', 'Target repository')
  .action(createLazyAction(() => import('./tool.js'), 'cypherCommand'));

// ─── Eval Server (persistent daemon for SWE-bench) ─────────────────

program
  .command('eval-server')
  .description('Start lightweight HTTP server for fast tool calls during evaluation')
  .option('-p, --port <port>', 'Port number', '4848')
  .option('--idle-timeout <seconds>', 'Auto-shutdown after N seconds idle (0 = disabled)', '0')
  .action(createLazyAction(() => import('./eval-server.js'), 'evalServerCommand'));

program.parse(process.argv);
