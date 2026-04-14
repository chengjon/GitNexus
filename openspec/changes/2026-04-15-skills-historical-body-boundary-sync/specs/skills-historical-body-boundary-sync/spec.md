# skills-historical-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep preserved historical skills body sections clearly bounded from the current snapshot

GitNexus SHALL keep the preserved lower-body sections in
`docs/gitnexus-skills-review.md` and
`docs/gitnexus-skills-modification-suggestions.md` explicitly marked as
historical 2026-03-26 baseline context.

#### Scenario: A maintainer reads below the current follow-up snapshot

- **WHEN** they continue into the old summary or detailed body sections
- **THEN** the page explicitly warns that the retained `状态` / `当前状态` /
  `建议修改` wording belongs to the 2026-03-26 baseline
- **AND** the page points readers back to the current follow-up snapshot,
  roadmap, and later convergence records for current-state guidance
