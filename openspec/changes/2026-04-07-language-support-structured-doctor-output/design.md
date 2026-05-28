## Design

This slice keeps the previous `language-support` convergence work intact while
fixing the remaining transport fragility.

- `DoctorCheck` grows an optional `data` field
- `runDoctor()` populates `data` for `language-support`
- the compiled reporter reads `data` first
- if `data` is absent, the reporter still parses the legacy `detail` string

The result is an additive JSON contract: better machine readability now, no
hard break for older payloads or scripts.
