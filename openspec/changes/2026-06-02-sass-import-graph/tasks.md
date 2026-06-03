## 1. Research

- [x] 1.1 Survey Sass/SCSS import syntax: @use, @import, @forward, partials

## 2. Graph Schema

- [x] 2.1 Define `STYLE_IMPORTS` edge type in graph schema

## 3. Implementation

- [x] 3.1 Implement Sass/SCSS import extractor (regex-based)
- [x] 3.2 Implement CSS @import extractor (covered by same regex)
- [x] 3.3 Wire extractor into analyze pipeline (`styleImportsPhase`)
- [x] 3.4 Add style-import edges to graph during indexing

## 4. MCP Integration

- [x] 4.1 `impact`: includes style-import edges (automatic via REL_TYPES)
- [x] 4.2 `context`: shows style import/export relationships (automatic via REL_TYPES)

## 5. Testing

- [x] 5.1 Test: extract @use relationships from SCSS files
- [x] 5.2 Test: extract @import and @forward directives
- [x] 5.3 Test: isStyleFile detects supported extensions
- [x] 5.4 Test: relative path resolution from source directory
- [x] 5.5 Test: impact on a SCSS file shows style dependents (p0-p1-p2-mcp-response.test.ts)
- [x] 5.6 Test: context on a SCSS file shows import chain (p0-p1-p2-mcp-response.test.ts)
