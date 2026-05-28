# gitnexus-web-worker-runtime-lazy-loading Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep embedding runtime dependencies out of the ingestion.worker bootstrap path by default

GitNexus SHALL keep embedding runtime dependencies out of the
`gitnexus-web` `ingestion.worker` bootstrap path by default, so loading a
repository and using non-embedding worker features does not require the worker
to statically import embedding pipeline or embedder runtimes at module load time.

#### Scenario: A maintainer inspects the worker bootstrap boundary

- **WHEN** `gitnexus-web/src/workers/ingestion.worker.ts` is reviewed
- **THEN** embedding runtime modules resolve through async `import(...)`
  boundaries rather than runtime top-level imports
- **AND** the worker still exposes the same embedding-related API methods

### Requirement: GitNexus SHALL keep agent runtime dependencies out of the ingestion.worker bootstrap path by default

GitNexus SHALL keep optional Graph RAG agent, context-builder, and LangChain
message runtimes out of the `ingestion.worker` bootstrap path by default,
loading them only when agent chat or enrichment methods are invoked.

#### Scenario: A maintainer inspects the agent and enrichment paths

- **WHEN** `initializeAgent`, `initializeBackendAgent`, `chatStream`, or
  `enrichCommunities` are reviewed
- **THEN** those methods obtain their heavyweight agent runtime dependencies
  through cached async module loaders
- **AND** the worker API contract remains unchanged for callers

### Requirement: GitNexus SHALL keep worker runtime lazy-loading auditable

GitNexus SHALL keep worker runtime lazy-loading auditable so future cleanup
work can distinguish deliberate on-demand runtime boundaries from accidental
reintroduction of heavyweight static worker imports.

#### Scenario: A maintainer validates the lazy-loading slice

- **WHEN** the worker runtime lazy-loading slice is validated
- **THEN** a regression test asserts the worker keeps those heavyweight
  modules behind dynamic imports
- **AND** `npm run build` passes
- **AND** the audit trail records the runtime-boundary intent and verification
