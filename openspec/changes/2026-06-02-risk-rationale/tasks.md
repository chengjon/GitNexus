## 1. Design

- [x] 1.1 Define rationale vocabulary — signal-based rationale generation
      with named signals (name, value, threshold, breached)
- [x] 1.2 Design rationale generation logic per risk level

## 2. Implementation

- [x] 2.1 Implement `risk-rationale.ts` with `generateRiskRationale()`
- [x] 2.2 Add `risk_rationale` field to `detect_changes` output
- [x] 2.3 Add `risk_rationale` field to `impact` output (`_runImpactBFS`)
- [x] 2.4 Ensure rationale is populated for all risk levels (LOW, MEDIUM, HIGH, CRITICAL)

## 3. Testing

- [ ] 3.1 Test: LOW risk returns rationale explaining why
- [ ] 3.2 Test: HIGH risk returns rationale identifying breached signals
- [ ] 3.3 Test: empty change set returns appropriate rationale
- [ ] 3.4 Test: rationale strings are machine-readable (no free-form prose)

## 4. Verification

- [ ] 4.1 Run `detect_changes` and `impact` on various scenarios and verify
      rationale is accurate and useful
