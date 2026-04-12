## Design

This slice records one operator-facing cleanup command and its verified
boundaries.

- reuse the existing `cancel` command surface instead of inventing a parallel
  cleanup command
- bind the stale cleanup scope to the current session by default
- terminalize Ralph state instead of deleting the evidence file
- treat skill-active cleanup as part of the same stale Ralph shutdown
- keep the repository record explicit that the current implementation lives in
  the installed OMX package and still needs upstream replay into the canonical
  source repository
