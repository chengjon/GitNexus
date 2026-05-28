# Embeddings Config Structured Doctor Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Make `doctor --json` emit structured `embeddings-config` data so machine
consumers no longer need to parse the human-readable detail string.

## Design Decision

Use the same additive JSON pattern introduced for `language-support`:

- keep the existing `detail` string
- add structured `data` on the `embeddings-config` check
- populate `data` from the already available `EmbeddingsConfigSnapshot`
- include the Ollama probe result in `data.probe`

## Why This Design

`runDoctor()` already computes the exact structured values that operators care
about. The current string-only transport is accidental complexity, not a real
requirement.

This design keeps backward compatibility while making the determinism-critical
config check machine readable.

## Rejected Alternatives

### Leave `detail` as the only contract

Rejected because it preserves a brittle string parsing requirement for
automation.

### Add a second standalone embeddings JSON output

Rejected because `DoctorCheck.data` is already the established additive path.

### Structure every doctor check in the same slice

Rejected because this slice should stay narrow and low risk; `embeddings-config`
is the highest-value remaining candidate.

## Success Criteria

- `embeddings-config` emits structured `data`
- `data` includes effective config, source metadata, precedence, and probe info
- existing detail text remains unchanged
- focused tests fail if structured data disappears
