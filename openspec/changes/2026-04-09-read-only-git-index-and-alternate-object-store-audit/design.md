## Design

This slice updates only governance records.

- keep the 2026-04-09 `.git` read-only audit as the canonical record for the
  current filesystem boundary
- keep the repaired mmap incident and the newer read-only `.git` boundary
  explicitly separated so maintainers do not collapse them into one failure
- record the alternate index/object-store flow as a temporary validation method,
  not as a new canonical development architecture
