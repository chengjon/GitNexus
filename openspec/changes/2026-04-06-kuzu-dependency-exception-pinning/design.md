## Design

This slice applies only the current mitigation, not the final dependency
strategy.

### 1. Pin only the direct exception line

The repository already resolves to:

- `kuzu@0.11.3`
- `kuzu-wasm@0.11.3`

This change only makes those direct declarations exact.

### 2. Avoid full lockfile regeneration

The lockfiles already resolve to the pinned versions. To keep the slice small
and reduce unrelated churn, update only the root package dependency declarations
inside the lockfiles rather than re-running install.

### 3. Preserve the separate replacement review

Exact pinning is not a claim that these dependencies are healthy. It is only the
current containment mechanism while the dedicated review stays open.
