## Why

For frontend repositories with SCSS/Sass design systems, GitNexus currently
treats style files as opaque blobs. A SCSS facade/partial split shows as
"0 affected processes" — accurate but missing the evidence chain that proves
no runtime consumer exists.

Without Sass import awareness, agents cannot distinguish active style files
from legacy, opt-in, or dead stylesheets.

Source: `/opt/claude/mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md`

## What Changes

- Extract `@use`, `@import`, `@forward` relationships from Sass/SCSS files
- Extract CSS `@import` relationships
- Extract `<style src="">` and scoped style imports from Vue SFCs
- Extract Vite/main entry style imports from TypeScript/JavaScript
- Add style-import edges to the graph alongside code-import edges
- Expose style dependency chain in `impact` and `context` output

## Capabilities

### New Capabilities

- `sass-import-graph`: GitNexus understands Sass/CSS import relationships
  and can report style dependency chains, runtime consumers, and dead styles.

### Modified Capabilities

- `impact`: Reports style-import dependents alongside code dependents
- `context`: Shows style import/export relationships for SCSS files
- `detect_changes`: Reports changed style files with import chain context

## Impact

- Affected modules:
  - `gitnexus/src/core/parsers/` — new Sass/SCSS parser or import extractor
  - `gitnexus/src/core/graph/` — new edge type for style imports
  - `gitnexus/src/cli/commands/analyze.ts` — invoke style extraction
  - `gitnexus/src/mcp/tools/impact.ts` — include style edges
  - `gitnexus/src/mcp/tools/context.ts` — include style relationships
- Risk: MEDIUM — new edge type, graph schema may need migration
