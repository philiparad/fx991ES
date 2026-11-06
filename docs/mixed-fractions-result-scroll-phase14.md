# Phase 14 — mixed fractions and independent LCD result scrolling

## Manufacturer guidance
The official CASIO fx-570ES PLUS / fx-991ES PLUS (2nd edition) User's Guide, printed **pages 7, 21–22**, describes an overflow indicator for results, LEFT/RIGHT scrolling of the result, a command for switching improper fractions to mixed form, and the **ten-character mixed-fraction conversion limit** (including integer, numerator, denominator, separators).

Primary reference: https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf

The implementation is original, browser-based software. The internal 96×31 framebuffer, keys and glyphs are *not* represented as pixel-perfect or physical button equivalents to the CASIO.

## Implemented
1. **Improper ↔ mixed presentation:** `SHIFT + FRAC` resolves to the independent semantic `MIX` action when the calculator is displaying a result. For a finite exact rational with a nonzero integer and nonzero remainder, toggles e.g. `7/6 → 1 1/6 → 7/6`, and `-7/6 → -1 1/6`. Does not mutate the typed Ans or memory; proper fractions and integers do not convert.
2. **Conservative display eligibility:** the complete mixed-fraction string (integer, numerator, denominator and two delimiters, including a minus sign when present) must contain at most 10 characters. Larger results remain in improper form; conversion makes no claim about CASIO's internal digit-count logic beyond the published limit.
3. **Independent result viewport:** a long result (linear or MathO stacked fraction/radical) can overflow the 96-pixel result region. The framebuffer preserves a separate clipped 88-pixel result viewport with small left/right continuation indicators and 16-pixel scrolling steps.
4. **Key navigation:** while a result is longer than its viewport, LEFT/RIGHT scrolls it, rather than unexpectedly entering input edit mode. An ordinary short result retains prior LEFT/RIGHT replay/edit behavior.
5. **Reset and safety:** S⇔D resets result scroll and mixed presentation while preserving typed Ans; new COMP, matrix/vector and guided-mode calculations reset the viewport. Long exact structures are not silently replaced with linear text merely because they exceed one screen.
6. **Exact edge cases:** fixed `sqrt(0)` to return exact zero, and added cancellation/reduction tests for radical arithmetic.

## Validation
- Internal JavaScript suite: **604/604**, including 22 Phase 14 cases and prior manufacturer-provenance tests.
- 11/11 selected official manual examples still agree on normalized result text.
- Real-browser acceptance suite now exercises actual DOM keypad clicks for `SHIFT + FRAC`, and tests LCD canvas pixel changes on result scrolling, in addition to existing browser coverage. CI must run on the Phase 14 commit before browser qualification is claimed.

## Limitations / decisions
- `MIX` is a **result-display transformation**, not a complete mixed-fraction input template. Exact physical SHIFT key lettering and original CASIO LCD mixed-fraction glyphs remain unverified.
- The scroll distance is 16 logical pixels per key, a documented software implementation policy, not measured CASIO firmware stepping.
- The virtual display does not copy CASIO's proprietary LCD font, and a browser framebuffer comparison cannot establish physical LCD parity.
- Mixed fractions are rendered in a clear linear notation (e.g. `1 1/6`); no claim is made of natural-display stacked mixed fraction equivalence.
- At present there are **zero actual physical CASIO or licensed official-emulator observations** in the repository. Browser and manufacturer-manual tests remain distinct from hardware equivalence.

## Next steps
Capture authentic LCD photos of mixed fraction conversion, small and wide fraction results, and result-arrow scrolling using the Phase 11 local-photo evidence tools. Compare actual key traces with the semantic mapping before changing the hardware compatibility status.
