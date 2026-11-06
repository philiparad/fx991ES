# Phase 9 — Fifty-case physical-reference capture plan

## Purpose and evidence boundary
This is a **capture plan**, not an experimental result. It contains **50 planned, unobserved** cases and **zero** CASIO physical/official-emulator outcomes. The scripts use the independent simulator's *semantic* key identifiers; do **not** assume those sequences exactly match button-by-button hardware paths. First confirm and annotate the real CASIO keystrokes, including which SHIFT/ALPHA variants are needed.

The plan is defined in `src/reference-plan.js` and appears at the top of `tests/device.html`. Categories:

| Category | Planned |
| --- | ---: |
| Arithmetic and precedence | 10 |
| Fractions, radicals, π and S⇔D | 10 |
| Trigonometry (DEG, RAD, GRAD) | 8 |
| SETUP and display format selection | 8 |
| MODE navigation | 6 |
| Error classification | 4 |
| LCD layout/scroll behavior | 4 |
| **Total** | **50** |

## Collection protocol
1. Work on a clearly identified physical fx-991ES PLUS **or** authorized official emulator. Record model/edition, emulator version (when relevant), and date. Standard and C editions must be distinguished.
2. Starting from a known state, set the real reference to the recorded angle, number-format, digit count and display policy, then separately initialize the independent simulator with those settings.
3. Select a planned case in `tests/device.html`. It fills the planned semantic sequence and initial setup **but leaves every actual observed result blank**.
4. Independently perform the real calculator keys. Record the exact LCD text, sign, indicators and any format transitions. If the semantic plan cannot be reproduced, annotate the physical key path in `notes`; do not silently substitute the simulator's interpretation.
5. Record optional intermediate checkpoints by 1-based key position when the physical screen provides a directly comparable observation. Keep raw photos/video locally. `photoRef` is an identifier and does not embed, upload or validate the original media.
6. Save and export the observation as JSON. The locally stored JSON is **self-reported and not independently authenticated**; a matching result is not proof of manufacturer parity.
7. Investigate the earliest mismatch (UI displays the step), then repeat on a fresh device state. Record both successful and unsuccessful repetitions.
8. Review the seven-category progress panel. **Recorded** means at least one imported or entered record was associated with the planned scenario; it does not mean its provenance was authenticated, or that its result matched.

## Technical format and safety
- Plans use immutable identifiers A01–A10, E01–E10, T01–T08, S01–S08, N01–N06, R01–R04 and L01–L04.
- Plan entries include `id`, `title`, `area`, `keys`, `setup`, and `sourceStatus="planned-unobserved"`; **no manufacturer observations or expected values are present**.
- User-entered evidence may include an optional validated `scenarioId` matching one of those identifiers. Existing evidence without `scenarioId` stays valid and does not count toward the plan's unique-case progress.
- Plan progress is computed from unique recorded IDs, not from passing comparisons; duplicates do not increase coverage.
- The browser test uses temporary, explicitly synthetic fixtures that are never included as physical reference data.
- The reference workbench and calculator run in HTML/CSS/vanilla JavaScript; Playwright/Node/Python are optional CI and development tools only.

## Completion gate
The goal is 50 independently captured reference cases with original supporting media, repeated for suspicious discrepancies. A complete record count is **not certification**. Physical fidelity claims additionally require provenance review, repeatability and explicit per-feature pass/fail criteria.

## Verification
```sh
node tests/run-node.cjs
node tests/keypad-layout.cjs
node tests/compatibility-baseline.cjs
python -m unittest discover -s tools/tests -v
python tools/device_workbench_probe.py --out browser-evidence/device-workbench
python tools/shared_browser_session.py --out browser-evidence
python tools/lcd_visual_probe.py --out browser-evidence/lcd-visual
python tools/release_gate.py verify
```

No physical-CASIO observation has been made merely by running this plan.
