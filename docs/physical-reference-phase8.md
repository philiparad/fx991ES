# Phase 8 — Reference-device observation and first-divergence workbench

## Objective
Turn the existing simulator's device workbench into a repeatable differential protocol while preserving the boundary between **actual CASIO observations** and internal exploratory expectations.

## Device collection procedure
1. Identify the actual physical fx-991ES PLUS unit and edition, or the licensed official emulator and its version. Keep standard and C-edition observations separate.
2. Reset/set the **real reference device** to the recorded starting settings: angle (DEG/RAD/GRAD), number format (Norm1/Norm2/Fix/Sci), digit count for Fix/Sci, and MathO/LineO/LineIO display policy.
3. Open `tests/device.html` on the simulator. Pick a scenario or enter a semantic key sequence, then **independently reproduce it on the reference**. The scenario's exploratory expected result is never a device observation.
4. Record only outputs actually seen on the reference. Optionally add checkpoints after specific key numbers, such as `[{"step":2,"observed":{"view":"setup"}}]`. Step 1 is after pressing the first semantic key. In particular, simulator-internal `view`, `ans`, and `expression` labels should be recorded only if they have a clearly documented physical interpretation; the displayed numeric text is usually more reliable.
5. Assign a unique case ID and note a local photo/video evidence ID. The software **does not upload or validate a photo**; retain the actual original capture separately.
6. Export the evidence JSON, keep it alongside its source photos and identifying notes, and import it into the workbench for repeatable comparisons.
7. Investigate the earliest differing checkpoint before attempting a firmware-parity conclusion.

## Record schema: fx991-device-evidence-v1
The existing schema accepts optional `setup`, `checkpoints`, and `photoRef` metadata without breaking older files:

```json
{
  "schema":"fx991-device-evidence-v1",
  "records":[
    {
      "id":"record-after-real-measurement",
      "model":"standard",
      "kind":"physical",
      "device":"ENTER ACTUAL DEVICE ID AND EDITION",
      "observedAt":"YYYY-MM-DD",
      "setup":{"angle":"DEG","format":"Norm2","digits":3,"displayStyle":"MathO"},
      "keys":["1","DIV","2","="],
      "observed":{"result":"TRANSCRIBE ACTUAL LCD"},
      "checkpoints":[{"step":4,"observed":{"result":"TRANSCRIBE ACTUAL LCD"}}],
      "photoRef":"YOUR-ORIGINAL-PHOTO-FILENAME",
      "notes":"Settings / calculator state / unusual observations"
    }
  ]
}
```

**The above is a non-importable template**. It is not an observed result, and no fabricated physical data has been added to the repository. All user-entered evidence requires manual verification against the actual device or licensed emulator.

## Implementation
- `src/device-validation.js` validates setup, bounded checkpoints, unique step numbers, photo reference identifiers, and detects the first mismatching step using the existing differential trace engine. Original v1 records remain importable.
- `src/reference.js` adds validation for `setup.displayStyle` so setup is replayed consistently through the reference and differential interfaces.
- `tests/device.html` and `tests/device-page.js` now capture setup, intermediate observations and photo IDs. Simulator preview applies the same starting setup.
- Corrected stale preset sequences for RAD SETUP and C-edition INEQ selection.
- Ten additional internal regressions verify schema constraints, checkpoint matching, first divergence, and import/export. These synthetic unit-test fixtures must never be represented as real-world observations.

## Verification
- Internal JavaScript regression suite: **534/534 passed** in a non-browser test harness.
- Number of actual independently verified physical or official-emulator observations bundled: **0**.
- The existing phase-7 source/browser matrix was successful before these phase-8 changes; real browser retesting and source-manifest verification must be performed on the phase-8 commit. Do not reuse older screenshots or approvals as if they tested this revision.

## Browser collection-workbench acceptance
- `tools/device_workbench_probe.py` launches **real Chromium, Firefox and WebKit** and verifies that the workbench loads, that corrected preset keys are offered, that angle-aware previews calculate, that a checkpoint is matched, and that a deliberately incorrect result reports the first divergent step.
- All probe-created values exist only in an isolated browser context and are conspicuously labeled **synthetic browser fixtures**; the probe does not export them, place them in the observed-device corpus, or claim physical CASIO hardware tests.
- The CI workflow runs this diagnostic as an additional required step and uploads its JSON report with other browser evidence. Browser screenshots/reports remain distinct from physical reference evidence.

## Next gate
Collect at least 50 legitimate physical observations across all standard modes, including menu entry, result layout, error conditions, angle/number-format transitions and S⇔D cycles. The target is a proposed development objective, not present coverage. Manual verification of photographs and repeatability remains necessary. Neither passing internal tests nor user-imported unverified JSON constitutes hardware certification.
