# embeddings-config-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured embeddings config data in doctor JSON

GitNexus SHALL expose machine-readable embeddings configuration data alongside
the existing human-readable `embeddings-config` detail string.

#### Scenario: A caller requests doctor JSON with Ollama embeddings configured

- **WHEN** `runDoctor()` emits the `embeddings-config` check
- **THEN** the check includes structured `data` with effective config, sources,
  precedence, and probe information
- **AND** it still includes the existing detail summary
