## 1. Canonical Governance Doc

- [x] 1.1 Add `DEVELOPMENT_RULES.md` as the single repository governance source of truth
- [x] 1.2 Encode merge-blocking rules for duplicate layers, migration completion, deletion safety, metrics semantics, and temporary artifact hygiene

## 2. Durable Entry Points

- [x] 2.1 Add short governance pointers in top-level `AGENTS.md` and `CLAUDE.md`
- [x] 2.2 Add equivalent governance pointers in `gitnexus/AGENTS.md` and `gitnexus/CLAUDE.md`
- [x] 2.3 Add human-facing governance entrypoints in `README.md` and `.github/PULL_REQUEST_TEMPLATE.md`

## 3. Automated Enforcement

- [x] 3.1 Add one shared repository governance check script
- [x] 3.2 Add unit and integration coverage for path hygiene and PR body validation
- [x] 3.3 Wire the shared check into `gitnexus/package.json`
- [x] 3.4 Run the path hygiene check from `.github/workflows/ci-quality.yml`
- [x] 3.5 Add `.github/workflows/pr-governance.yml` for PR body validation

## 4. Validation

- [x] 4.1 Verify AI preambles remain outside the GitNexus generated marker block
- [x] 4.2 Run the targeted repository governance tests
- [x] 4.3 Run the repository governance path check
