## Design

This slice is review-only. It does not change dependency versions, install
graphs, or lockfiles.

### 1. Keep direct debt and review scope separate

The repo-hygiene audit already records the deprecated direct dependencies and
the current transitive chain. This change turns that debt into an explicit next
step rather than changing the packages immediately.

### 2. Split CLI and web evaluation tracks

The CLI depends on native `kuzu`, while the web app depends on `kuzu-wasm`.
Those tracks may have different feasible outcomes, so the review must not force
one package decision onto both surfaces.

### 3. Bound the allowed decision outcomes

The dependency review must end in one of three explicit outcomes for each track:

- upgrade to a supported version
- replace with a different supported implementation
- keep the current version pinned as a documented exception with rationale

### 4. Preserve current exception wording until the review lands

Until a dedicated dependency decision is made, unrelated changes should not
expand new product surface around the current deprecated line.
