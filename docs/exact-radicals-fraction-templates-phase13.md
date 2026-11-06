# Phase 13 — exact compound radicals and fraction-template output

## Reference and fidelity
The official CASIO fx-570ES PLUS / fx-991ES PLUS (2nd edition) manual, printed pages **20–21**, documents:
- `(√2 + 2) × √3` as **`√6 + 2√3`**, with a decimal S⇔D alternative.
- LineIO `1 ÷ 5` displaying decimal `0.2` initially; S⇔D reveals fractional `1/5`.
- LineIO **dedicated fraction-template** entry such as `1 − 4/5` displaying fractional `1/5` initially; S⇔D then displays decimal `0.2`.
- LineIO input of `2/3 + 1/2` using fraction templates produces `7/6`.

Official reference: https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf

The implementation below uses an independent semantic editor and arithmetic kernel. **Result text agreement does not establish physical-key or LCD pixel parity.**

## Delivered — exact sums and products of radicals
- `src/kernel.js` introduces a bounded **`radical-sum`** value for exact expressions with a rational scalar plus at most **eight unlike square-root terms**. Coefficients remain reduced exact rationals, and repeated radicands are combined.
- Multiplication distributes across exact sums, including root-root products; `√2 × √3` remains `√6` and `√2 × √2` reduces to `2`.
- Sums, differences, scalar multiplication and division by rational coefficients preserve exact forms. Unsupported/oversized exact combinations are intentionally bounded and fall back to previous explicit behavior or an argument error rather than claiming unrestricted symbolic algebra.
- Numerical functions, range validation, decimal formatting, typed Ans and normal display preserve a consistent numeric approximation of the exact radical sum.
- Canonical result text for the published example is **`√6+2√3`**.
- `src/display.js` renders fitting radical sums with individual radical signs, overbars and plus/minus signs within the existing **96×31** pixel frame, falling back to text if the exact structure is too large.
- `src/session.js` serializes and verifies bounded, canonical exact radical-sum register and Ans values. Legacy sessions remain importable.

## Delivered — fraction-template distinction
- The editor already had a dedicated `FRAC` structure, distinct from the literal `DIV` (`÷`) key.
- For **LineIO**, a completed expression containing dedicated fraction templates initially uses the available exact/fraction representation, while ordinary division without a template continues to display decimal first.
- S⇔D toggles that representation. Expressions mixing a template fraction with an explicitly entered decimal are decimal-first.
- `src/manufacturer-examples.js` now models the three fraction-template examples using `FRAC` and semantic slot movement rather than falsely equating physical fraction input with `DIV`.

This is a policy-level educational implementation. Exact Casio cursor movement, linear fraction separator glyphs, eligibility thresholds, mixed fractions and firmware rounding still require genuine device or licensed emulator observations.

## Actual executed tests
- **582/582 internal JavaScript tests pass**, including **17 Phase 13 regressions** for exact radical addition/multiplication/cancellation, exact/decimal views, LCD layout and session safety.
- **11/11 manufacturer's printed example results match normalized text**, up from 7/11 in Phase 12.
- Manufacturer comparison metadata continues to report **zero physical device/official-emulator observations**; physical key mappings and LCD pixel glyph parity remain unverified.
- Phase 12 comparison report is retained as the earlier diagnostic snapshot; this report documents the subsequent four-result resolution.

## Remaining work
1. Observe **actual CASIO key sequences and LCD photos**, especially the special fraction-template key, S⇔D, MathO radical sums and LineIO fraction separators.
2. Test broader symbolic boundaries and overflow cases against verified manufacturer/reference expectations.
3. Keep PR draft until release CI and physical comparison support a merge decision.
