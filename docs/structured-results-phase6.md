# Phase 6 — Structured MathO Result Raster

## What is implemented
The 96×31 LCD renderer now consumes **typed exact values** supplied by `src/kernel.js` on a COMP-mode MathO result screen. It does not parse arbitrary expressions, evaluate JavaScript, or introduce manufacturer assets.

- Rational fractions with nonunit denominators use stacked numerator/bar/denominator rows.
- Supported radical values use a separately drawn radical and overbar, with integer coefficient.
- Supported exact π multiples use `π` and stacked rational coefficients.
- Plain integers, complex results, mode-result data, approximate decimal output, Fix/Sci and LineO/LineIO retain their existing text-based formatting.
- A structural result is drawn only if its layout fits within 96 pixels wide by 14 pixels tall. Oversized values use the original text fallback (which may truncate at 24 characters).
- When a structured result is shown, the input viewport is reduced from rows 7–21 to rows 7–15; the result occupies rows 17–29, preserving the status line and the 96×31 frame size.
- No change to the exact arithmetic engine, typed Ans or session value serialization.

## Verification
- **524/524** internal JavaScript regression cases pass in the isolated non-browser test harness, including 12 new result-raster cases.
- **15/15** exploratory internal reference cases pass, with **0 genuine physical or official-emulator observations**.
- For `1÷2`, the result layout is 9×13 logical pixels; for `π÷2`, 13×13 logical pixels.
- Pixel placement, legibility, cursor behavior and clipping have **not** been checked in Chromium, Firefox, Safari/WebKit, or against physical fx-991ES PLUS units.

## Known limitations
- This is an **original educational representation**, not a manufacturer pixel-for-pixel LCD emulation.
- Noninteger radical coefficients and some deeply structured exact results deliberately fall back to text.
- MathO output area uses its own layout measurements; exact manufacturer result heights, text positioning, scroll interaction, ellipsis behavior and glyphs are unverified.
- Input expressions taller than the reduced viewport are scroll/clipped while a structural result is visible.
- Long textual fallback results can be truncated as before.
- The browser acceptance matrix, Python CI, and official reference-device comparison have not been executed in this development session.

## Next stage
Execute a real browser matrix and collect reproducible screenshot/keypress comparisons from a licensed CASIO reference, beginning with fractions, radicals, π multiples, S⇔D, Fix/Sci and oversized results. Use the observations to refine sizes/positions, not assumed firmware parity.
