# CASIO emulator reverse-engineering integration baseline

Date: 2026-11-07. Source: user-supplied installed CASIO fx-991ES PLUS C 2nd edition Windows emulator archive (read-only static analysis). This is an independent educational implementation, not a CASIO firmware port.

## Directly observed in the emulator archive

- Model-specific `fxESPLUS2_P16.dll` face bitmap: **644 × 1250** pixels. This is an *artwork image*, not an LCD-native bitmap nor a case dimension in millimetres.
- `GetDisplayPosition` returns **(126, 256)** and `GetSymbolPosition` returns **(130, 240)** as model-space origin candidates. Coordinate semantics require runtime confirmation.
- `GetKeyCount` returns **50**. The full key coordinate and keycode mapping is not yet captured.
- Windows EXE bitmap resources include **192 × 63** images. **Do not assume** these are the device-native LCD pixel count.
- `SimU8.dll` exposes simulation lifecycle and memory/register access functions; this does not by itself establish the original hardware processor, firmware origin, or numerical parity.
- Official emulator user guide describes Pop-up Display, Capture Screen and KeyLog, which are *Windows emulator UI features*, not necessarily physical calculator features.

## Current implementation and limitations

- `src/display.js`: independently authored **96 × 31** monochrome logical frame. This was an earlier project design choice; hardware parity remains **unverified**.
- `src/app.js`: enlarges each logical raster pixel by a factor of 8 with a stable integer scale and a contrast-adjusted LCD palette. That increases visual clarity, **not logical resolution**.
- `styles.css`: responsive original calculator housing and keypad styling; positioning is not calibrated to the DLL's physical key rectangles.
- `src/keypad-layout.js`: independently authored keypad metadata. Must not be certified as matching the 50-key layout from the emulator until all source-keycode and geometry evidence is obtained.
- Numerical modes and key behavior must continue to be tested with reference sequences against an actual running emulator or physical device.

## Implementation acceptance checklist

1. **Display**: capture clean emulator pop-up displays for edit/result/error/MODE/SETUP, with outer frame disabled. Confirm actual LCD *active rectangle*, character cells, annunciator region and raster dimensions. Record screenshots with magnification and Windows display scaling.
2. **Geometry**: capture a full original emulator screenshot at native size and compare independent web casing/key geometry against the reference bitmap coordinate system. Record normalized per-key rectangles and hit-test all 50 hardware keys.
3. **Input**: for each key, store base/SHIFT/ALPHA behavior by mode and state; log key sequence + screenshots, and separate unknown from unsupported.
4. **Math**: compare exact results, decimals, rounding, domain errors, angle-unit modes, editing precedence, memory, and history under identical setup; preserve source screenshots and machine-readable expected results.
5. **Regression**: browser framebuffer pixel hash test is a reproducibility check **only**. Introduce photographic golden-frame comparisons after native reference capture. Record pass/fail by tested model and firmware/emulator version.

## Change in this integration

- Corrected a subsequent regression: the primary `DIFF` key displays `∫` (integration), while its SHIFT legend displays `d/dx` (differentiation), matching the existing COMP key dispatcher.
- Refined the scaled monochrome cell raster with bounded contrast and explicit RGB clamping. Logical 96 × 31 pixels and calculation state are unchanged.

## Do not ship

Do not bundle the emulator EXE, DLLs, embedded firmware, copyrighted CASIO face bitmap, or activation assets in this public repository without permission. Re-create code, icons and graphics independently.

**Status: partial improvements only.** Exact replica parity has *not* been established by static reverse engineering.

## Next implementation increment — emulator reference tools

- Added optional Pop-up Display with live magnified LCD pixels; uses independent, existing 96 × 31 logical raster rather than claiming original emulator LCD hardware size.
- Added opt-in KeyLog for a bounded set of 300 key events with modifier, mode, view and resulting display string; supports JSON export and clear. Data is ephemeral in this tab.
- Wired both tools into the existing calculator event/render lifecycle and included source-level regression checks in the Node test runner.
- Confirmed from the current COMP state-machine branch that primary DIFF triggers integration, with SHIFT triggering differentiation; kept main and alternate legends consistent.
- Verification still pending: visual browser inspection, CI test outcome, native CASIO screen geometry, complete key coordinate mapping, mathematical result parity.
