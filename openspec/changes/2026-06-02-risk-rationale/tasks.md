## 1. Design

- [x] 1.1 Define signal-based rationale vocabulary
- [x] 1.2 Design rationale generation logic per risk level

## 2. Implementation

- [x] 2.1 Implement `risk-rationale.ts` with `generateRiskRationale()`
- [x] 2.2 Add `risk_rationale` field to `detect_changes` output
- [x] 2.3 Add `risk_rationale` field to `impact` output (`_runImpactBFS`)
- [x] 2.4 Ensure rationale is populated for all risk levels

## 3. Testing

- [x] 3.1 Test: LOW risk returns rationale explaining why
- [x] 3.2 Test: HIGH risk returns rationale identifying breached signals
- [x] 3.3 Test: empty signals returns appropriate rationale
- [x] 3.4 Test: rationale strings are machine-readable
- [x] 3.5 Test: risk_rationale appears in detect_changes MCP response (p0-p1-p2-mcp-response.test.ts)
- [x] 3.6 Test: risk_rationale appears in impact MCP response (p0-p1-p2-mcp-response.test.ts)
