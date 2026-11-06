# Phase 7 — Real three-browser validation and evidence

## Scope
Phase 7 runs genuine Playwright browser sessions in Chromium, Firefox and WebKit. It distinguishes internal regression passes, browser rendering, release qualification, and physical CASIO equivalence.

## Implemented
- The GitHub Actions acceptance workflow now triggers for pull requests targeting `main` as well as existing events. Its real browser artifacts are uploaded even on failure.
- A diagnostic `tools/lcd_visual_probe.py` performs six actual user-interface calculations per browser: MathO `1/2`, MathO `√8`, MathO `π/2`, LineO `1/2`, LineIO `1/2`, and MathO `1/2` after S⇔D. It captures the **actual browser-rendered LCD canvas** as PNG and records a SHA-256 hash of each 96×31 RGBA buffer.
- The probe compares logical LCD pixels across all three browsers. These hashes cannot be substituted for hardware observations or manufactured claims.
- Browser acceptance uses stable semantic key names in `aria-label`, while preserving printed symbol text on keys.
- Mode options now have explicit `value=` attributes, so CSS selectors and model-switch tests work consistently.
- `tests/browser-acceptance.js` marks completion only after every one of its 18 checks finishes. `tools/browser_matrix.py` waits for this final completion signal before collecting evidence, preventing premature partial captures after the first failed check.
- Calculator dependencies used by `tests/cases.js` are loaded in the page in the same order as the Node regression harness.
- An inline history-heading style that conflicted with the calculator's own Content Security Policy was replaced with an existing stylesheet class.

## Actual browser evidence from the first two runs
- Run [42154115413](https://github.com/philiparad/fx991ES/actions/runs/42154115413): all 18 native interaction checks across three browsers **passed**, and all 18 LCD visual scenarios **passed**, with zero canvas-hash mismatches. Canonical browser acceptance captured incomplete evidence due to an interim failure status, and the mode-option test exposed missing explicit HTML option attributes.
- Run [42154531199](https://github.com/philiparad/fx991ES/actions/runs/42154531199): the canonical harness captured **18/18 check rows per browser**, 17 passing. The remaining regression-suite failure occurred because the live calculator page did not load all support modules before the test registry. CSP also produced console-error diagnostics because of one inline history style. Native and LCD probes again passed all three engines.
- These issues have been corrected on the development branch and a later run must confirm success. **Do not infer a clean release from these earlier runs.**

## Verification and release boundaries
```sh
node tests/run-node.cjs
node tests/compatibility-baseline.cjs
node tests/keypad-layout.cjs
python -m unittest discover -s tools/tests -v
python tools/shared_browser_session.py --out browser-evidence
python tools/lcd_visual_probe.py --out browser-evidence/lcd-visual
python tools/evidence_review.py browser-evidence
python tools/release_gate.py verify
```

The existing checked-in `release-manifest.json` was stale relative to Phases 1–7 and caused the release inventory gate to fail. It must be regenerated from the reviewed source inventory and committed before a release can qualify; never disable the integrity gate to force a pass.

Physical CASIO comparison remains **unverified**: no actual device photos or official-emulator observations have been entered.
