# risk-rationale Specification Delta

## ADDED Requirements

### Requirement: detect_changes and impact SHALL include risk_rationale

Both `detect_changes` and `impact` MCP responses SHALL include a `risk_rationale`
array of machine-readable strings explaining why a risk level was assigned.

#### Scenario: detect_changes returns HIGH risk with rationale for affected processes

- **WHEN** changes affect 12 processes (threshold HIGH = 5)
- **THEN** `risk_rationale` includes `"affected_processes exceeds threshold (12 > 5)"`
- **AND** `risk_level` is `"HIGH"`

#### Scenario: impact returns LOW risk with positive rationale

- **WHEN** impact analysis finds 1 direct caller and 0 affected processes
- **THEN** `risk_rationale` includes `"all signals within acceptable range"`
- **AND** `risk_level` is `"LOW"`
