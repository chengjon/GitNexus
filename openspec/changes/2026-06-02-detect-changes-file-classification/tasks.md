## 1. Design

- [ ] 1.1 Define the file classification taxonomy and default rules:
      - `style`: `*.scss`, `*.css`, `*.sass`, `*.less`
      - `docs`: `*.md`, `docs/**`
      - `governance`: `openspec/**`, `DEVELOPMENT_RULES.md`, `DoD.md`, etc.
      - `source`: `*.ts`, `*.js`, `*.py`, `*.go`, etc. (excluding test/config)
      - `api_contract`: routes, controllers, API schema files
      - `router`: route definitions, middleware
      - `test`: `*.test.*`, `*.spec.*`, `__tests__/**`
      - `config`: `*.json`, `*.yaml`, `*.toml`, `Dockerfile`, etc.
      - `build`: `webpack.*`, `vite.*`, `rollup.*`, `tsconfig.*`
      - `other`: anything not classified
- [ ] 1.2 Design repo-specific override mechanism in `.gitnexus/config.json`
- [ ] 1.3 Design `forbidden_file_classes` parameter and warning output

## 2. Implementation

- [ ] 2.1 Implement `file-classifier.ts` with default taxonomy
- [ ] 2.2 Add repo-specific override loading from config
- [ ] 2.3 Add `changed_file_classes` to `detect_changes` output:
      ```json
      {
        "changed_file_classes": {
          "style": 6,
          "docs": 1,
          "governance": 3,
          "source": 0,
          "api_contract": 0,
          "router": 0
        }
      }
      ```
- [ ] 2.4 Add `forbidden_file_classes` parameter to `detect_changes`
- [ ] 2.5 Add warnings when forbidden classes contain changed files

## 3. Testing

- [ ] 3.1 Test: SCSS-only changes classified as `style`
- [ ] 3.2 Test: mixed changes classified correctly
- [ ] 3.3 Test: forbidden_file_classes triggers warning
- [ ] 3.4 Test: repo-specific overrides take precedence
- [ ] 3.5 Test: unknown file types classified as `other`

## 4. Documentation

- [ ] 4.1 Update CLAUDE.md with classification field description
- [ ] 4.2 Add config example for repo-specific overrides

## 5. Verification

- [ ] 5.1 Run `detect_changes` on a multi-category commit and verify
      classification counts match manual inspection
