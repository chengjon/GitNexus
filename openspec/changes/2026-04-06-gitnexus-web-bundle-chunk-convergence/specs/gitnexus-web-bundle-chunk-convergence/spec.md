# gitnexus-web-bundle-chunk-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep heavyweight markdown and Mermaid dependencies out of the gitnexus-web browser entry by default

GitNexus SHALL keep heavyweight markdown highlighting and Mermaid rendering
dependencies out of the `gitnexus-web` browser entry bundle by default, using
explicit chunk boundaries and runtime loading where appropriate.

#### Scenario: A maintainer builds gitnexus-web for production

- **WHEN** `gitnexus-web` production build runs
- **THEN** markdown rendering and syntax highlighting resolve through a dedicated
  light-highlighter boundary instead of a full Prism language bundle
- **AND** Mermaid is loaded through an async runtime loader instead of a module-top
  static browser-entry import

### Requirement: GitNexus SHALL keep optional worker subsystems out of the ingestion.worker entry chunk

GitNexus SHALL keep optional worker subsystems out of the `ingestion.worker`
entry chunk by splitting heavyweight LLM, embedding, parser, graph, and zip
dependencies into dedicated worker chunks.

#### Scenario: Production build emits worker assets

- **WHEN** `gitnexus-web` production build completes
- **THEN** the emitted worker assets include dedicated chunks for worker-side
  LLM, embedding, parser, graph, and zip subsystems
- **AND** the `ingestion.worker` entry bundle is smaller than those optional
  heavyweight worker chunks

### Requirement: GitNexus SHALL keep bundle-chunk convergence auditable

GitNexus SHALL keep bundle-chunk convergence work auditable so future cleanup
slices can distinguish already-fixed entry bloat from remaining large lazy or
optional chunks.

#### Scenario: A maintainer reviews the convergence slice

- **WHEN** the bundle-chunk convergence slice is validated
- **THEN** `npm run build` passes
- **AND** the audit trail records before/after artifact sizes
- **AND** the audit trail explicitly identifies any remaining warning-sized chunks
  as follow-up work rather than silently treating them as fixed
