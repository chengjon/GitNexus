## Design

This slice is intentionally narrow, but no longer strictly consumer-side only.

The upstream CI contract already exists:

- the `language-support` job runs
- its result is written into `pr-meta/language_support_result`
- the required CI gate already depends on that result

Therefore the smallest correct fix is to update the PR report consumer to read
and render that existing field, rather than introducing a new artifact or
changing `doctor` output.

While implementing that, this slice also renames the shell-step status variable
from `LANG` to `LANG_SUPPORT` in the affected CI/report workflows. The persisted
artifact field stays `language_support_result`; only the shell variable name is
normalized to avoid colliding with the conventional locale variable `LANG`.

The regression test should remain text-oriented and read the workflow file
directly. That matches existing repository governance integration tests and
keeps this slice lightweight.
