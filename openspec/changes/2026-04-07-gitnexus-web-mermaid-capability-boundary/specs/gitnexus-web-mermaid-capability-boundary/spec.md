# gitnexus-web-mermaid-capability-boundary Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep Mermaid bundle convergence tied to an explicit supported capability boundary

GitNexus SHALL keep `gitnexus-web` Mermaid rendering tied to an explicit,
documented supported diagram capability boundary instead of relying on repeated
entry-file or bundle-variant experiments.

#### Scenario: A maintainer reviews Mermaid rendering support

- **WHEN** the Mermaid rendering slice is inspected
- **THEN** the supported Mermaid diagram capability boundary is documented
- **AND** the implementation reflects that documented boundary

### Requirement: GitNexus SHALL keep Mermaid warning follow-ups auditable

GitNexus SHALL keep Mermaid warning follow-ups auditable so future work can
distinguish rejected bundling experiments from the next product-level
capability-boundary change.

#### Scenario: A maintainer validates the Mermaid capability-boundary slice

- **WHEN** the Mermaid capability-boundary slice is validated
- **THEN** the audit trail records the rejected entry-file experiments
- **AND** `npm run build` passes
- **AND** the resulting Mermaid warning effect is recorded
