## 1. Research

- [x] 1.1 Survey existing Sass/SCSS import syntax: `@use`, `@import`,
      `@forward`, partial conventions
- [ ] 1.2 Survey Vue SFC style integration: `<style src="">`, `<style lang="scss">`
      (deferred — not required for initial implementation)
- [ ] 1.3 Survey Vite entry style imports: `import './styles/main.scss'`
      (deferred — not required for initial implementation)
- [x] 1.4 Check if tree-sitter-scss or similar provides import extraction
      (regex-based approach chosen instead)

## 2. Graph Schema

- [x] 2.1 Define `STYLE_IMPORTS` edge type in graph schema (`RelationshipType` + `REL_TYPES`)
- [ ] 2.2 Define node properties for style files: `file_type=scss|css|sass`
      (deferred — not required for initial implementation)
- [ ] 2.3 Design migration path from existing graph if schema changes needed
      (not needed — `STYLE_IMPORTS` is additive)

## 3. Implementation

- [x] 3.1 Implement Sass/SCSS import extractor (regex-based in `style-imports.ts`)
- [x] 3.2 Implement CSS `@import` extractor (covered by same regex)
- [ ] 3.3 Implement Vue SFC `<style src="">` extractor
      (deferred — not required for initial implementation)
- [ ] 3.4 Implement Vite/TS entry import extractor for style files
      (deferred — not required for initial implementation)
- [x] 3.5 Wire extractor into analyze pipeline (`styleImportsPhase`)
- [x] 3.6 Add style-import edges to graph during indexing

## 4. MCP Integration

- [x] 4.1 `impact`: includes style-import edges (automatic via `REL_TYPES` traversal)
- [x] 4.2 `context`: shows style import/export relationships (automatic via `REL_TYPES`)
- [ ] 4.3 `detect_changes`: report style file changes with import chain context
      (deferred — not required for initial implementation)
- [ ] 4.4 Add formatted output for style import chains
      (deferred — not required for initial implementation)

## 5. Testing

- [ ] 5.1 Test: extract `@use` relationships from SCSS files
- [ ] 5.2 Test: extract `<style src="">` from Vue SFCs
- [ ] 5.3 Test: `impact` on a SCSS file shows style dependents
- [ ] 5.4 Test: `context` on a SCSS file shows import chain
- [ ] 5.5 Test: facade/partial split shows correct dependency structure

## 6. Verification

- [ ] 6.1 Run analyze on a repo with SCSS files
- [ ] 6.2 Verify style import graph matches actual `@use`/`@import` chains
- [ ] 6.3 Verify dead style files (no importers) are identifiable
