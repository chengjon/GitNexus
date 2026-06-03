## 1. Design

- [x] 1.1 Define the file classification taxonomy and default rules:
      - `style`: `*.scss`, `*.css`, `*.sass`, `*.less`
      - `documentation`: `*.md`, `*.mdx`, `*.rst`
      - `governance`: `openspec/**`, `DEVELOPMENT_RULES*`, `DoD*`
      - `source`: default fallback (excluding test/config/build)
      - `test`: `*.test.*`, `*.spec.*`, `__tests__/**`
      - `config`: `*.json`, `*.yaml`, `*.toml`, `.env*`, `tsconfig*`
      - `build`: `Dockerfile`, `Makefile`, `docker-compose*`
      - `script`: `*.sh`, `*.bash`
      - `asset`, `data`, `generated`, `unknown`
- [ ] 1.2 Design repo-specific override mechanism in `.gitnexus/config.json`
      (deferred — not required for initial implementation)
- [x] 1.3 Design `forbidden_file_classes` parameter and warning output

## 2. Implementation

- [x] 2.1 Implement `file-classifier.ts` with default taxonomy
- [ ] 2.2 Add repo-specific override loading from config
      (deferred — not required for initial implementation)
- [x] 2.3 Add `changed_file_classes` to `detect_changes` output
- [x] 2.4 Add `forbidden_file_classes` parameter to `detect_changes`
- [x] 2.5 Add warnings when forbidden classes contain changed files

## 3. Testing

- [ ] 3.1 Test: SCSS-only changes classified as `style`
- [ ] 3.2 Test: mixed changes classified correctly
- [ ] 3.3 Test: forbidden_file_classes triggers warning
- [ ] 3.4 Test: repo-specific overrides take precedence
- [ ] 3.5 Test: unknown file types classified as `unknown`

## 4. Documentation

- [ ] 4.1 Update CLAUDE.md with classification field description
- [ ] 4.2 Add config example for repo-specific overrides

## 5. Verification

- [ ] 5.1 Run `detect_changes` on a multi-category commit and verify
      classification counts match manual inspection
