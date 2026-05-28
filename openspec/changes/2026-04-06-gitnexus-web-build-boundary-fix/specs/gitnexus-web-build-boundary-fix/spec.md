# gitnexus-web-build-boundary-fix Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep gitnexus-web production builds inside repository-local config boundaries

GitNexus SHALL keep `gitnexus-web` production build verification inside
repository-local config boundaries instead of relying on ancestor package
metadata outside the repository being readable.

#### Scenario: A host environment has unreadable parent package metadata

- **WHEN** `gitnexus-web` production build verification runs in a host where
  ancestor package metadata outside the repository is unreadable
- **THEN** the build still succeeds using repository-local config boundaries
- **AND** the build does not require Vite/PostCSS to walk outside the repo

### Requirement: GitNexus SHALL preserve frontend verification after build-boundary mitigation

GitNexus SHALL preserve the existing frontend verification expectations after
the build-boundary mitigation lands.

#### Scenario: Maintainers validate the boundary fix

- **WHEN** the build-boundary mitigation is applied
- **THEN** `npx tsc -b --noEmit` passes
- **AND** `npm run build` passes
- **AND** the targeted log-hygiene check still passes
