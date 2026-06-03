## 1. Design

- [ ] 1.1 Define rationale vocabulary — standard phrases for common patterns:
      - `"no changed symbol participates in indexed processes"`
      - `"changed files are style/docs/governance only"`
      - `"no upstream callers detected for changed symbols"`
      - `"d=1 caller exists: <symbol>"` (for HIGH risk)
      - `"graph coverage incomplete for changed files"`
- [ ] 1.2 Design rationale generation logic per risk level

## 2. Implementation

- [ ] 2.1 Implement rationale generation in risk evaluator
- [ ] 2.2 Add `risk_rationale` field to `detect_changes` output:
      ```json
      {
        "risk_rationale": [
          "changed files are style/docs/governance only",
          "no changed symbol participates in indexed processes",
          "no upstream callers detected"
        ]
      }
      ```
- [ ] 2.3 Add `risk_rationale` field to `impact` output
- [ ] 2.4 Ensure rationale is populated for all risk levels (LOW, MEDIUM, HIGH)

## 3. Testing

- [ ] 3.1 Test: LOW risk returns rationale explaining why
- [ ] 3.2 Test: HIGH risk returns rationale identifying the d=1 callers
- [ ] 3.3 Test: empty change set returns appropriate rationale
- [ ] 3.4 Test: rationale strings are machine-readable (no free-form prose)

## 4. Verification

- [ ] 4.1 Run `detect_changes` and `impact` on various scenarios and verify
      rationale is accurate and useful
