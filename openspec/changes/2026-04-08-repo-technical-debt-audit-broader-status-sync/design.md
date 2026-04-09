## Design

This slice updates only governance and historical audit documents.

- preserve the original 2026-04-06 audit findings as historical evidence
- add bounded follow-up entrypoints for Finding 2, the repair order, and output
  mapping
- point readers at the remediation roadmap and later truth-sync records before
  they treat the original stale-doc repair order as untouched current backlog
- avoid reopening any underlying implementation work
