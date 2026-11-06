# Phase 5 — MathO, LineO and LineIO Display Policy

## Manufacturer reference
Official fx-570ES PLUS / fx-991ES PLUS (2nd edition) manual, setup and display-format section:
https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf

The documented distinctions:
- MthIO–MathO: natural mathematical input and results.
- MthIO–LineO: natural input, linear output.
- LineIO: linear input and output.
- STAT, BASE-N, MATRIX, VECTOR automatically use linear display.

## Implementation
1. `src/kernel.js` provides `effectiveDisplayStyle(setup, mode)` and style-aware `valueDisplay`. MathO retains existing exact output (e.g., `1/2` or `2√2`). LineO and LineIO use the current numeric formatter for regular results, including Norm1/Norm2/Fix/Sci. S⇔D can show the exact value without recomputing it. Typed `Ans` remains unchanged. Modes STAT, BASE-N, MATRIX and VECTOR force the *effective* display style to LineIO without overwriting the saved preference.
2. `src/state-machine.js` now writes the SETUP MthIO/LineIO preference into the calculation setup (not just UI metadata).
3. `src/app.js` and `index.html` expose a real display-style selector. LineIO preview uses text in one line, while MathO/LineO retain the natural structural input editor.
4. `src/session.js` round-trips `setup.displayStyle` with validation; old exports without the field still restore with MathO.
5. `tests/cases.js` adds 15 regressions for exact fractions, radicals, S⇔D, Norm1, mode forcing, input projection, result invariance and session security.

## Validation completed
- **512/512** JavaScript internal regression cases passed in a non-browser JavaScript harness.
- **15/15** internal exploratory comparison cases passed. Physical/emulator evidence: **0**.
- Syntax checks: 17 JavaScript modules in the regression harness; `src/app.js` was separately syntax-checked after fixing a missing statement separator.
- Sample 1÷2 renders MathO `1/2`, LineO `0.5`, LineIO `0.5`; LineIO input projection disables structural LCD layout but leaves the editor's computational AST untouched.

## Remaining compatibility gaps
**This is a partial educational display policy, not a complete Casio output emulator.**
- MathO currently emits exact result *text*. A physically accurate stacked fraction/surd result renderer is not yet implemented in the tiny LCD result area.
- LineO/LineIO currently prioritize decimal outputs. Authentic CASIO linear fractional result notation, eligibility, default S⇔D behavior, exact-to-decimal thresholds, scientific glyphs and firmware rounding still need genuine device/emulator captures.
- Physical glyph bitmaps, viewport geometry, flashing cursor and menu indicators are not certified.
- Real Chromium, Firefox, WebKit, Python CI, and release-gate executions remain outstanding.

## Next work
Build a reference-observation corpus with screenshots for 1÷2, 1÷200 (Norm1/Norm2), √8, π÷2, S⇔D cycles, and overflow cases in all three styles. Once grounded in physical evidence, implement real stacked result layout and exact linear fraction notation, rather than assuming an output convention from the arithmetic engine.
