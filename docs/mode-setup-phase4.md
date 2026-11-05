# Phase 4 — CASIO MODE and SETUP Navigation Baseline

## Reference
CASIO official fx-570ES PLUS / fx-991ES PLUS (2nd edition) User's Guide, printed pages 10–13:
https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf

## Confirmed divergence corrected
The previous prototype used a four-choice-per-page MODE menu and assigned SETUP 1/2/3 to DEG/RAD/GRA. The manual specifies **MODE 1–8 directly** for the standard model and the following SETUP first page:

| Key | MODE | SETUP |
| --- | --- | --- |
| 1 | COMP | MthIO |
| 2 | CMPLX | LineIO |
| 3 | STAT | Deg |
| 4 | BASE-N | Rad |
| 5 | EQN | Gra |
| 6 | MATRIX | Fix |
| 7 | TABLE | Sci |
| 8 | VECTOR | Norm |

After SHIFT MODE: 1→1 MathO / 2 LineO; 2 LineIO; 3 Deg; 4 Rad; 5 Gra; 6 then 0–9 Fix; 7 then 0–9 Sci; 8 then 1/2 Norm.

Page 2 is accessible with DOWN (back via UP) and presents the documented fraction/complex/statistics/display/contrast options. Those secondary functions **are intentionally noninteractive** pending correct model-specific behavior, rather than silently applying unrelated settings. MthIO/LineIO preferences are recorded in the UI state only; actual firmware-compatible formatting is **not yet implemented**.

## Implementation
- `src/kernel.js`: standard MODE menu directly accepts keys 1–8, with C-extension choices on a separate DOWN page.
- `src/state-machine.js`: correct SETUP first-page key sequences, nested selectors, secondary menu navigation, semantic menu items and next-page metadata.
- `src/display.js`: independently drawn two-column by four-row LCD menu, using 96×31 framebuffer; next-page indicator only where a subsequent page exists.
- `tests/cases.js`: migrate old pre-manual tests and add sixteen menu/SETUP regressions.

## Validation completed
- Syntax compilation for eight relevant JavaScript files: pass.
- In-memory isolated JavaScript regression run: **497/497 passed**, with a test-harness UTF-8 TextEncoder polyfill because the isolated environment lacks the native global.
- In-memory internal differential baseline: **15/15 passed**, **0 physical/emulator observations**.
- Keypad module structure inspected (8 top, 24 scientific, 20 numeric positions, 50 unique semantic key identities).

## Not yet validated
- The real Chromium/Firefox/WebKit test matrix and full native page interaction.
- Official emulator or physical hardware key-by-key and LCD pixel parity.
- Effective MthIO/LineIO result rendering, secondary SETUP functionality and C-edition firmware-specific menu behavior.
- Release gate and separate Python CI tests.

Internal numerical results and regression passes do **not** establish physical-device equivalence.
