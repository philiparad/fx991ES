# Phase 12 — published manufacturer examples: first externally grounded comparison

## Evidence level and source
This is the first comparison batch grounded in **an external CASIO publication**, not in internal simulator-generated expectations. Source: [CASIO fx-570ES PLUS / fx-991ES PLUS (2nd edition) User's Guide](https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf), printed pages **20, 21 and 27**. Each of the 11 cases in `src/manufacturer-examples.js` carries its printed page, display mode, initial angle setting, transcribed result and the simulator semantic-key sequence used for comparison.

The publication shows specific examples but **is not a physical observation or an independently captured LCD screenshot**. Even when result text agrees, the LCD font, fraction stacking, indicators, cursor, button mapping and numerical precision are *not* verified. In particular, the simulator's `DIV` key sequence is **not guaranteed equivalent to CASIO's dedicated fraction-entry template**.

## Observed results of the deterministic publication comparison
The independently executed baseline has **7 of 11 normalized result-text matches and 4 differences**:

| ID | Publication example | Printed expected (normalized) | Simulator result | Result |
| --- | --- | --- | --- | --- |
| M12-01 | π ÷ 6, MathO | 1/6π | 1/6π | text match |
| M12-02 | π ÷ 6, S⇔D | 0.5235987756 | 0.5235987756 | text match |
| M12-03 | 1 ÷ 5, LineIO | 0.2 | 0.2 | text match |
| M12-04 | 1 ÷ 5, then S⇔D, LineIO | 1/5 | 1/5 | text match (glyph unverified) |
| M12-05 | 1 − 4/5, LineIO fraction-input | 1/5 | 0.2 | **difference; input template not equivalent** |
| M12-06 | 1 − 4/5, LineIO then S⇔D | 0.2 | 1/5 | **difference; input template not equivalent** |
| M12-07 | 2/3 + 1/2, MathO | 7/6 | 7/6 | text match |
| M12-08 | 2/3 + 1/2, LineIO fraction-input | 7/6 | 1.166666667 | **difference; input template not equivalent** |
| M12-09 | sin 30°, LineIO | 0.5 | 0.5 | text match |
| M12-10 | sin⁻¹ 0.5, LineIO, degrees | 30 | 30 | text match |
| M12-11 | (√2 + 2) × √3, MathO | √6 + 2√3 | Argument ERROR | **documented unsupported compound radical** |

These are **not** measured calculator mismatches. M12-05, M12-06 and M12-08 should not be treated as verified firmware defects until the distinct physical fraction-entry semantics are reproduced in the simulator. M12-11 documents a specific mathematical expression and exact-form result that the current model does not support.

## Scope and next engineering decisions
- Preserve the 7 normalized-text matches as manufacturer-document regression anchors. Keep the 4 differences clearly visible rather than silently accepting simulator outputs as expectations.
- **Priority 1:** separate `DIV` mathematical division from CASIO fraction-template inputs. The manual displays a linear fraction separator in LineIO, so even a matching plain `1/5` string is **not a pixel-accurate match**.
- **Priority 2:** represent sums of unlike exact radicals (e.g., √6 + 2√3) symbolically rather than failing evaluation or approximating them without clear disclosure.
- **Priority 3:** obtain authentic physical or licensed-emulator photographs to validate layout and exact key behavior.

## Automated verification
Run `node tests/run-node.cjs` to exercise the manufacturer corpus through the independent reference engine. Phase-12 tests verify provenance, 11 total cases, 7 normalized matches, 4 recorded differences, and **zero physical observations**. Do not interpret a green test as 11/11 CASIO-equivalent behavior.

The manufacturer's own manual states that illustrated displays may differ somewhat from individual physical units. Pixel-precise compatibility still requires actual reference imagery.
