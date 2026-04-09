## Design

This slice reuses the existing producer path:

- `doctor --json`
- `language-support-report.mjs`

Instead of recomputing the summary in the PR report workflow, `ci.yml` writes
the already formatted markdown to `language-support-summary.md` and uploads it
alongside `doctor-output.json` as a dedicated artifact.

`ci-report.yml` then downloads that artifact and renders the markdown inside a
collapsed section. This keeps formatting ownership in one place and limits the
report workflow to transport plus presentation.
