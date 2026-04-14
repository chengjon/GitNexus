# skills-historical-snapshot-date-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep historical skills snapshot date labels aligned with the latest absorbed follow-up facts

GitNexus SHALL keep the top `Status sync` and `Current Follow-Up Snapshot`
date labels in `docs/gitnexus-skills-review.md` and
`docs/gitnexus-skills-modification-suggestions.md` aligned with the latest
follow-up facts already reflected in those pages.

#### Scenario: A maintainer reads the top of either historical skills status page

- **WHEN** they read the page header and current follow-up snapshot heading
- **THEN** the top labels do not still claim `2026-04-08` after the page has
  already absorbed 2026-04-15 follow-up sync content
- **AND** the date labels reflect the latest absorbed snapshot date
