# Phase 15 — three-slot mixed-fraction input and LCD navigation

## Scope

Phase 14 supported **display conversion** from an improper rational result to a linear mixed-fraction result. Phase 15 adds a separate **editable mixed-fraction input template**, retaining the whole, numerator and denominator as distinct structural fields. No CASIO firmware, bitmaps, or licensed simulator assets were copied.

Official manufacturer reference for the family: https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf. Manufacturer examples and the simulator's current 11-case normalized-text corpus do **not** establish exact physical key timing, input glyphs, cursor behavior, or LCD pixel parity.

## User interactions

- In COMP editing mode, **SHIFT + FRAC** enters a structured mixed-fraction input with three successive fields: **whole → numerator → denominator**. The same entry is explicitly exposed as **Mixed fraction (whole / numerator / denominator)** in the Natural Display teaching toolbar, or through the semantic `MIXIN` action.
- Enter a digit in the whole field; RIGHT moves to the numerator, RIGHT again to the denominator. RIGHT from the last slot exits the mixed structure, permitting addition, subtraction, or another input template.
- In result mode, **SHIFT + FRAC** keeps its Phase 14 role as an improper/mixed **display toggle**. This does not alter Ans or the underlying exact fraction.
- Example: `SHIFT FRAC 2 RIGHT 3 RIGHT 4 =` evaluates exactly to `11/4`; subsequent `SHIFT FRAC` displays `2 3/4`. Prefixing the entry with `NEG` negates the whole expression.
- LineIO outputs an exact fraction when the dedicated mixed template is used, with S⇔D available to toggle to decimal.

## Structure and evaluation

The new Natural Editor `MixedFraction` node has separate immutable-ID `Sequence` slots named `whole`, `numerator`, and `denominator`. It is supported by structural deletion, source serialization, cursor positioning, source reconstruction, edit previews, and the independent LCD geometry renderer.

Serialization is unambiguous and uses exact rational arithmetic: `((whole)+((numerator)/(denominator)))`. The negative sign is a separate prefix, outside the mixed template, so `-(2 3/4)` evaluates to `-11/4`.

Before evaluation, the validator requires positive whole and numerator integers with **denominator strictly greater than numerator**; missing slots produce a Syntax ERROR, and invalid values produce an Argument ERROR. Each field is bounded to ten decimal digits for predictable processing. This is an educational input policy; it is **not** a claim that CASIO enforces identical input limits or error messages.

In session JSON, `cleanDocument` traverses and validates all three slots, checks duplicate node IDs and source equivalence, and preserves an active cursor across export/import. Existing plain fractions and older session documents remain compatible.

## LCD behavior

The Natural Display preview renders the whole number beside a separately stacked numerator/denominator, with a fraction bar. The 96×31 LCD renderer uses the same three fields with clipped horizontal and vertical input scrolling when the layout is larger than the viewport. The independent Phase 14 result viewport remains unchanged.

## Verification

- **631/631 internal JavaScript regression tests passed**, including **27 new Phase 15 tests** for structural slot navigation, exact positive/negative arithmetic, blank/invalid inputs, session integrity, normalized cursor behavior, LCD painting, and horizontal overflow.
- **11/11 manufacturer reference examples still match normalized result text**.
- Browser acceptance was expanded to click real `SHIFT + FRAC` and edit the three fields on the actual DOM keypad, verify the mixed structural preview, evaluate `2 3/4`, and toggle the resulting `11/4` back into mixed display.
- Real-browser and source-integrity CI results must be independently verified on the Phase 15 commit before this revision is declared browser-qualified.

## Fidelity boundary

No physical fx-991ES PLUS or licensed official-emulator measurements or authentic LCD reference photographs have been obtained. The browser's LCD behavior is internally consistent, but remains **unverified against CASIO physical hardware**.

Next meaningful step: compare real mixed-fraction entry sequences, cursor navigation, error conditions and LCD images with authentic reference captures, then refine the independently implemented semantics.
