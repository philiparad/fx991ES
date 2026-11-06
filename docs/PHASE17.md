# Phase 17 — Authentic fraction/cursor evidence and independent review

## Scope and release boundary

Carry forward the 12 *planned, unobserved* `F16-01` … `F16-12` scenarios in `src/fraction-validation.js`. Phase 16 verified software and browser infrastructure, **not** physical CASIO fidelity. Keep PR #1 in **DRAFT**, do not merge into `main`, and do not present GitHub CI success as hardware certification.

## Collection procedure (for each scenario)

1. On a real fx-991ES PLUS, or an authorized official emulator with edition/version documented, record exact model, date, operator, power/reset state and setup (MathO/LineIO, angle, Norm settings). Do not use the simulator as the source of expected outputs.
2. Check and document the mapping from each *semantic* simulator key to the actual physical keyboard sequence. The `SHIFT FRAC` notation in the plan is not independently authenticated against physical key legends.
3. Execute the exact physical sequence; capture a readable original image of the LCD and cursor at every checkpoint, plus the terminal display. Record any keys that differ, including setup navigation, and any scroll indicators.
4. In `tests/device.html`, select the corresponding `F16-XX` scenario, record only directly observed fields, attach a locally hashed photograph if available, enter checkpoint JSON and export evidence. Keep the original photo files separately; the JSON stores metadata, not image bytes. Do not copy the simulator preview into observations.
5. Have a **different person** review the images and transcribed outputs, confirm physical key mapping and each checkpoint, and compare the observed screen and cursor behavior with the simulator. Enter a review decision of `match`, `mismatch`, or `inconclusive`; record a specific discrepancy and first divergent step when mismatched.
6. Preserve original evidence, photo SHA-256 hashes, reviewer notes and a version-controlled discrepancy log. Fix only reproducible mismatches; rerun the browser, LCD, workbench, source-integrity and Node suites after each code change.

**Priority:** `F16-03` and `F16-04` mixed fractions; `F16-06` and `F16-07` cursor movement; `F16-11` scrolling; `F16-12` fraction/decimal conversion. Then complete the remaining six cases.

## Review JSON format

Save a document with schema `fx991-phase17-independent-review-v1`. The following is a **structural example only**, not a measurement or a completed review:

```json
{
  "schema": "fx991-phase17-independent-review-v1",
  "reviews": []
}
```

When genuine evidence exists, each review entry has `scenarioId`, `observationId`, `reviewer`, `reviewedAt` (`YYYY-MM-DD`), `disposition` (`match` / `mismatch` / `inconclusive`), `physicalKeyMappingConfirmed` (boolean), `checkpointsVerified` (boolean), and nonempty `notes`. Never fill these from fabricated or assumed observations.

Run:

```bash
node tools/phase17-review.cjs actual-device-evidence.json independent-reviews.json
node tools/phase17-review.test.cjs
```

Exit status 0 indicates all 12 scenarios have review-complete metadata, **not** hardware parity. Exit status 1 means some cases are pending; 2 means invalid input or invocation. `hardwareParityCertified` and `releaseApproved` are deliberately always false; a separately authorized release decision requires original physical source verification and a human sign-off. Records and reviewer assertions are self-reported and cannot authenticate their own provenance.

## Completion criteria

- Twelve distinct genuine observations, with checkpoints, keyboard mapping, and preserved source photographs or documented equivalent evidence.
- Twelve independently reviewed cases with no unresolved mismatch or inconclusive result.
- Any simulator corrections covered by new regression tests and green CI.
- Explicit human validation of the original source and documented release decision. Until then the draft PR and the physical-fidelity claim remain blocked.
