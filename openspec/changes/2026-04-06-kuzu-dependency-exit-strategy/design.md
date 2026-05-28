## Design

This slice is still documentation-only. It does not replace `kuzu`, replace
`kuzu-wasm`, or modify lockfiles.

### 1. Build on the existing review and pinning decisions

The repo already has:

- a review slice that bounded the allowed outcomes
- an exact-pinning slice that contained direct dependency drift

This change fills the remaining gap between those two: explicit exit criteria.

### 2. Keep CLI and web decisions separate

The CLI native track and web wasm track have different runtime assumptions and
different migration surfaces. They must keep separate exit criteria and may end
in different eventual outcomes.

### 3. Treat `@kuzu/kuzu-wasm` as a reviewed candidate, not a presumed successor

The alternate scoped wasm package exists, but it is not backed by current
official docs and does not present a clearly healthier maintenance signal than
the current line. The design therefore records it as "reviewed but not adopted
by default."

### 4. Preserve dual CLI support as a hard constraint

The repository's user-facing host support target is dual CLI support for
Claude Code and Codex. Any future CLI dependency change that touches the Kuzu
runtime must preserve both host paths and keep the current host-adapter and
doctor coverage intact.
