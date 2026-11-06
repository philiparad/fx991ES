# Phase 3 — LCD Viewport Safety and Math Glyphs

## Scope
This stage improves the **independent** 96×31 display renderer. It is not a manufacturer pixel-matching claim and does not include any proprietary firmware, symbols or fonts.

## Implemented
- **Right-edge caret:** horizontal overflow accounts for a three-pixel editable cursor. A full-width 24-character input keeps its trailing cursor visible instead of clipping it at x=96.
- **Separate overflow gutters:** a 4-pixel margin on either side is reserved only when an expression/cursor is too wide or the structured math is taller than the input region. Horizontal and vertical direction glyphs are drawn in different positions in the gutters, not on top of math content.
- **Bounded scrolling:** cursor-anchored horizontal and vertical scrolling use the same fixed input viewport, preserving the status and result rows.
- **Mathematical glyphs:** independently designed 3×5 glyphs for `− × ÷ ∞ σ θ Σ ∫ ° ² ³ → ⇔`; this reduces unreadable question-mark fallback in common non-ASCII results.
- **Codepoint measurement:** glyph box width is based on Unicode code points, not UTF-16 code units.
- **Regression tests:** seven new internal cases in `tests/cases.js` check edge cursor visibility, gutters, scrolling, tall nested fractions and glyph coverage. They are not device captures.

## Viewport geometry
| Row (inclusive) | Content |
| --- | --- |
| y=0–5 | Header: angle/modifier/mode labels |
| y=6 | Horizontal divider |
| y=7–21 | Editable math expression / nested layout |
| y=22 | Horizontal divider |
| y=25–29 | Right-aligned result text |

When the expression overflows, the content viewport becomes x=4..91, leaving x=0..3 and x=92..95 for arrow markers. Without overflow it uses x=0..95. Logical frame dimensions remain 96×31; browser display raster scaling remains unchanged.

## Validation
```sh
node tests/run-node.cjs
node tests/keypad-layout.cjs
node tests/compatibility-baseline.cjs
python -m unittest discover -s tools/tests -v
python tools/release_gate.py verify
```
Then run actual browser acceptance for Chromium, Firefox and WebKit, with current source fingerprints and screenshots. This session has **not run** these programs or observed the real hardware.

## Remaining fidelity tasks
- Obtain actual 2nd-edition screen photographs (including cursor, indicators, long expressions, nested fractions and errors); record zoom/angle/mode/decimal settings.
- Compare pixels only after normalizing physical photo perspective, contrast and pixel grid. Record every font/position mismatch.
- Validate scrolling over key presses and all mode screens, rather than matching a single still image.
- Establish standard/C edition separation and regression expected outputs based on legitimate device observations. Hardware equivalence cannot be certified until those measurements exist.
