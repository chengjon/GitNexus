## Why

`detect_changes` returns `risk_level: low` but does not explain why. Agents
must manually construct the rationale for each report. A machine-readable
rationale would reduce repeated explanation and improve trust.

Source: `/opt/claude/mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md`

## What Changes

- Add `risk_rationale` array to `detect_changes` and `impact` output
- Rationale items are short, machine-readable strings explaining the risk level
- Include factors like: file categories, process participation, upstream callers,
  graph coverage

## Capabilities

### Modified Capabilities

- `detect_changes`: Includes `risk_rationale` explaining why the risk level
  was assigned.
- `impact`: Includes `risk_rationale` for the impact assessment.

## Impact

- Affected modules:
  - `gitnexus/src/mcp/tools/detect-changes.ts`
  - `gitnexus/src/mcp/tools/impact.ts`
  - `gitnexus/src/core/risk-evaluator.ts` (new or modified)
- Risk: LOW — additive output field
