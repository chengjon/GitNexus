# gitnexus-web-langchain-core-chunk-decomposition Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep LangChain worker chunk convergence on a stable, auditable boundary

GitNexus SHALL keep `gitnexus-web` worker LangChain dependencies on the last
known stable chunk boundary until a finer decomposition is proven to avoid
circular chunk warnings.

#### Scenario: A maintainer reviews stable worker manual chunk routing

- **WHEN** `createWorkerManualChunks()` is inspected
- **THEN** representative `@langchain/core/dist/utils/*`, `messages/*`,
  `runnables/*`, `prompts/*`, and `output_parsers/*` paths route to
  `worker-langchain-core`
- **AND** `langsmith/` routes to `worker-langchain-core`

### Requirement: GitNexus SHALL keep LangChain core chunk decomposition auditable

GitNexus SHALL keep LangChain core chunk decomposition auditable so future
cleanup work can distinguish already-proven subtree splits from any remaining
large LangChain worker chunks.

#### Scenario: A maintainer validates the LangChain core decomposition slice

- **WHEN** the LangChain core decomposition slice is validated
- **THEN** a regression test asserts the representative subtree chunk routing
- **AND** `npm run build` passes
- **AND** the audit trail records which attempted subtree splits introduced
  circular chunk warnings and were rejected
