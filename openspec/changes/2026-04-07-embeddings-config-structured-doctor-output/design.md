## Design

This slice extends the additive `DoctorCheck.data` pattern to
`embeddings-config`.

- `detail` stays as the operator-facing summary
- `data.effective` carries the resolved runtime config
- `data.sources` carries setting provenance
- `data.precedence` carries the priority rule
- `data.probe` carries the Ollama probe result or `null`

This is deliberately narrower than a full doctor-wide structuring effort.
