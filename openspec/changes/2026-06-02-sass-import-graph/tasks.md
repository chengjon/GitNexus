## 1. Research

- [ ] 1.1 Survey existing Sass/SCSS import syntax: `@use`, `@import`,
      `@forward`, `@use "file" as *`, partial conventions
- [ ] 1.2 Survey Vue SFC style integration: `<style src="">`, `<style lang="scss">`
- [ ] 1.3 Survey Vite entry style imports: `import './styles/main.scss'`
- [ ] 1.4 Check if tree-sitter-scss or similar provides import extraction

## 2. Graph Schema

- [ ] 2.1 Define `STYLE_IMPORTS` edge type in graph schema
- [ ] 2.2 Define node properties for style files: `file_type=scss|css|sass`,
      `import_type=use|import|forward|entry`
- [ ] 2.3 Design migration path from existing graph if schema changes needed

## 3. Implementation

- [ ] 3.1 Implement Sass/SCSS import extractor (regex or AST-based)
- [ ] 3.2 Implement CSS `@import` extractor
- [ ] 3.3 Implement Vue SFC `<style src="">` extractor
- [ ] 3.4 Implement Vite/TS entry import extractor for style files
- [ ] 3.5 Wire extractors into analyze pipeline
- [ ] 3.6 Add style-import edges to graph during indexing

## 4. MCP Integration

- [ ] 4.1 `impact`: include style-import edges in dependent calculation
- [ ] 4.2 `context`: show style import/export relationships
- [ ] 4.3 `detect_changes`: report style file changes with import chain context
- [ ] 4.4 Add output like:
      ```
      element-plus-artdeco.scss imports:
      - element-plus-artdeco.variables.scss
      - element-plus-artdeco.core-components.scss

      Runtime consumers:
      - main-standard.ts imports element-plus-override.scss
      ```

## 5. Testing

- [ ] 5.1 Test: extract `@use` relationships from SCSS files
- [ ] 5.2 Test: extract `<style src="">` from Vue SFCs
- [ ] 5.3 Test: `impact` on a SCSS file shows style dependents
- [ ] 5.4 Test: `context` on a SCSS file shows import chain
- [ ] 5.5 Test: facade/partial split shows correct dependency structure

## 6. Verification

- [ ] 6.1 Run analyze on mystocks_spec repo with SCSS files
- [ ] 6.2 Verify style import graph matches actual `@use`/`@import` chains
- [ ] 6.3 Verify dead style files (no importers) are identifiable
