# grammar-warning-dedup Specification Delta

## ADDED Requirements

### Requirement: Optional grammar warnings SHALL print at most once per session

`warnMissingOptionalGrammars` SHALL deduplicate warnings within a single CLI
invocation using a module-level Set. The same grammar warning SHALL NOT appear
more than once in stdout/stderr.

#### Scenario: analyze calls warnMissingOptionalGrammars twice for the same grammar

- **WHEN** `warnMissingOptionalGrammars` is called twice in the same process
- **AND** both calls find Kotlin grammar missing
- **THEN** the Kotlin warning appears exactly once in output
