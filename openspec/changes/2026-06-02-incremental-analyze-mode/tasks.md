## 1. Design

- [x] 1.1 Define the file discovery interface for scoped modes

## 2. Implementation

- [x] 2.1 Add `--staged-only` flag
- [x] 2.2 Add `--changed-only` flag
- [x] 2.3 Add `--files <path...>` flag
- [x] 2.4 Wire fileFilter through pipeline options to scan phase

## 3. CLI Integration

- [x] 3.1 Register new flags in CLI parser
- [x] 3.2 Update help output and zh-CN i18n

## 4. Testing

- [ ] 4.1 Test `--staged-only` with staged files
- [ ] 4.2 Test `--changed-only` after edit
- [ ] 4.3 Test `--files` with explicit paths
- [ ] 4.4 Test: full analyze still works when no flags provided
