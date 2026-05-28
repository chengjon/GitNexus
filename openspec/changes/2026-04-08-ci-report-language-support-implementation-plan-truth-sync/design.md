## Design

This slice updates only plan, audit, and roadmap documents.

- use the completed OpenSpec task ledger as the execution-truth source
- backfill the historical implementation plan so it no longer reports all
  steps as unchecked
- keep the repair bounded to plan-state drift rather than reopening workflow
  behavior changes
