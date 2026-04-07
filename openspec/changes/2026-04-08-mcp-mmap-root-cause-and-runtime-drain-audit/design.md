## Design

This slice updates only governance and audit documents.

- keep the mmap failure audit as the canonical repair record for this incident
- keep measured evidence, inferred root cause, and historical baseline
  separated so later readers do not mix fact classes
- point roadmap readers to the dedicated audit and its OpenSpec change instead
  of forcing them to reconstruct the root cause from chat history or git log
