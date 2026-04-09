# Native Runtime Structured Doctor Output Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose the native runtime snapshot as structured `data` in `doctor --json`
instead of only embedding it in the detail string.

## Design Decision

Use the same additive `DoctorCheck.data` pattern already adopted by
`language-support` and `embeddings-config`:

- keep the current `detail` text summary
- attach `nativeRuntimeManager.getSnapshot()` directly as `data`
- verify the default path with a real manipulated runtime snapshot in tests

## Why This Design

The snapshot already exists as a structured object. Reformatting it into a
string and forcing downstream consumers to reverse that formatting adds no
value.

This is also one of the safest remaining checks to structure because the source
data is already self-contained and local.

## Rejected Alternatives

### Keep testing only the injected `getNativeRuntimeCheck`

Rejected because that would not verify the default implementation path.

### Invent a new native-runtime payload shape

Rejected because `NativeRuntimeSnapshot` is already the right machine-readable
contract.

### Structure native-runtime together with all remaining doctor checks

Rejected because the slice should stay low risk and atomic.

## Success Criteria

- `native-runtime` emits `data`
- `data` matches `NativeRuntimeSnapshot`
- detail text remains unchanged
- focused tests fail if the default runtime path stops exposing snapshot data
