## 1. Design

- [x] 1.1 Define the file classification taxonomy and default rules
- [x] 1.2 Design `forbidden_file_classes` parameter and warning output

## 2. Implementation

- [x] 2.1 Implement `file-classifier.ts` with default taxonomy
- [x] 2.2 Add `changed_file_classes` to `detect_changes` output
- [x] 2.3 Add `forbidden_file_classes` parameter to `detect_changes`
- [x] 2.4 Add warnings when forbidden classes contain changed files

## 3. Testing

- [x] 3.1 Test: SCSS-only changes classified as `style`
- [x] 3.2 Test: mixed changes classified correctly
- [x] 3.3 Test: unknown file types classified as `source` (default)
- [ ] 3.4 Test: forbidden_file_classes triggers warning in MCP response
- [ ] 3.5 Test: repo-specific overrides take precedence
