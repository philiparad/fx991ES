# Phase 2 — Keypad Structure and Reference Fidelity

## Implemented on this branch
- A declarative keypad map in `src/keypad-layout.js` splits the controls into top, scientific, and numeric zones.
- The numeric zone has five columns, unlike the earlier six-column uniform grid.
- Duplicated parenthesis keys are removed; a single physical RCL key now routes normally to RCL and after SHIFT to the pre-existing STO state machine.
- Unimplemented physical keys are disabled and labeled: CALC, DIFF/∫, LOGBASE, ENG, M+, and EXP10.
- Teaching controls remain available in the side panel; the independent π shortcut is in the structural editor toolbar.
- Added `tests/keypad-layout.cjs` for offline structural checks.

## Known limitations (do not claim authentic replica)
- The top-control cluster and scientific legends remain approximate; their geometry is not yet matched to a measured reference unit.
- The missing operations are **not** implemented here; disabling the keys is deliberate to avoid silent incorrect behavior.
- The 96×31 logical LCD framebuffer and custom 3×5 glyphs are unchanged. No physical screenshot correspondence has been verified.
- The C edition shares the same presentation layout until its key placements can be separately documented.
- No browser or hardware tests were run through this GitHub connector session.

## Validation commands
```sh
node tests/keypad-layout.cjs
node tests/compatibility-baseline.cjs
node tests/run-node.cjs
python -m unittest discover -s tools/tests -v
python tools/release_gate.py verify
```
Run the three-browser Playwright matrix in CI with fresh source fingerprints. A passing internal suite **does not** prove physical CASIO compatibility.

## Future hardware comparison data
For each key take front-facing photographic measurements: key position, row, column, printed label, SHIFT label, ALPHA label, enabled function, and the exact resulting screen. Record edition and firmware/emulator identity, and keep all unpublished measurements clearly separated from manual-based expectations.

## Reference
- CASIO fx-991ES PLUS 2nd edition product page: https://edu.casio.com/intl/calculators/scientific/fx991es_2/
- CASIO official user guide: https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf
