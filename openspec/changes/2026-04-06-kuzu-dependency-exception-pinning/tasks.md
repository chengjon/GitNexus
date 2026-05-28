## 1. Change Record

- [x] 1.1 Add a dedicated exact-pinning OpenSpec change for the current `kuzu` exception line
- [x] 1.2 Bound the slice to direct dependency declarations and root lockfile metadata

## 2. Apply Pinning

- [x] 2.1 Pin CLI `kuzu` to an exact direct dependency version
- [x] 2.2 Pin web `kuzu-wasm` to an exact direct dependency version
- [x] 2.3 Sync root lockfile package dependency declarations
- [x] 2.4 Update the dependency review audit to record exact pinning as the active mitigation

## 3. Validation

- [x] 3.1 Validate the new OpenSpec change
- [x] 3.2 Re-run scoped grep and status for the pinned dependency declarations
