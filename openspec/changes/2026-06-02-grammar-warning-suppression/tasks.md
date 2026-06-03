## 1. Implementation

- [ ] 1.1 Add a session-level set of reported grammar warnings
- [ ] 1.2 Check if any files in the analysis set match the grammar's file type
      before emitting the warning
- [ ] 1.3 If no matching files exist, suppress the warning entirely
- [ ] 1.4 If matching files exist, show warning once per session/repo
- [ ] 1.5 Add `--verbose` flag that shows all grammar warnings regardless

## 2. Testing

- [ ] 2.1 Test: analyze with no `.proto` files — no proto grammar warning
- [ ] 2.2 Test: analyze with `.proto` files — warning shown once
- [ ] 2.3 Test: `--verbose` — all grammar warnings shown
- [ ] 2.4 Test: second analyze in same session — no repeat warning

## 3. Verification

- [ ] 3.1 Run `gitnexus analyze` on a repo with no `.proto` files
      and confirm clean output
