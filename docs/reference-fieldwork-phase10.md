# Phase 10 — A4 physical reference field sheets and blank CSV intake

## Deliverables
- `tests/reference-field-sheet.html`: browser-based printable A4 collection workbook.
- `tests/reference-field-sheet.css`: two planned cases per A4 page, 25 total pages, print-friendly margins, clear handwriting fields, and page break controls.
- `tests/reference-field-sheet.js`: generates the page solely from the existing 50-case plan and allows filtering by seven categories. Exports a UTF-8 (BOM) CSV with 50 rows.
- `tests/device.html`: direct link to the printable sheet from the interactive device workbench.
- `tools/device_workbench_probe.py`: browser assertions for printable output structure, filtering and blank CSV fields in all three real browser engines.

## Collection protocol
1. Open `tests/reference-field-sheet.html` from the local calculator project through a static HTTP server. The page is offline-capable and uses plain HTML, CSS and JavaScript.
2. Print the complete pack, or select a category to print just that section. Two cases occupy each A4 sheet. The full plan produces 25 A4 sheets.
3. For each case, record **the actual physical key presses**, including SHIFT/ALPHA alternatives, without assuming the simulator's semantic key names describe genuine device button positions.
4. Transcribe the LCD exactly, including rounding, fraction bars, symbols, angle indicators, cursor and overflow, or reference an original photograph/video.
5. Record the model/edition and emulator version (when relevant), initial settings, timestamp, original media filename, and any discrepancy/repetition notes.
6. Use the blank CSV to transcribe handwritten records if helpful. It contains plan metadata only; its actual physical keys, observed display, device, observation date, media filename and repeatability fields all start **empty**.
7. Manually enter and review the observation in `tests/device.html`, then export its evidence JSON. No physical observation is created merely by printing or downloading this worksheet.

## Evidence controls
- Printed scenarios are **planned and unobserved**. No reference device results, screenshots, hardware predictions or manufacturer software assets are included.
- Physical reference media is neither uploaded nor verified by this workbook; a photo filename is just a local identifier.
- The CSV is a blank fieldwork worksheet, **not** an importable device-evidence JSON corpus and **not** a certification artifact.
- The separate interactive workbench still distinguishes a recorded self-reported observation from independently verified reference evidence.
- Any unit tests or synthetic browser fixtures are for software validation only. Never count them toward the 50 observed CASIO scenarios.

## Development validation
```sh
node tests/run-node.cjs
python -m unittest discover -s tools/tests -v
python tools/device_workbench_probe.py --out browser-evidence/device-workbench
python tools/release_gate.py verify
```

The GitHub Actions workflow runs the browser probe against Chromium, Firefox and WebKit and preserves its evidence report. **Browser success cannot establish physical fx-991ES PLUS fidelity**. Real, independently observed device output remains the next gating input.
