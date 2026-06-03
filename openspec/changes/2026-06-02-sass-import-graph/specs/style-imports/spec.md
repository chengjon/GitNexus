# style-imports Specification Delta

## ADDED Requirements

### Requirement: Pipeline SHALL extract Sass/CSS import relationships as STYLE_IMPORTS edges

A new pipeline phase (`styleImportsPhase`) SHALL run after `crossFile`,
scan all `.scss`/`.sass`/`.less`/`.css` files, extract `@use`/`@import`/`@forward`
directives, and add `STYLE_IMPORTS` relationships to the knowledge graph.

#### Scenario: SCSS file with @use produces STYLE_IMPORTS edge

- **WHEN** a scanned repo contains `styles/_colors.scss` and `styles/app.scss`
- **AND** `app.scss` contains `@use 'colors'`
- **THEN** the graph contains a `STYLE_IMPORTS` edge from `app.scss` to `_colors.scss`

#### Scenario: Repo with no style files produces zero edges

- **WHEN** a scanned repo contains no `.scss`/`.sass`/`.less`/`.css` files
- **THEN** the styleImports phase returns `edgesAdded: 0`

### Requirement: STYLE_IMPORTS SHALL be a valid relationship type in the graph schema

`STYLE_IMPORTS` SHALL be included in the `RelationshipType` union and `REL_TYPES`
array so that `impact`, `context`, and `cypher` tools traverse these edges.

#### Scenario: impact analysis traverses STYLE_IMPORTS edges

- **WHEN** a user runs `gitnexus impact _colors`
- **AND** `app.scss` imports `_colors.scss` via `@use`
- **THEN** `_colors.scss` appears as an upstream dependency of `app.scss`
