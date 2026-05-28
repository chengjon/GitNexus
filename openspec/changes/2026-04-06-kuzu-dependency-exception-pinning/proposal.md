## Why

The dedicated `kuzu` dependency review concluded that the current near-term
recommendation is a rationale-backed pin, not a blind upgrade.

At the moment, the repository still declares:

- `kuzu@^0.11.3`
- `kuzu-wasm@^0.11.1`

Those ranges allow future resolution drift across already deprecated package
lines. The smallest safe mitigation is to pin the current direct dependencies
exactly while the replacement review remains open.

## What Changes

- Change CLI `kuzu` from a range to an exact pinned version.
- Change web `kuzu-wasm` from a range to an exact pinned version.
- Sync only the root lockfile package metadata to match those direct dependency
  declarations.
- Update the dependency review audit so exact pinning is recorded as the active
  tracked-exception mitigation.

## Capabilities

### New Capabilities

- `kuzu-dependency-exception-pinning`: Keep the current deprecated direct
  dependency line exact and bounded while the broader replacement review stays
  open.

### Modified Capabilities

- None.

## Impact

- Affected manifests:
  - `gitnexus/package.json`
  - `gitnexus/package-lock.json`
  - `gitnexus-web/package.json`
  - `gitnexus-web/package-lock.json`
- Affected audit:
  - `docs/audits/2026-04-06-kuzu-dependency-review.md`
