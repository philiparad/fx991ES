# CASIO Compatibility Baseline — Phase 1

## Scope
This baseline is a **testing protocol**, not a compatibility certification. The reference target is the standard fx-991ES PLUS (2nd edition); C edition records are separate. Do not mix models or editions when comparing results.

## Evidence tiers
1. `internal` — an internal expectation or regression. Cannot demonstrate reference-device fidelity.
2. `manual` — a verified manual-derived expectation. Record source publication, document page, edition, and exact claim before promoting a case.
3. `physical` / `official-emulator` — actual observed output with device/emulator identity, observation date, setup, input sequence, and screenshot or transcription. Do not invent observations.

## Data and workflow
- `compatibility/baseline-v1.json` is a versioned corpus compatible with the repository's existing `FX991_REFERENCE.importCorpus()` and `FX991_DIFFERENTIAL.compareCorpus()` interfaces. Extra metadata is non-executable.
- Import this JSON into `tests/reference.html` or `tests/differential.html`. The import can compare exploratory expectations against the simulator; internal matches are **not** CASIO passes.
- Use `tests/device.html` on the same origin to capture observations from hardware or a licensed official emulator. Save raw observations separately; preserve case provenance. The project does not ship CASIO ROMs, fonts, or proprietary graphics.
- For every discrepancy capture: model/edition, setup (angle, format, digits), exact keys, expected LCD, observed LCD, cursor/menu page, error text, and screenshot if available. Record first divergent key rather than just final answer.
- Never turn an internal test into a `physical` claim by changing a field; obtain new evidence and document provenance.

## Priority test domains
P0: power-on/reset, exact physical key legends, SHIFT/ALPHA, MODE/SETUP, LCD cursor/clipping, errors.
P1: arithmetic precedence, fractions, S⇔D, numerical rounding, constants, unit conversion, numerical SOLVE, derivative, integral.
P2: EQN/MATRIX/VECTOR/STAT/BASE-N/TABLE and C-only functions.

## Limitations identified in source
- `src/app.js` uses a custom six-column keypad and a separate teaching interface rather than the exact plastic-key configuration.
- `src/display.js` implements custom 96×31 bitmap glyphs; physical screenshot parity remains untested.
- `src/numerical.js` implements independent numerical methods; firmware stopping/rounding/error boundaries are not proven equivalent.
- `src/state-machine.js` uses guided wizards; physical prompts and sequences remain unverified.
- `docs/source-fingerprint-m52.md` describes browser-evidence provenance, not device equivalence.

## Phase 1 acceptance criteria
- Versioned corpus parses and passes schema validation.
- Unique case IDs; source provenance never claims device observation for internal seeds.
- Simulated results may be reported as internal passes, but verified device cases remain **0** until actual observations are entered.
- A discrepancy backlog includes first divergence, reproduction steps, and a regression test.

## Phase 2 gate (not completed)
Capture ≥50 real observations across all 8 standard modes, including errors and intermediate screen states; match exact key sequences and output, and audit differences manually. This is a proposed target, not a current result.
