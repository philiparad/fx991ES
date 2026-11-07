const fs=require('fs'),vm=require('vm'),path=require('path');
const base=path.resolve(__dirname,'..');
for(const file of ['src/natural-editor.js','src/decimal15.js','src/display.js','src/kernel.js','src/keymap.js','src/reference-tables.js','src/complex-input.js','src/state-machine.js','src/numerical.js','src/modes.js','src/c-edition.js','src/reference.js','src/manufacturer-examples.js','src/differential.js','src/release-audit.js','src/release-candidate.js','src/fraction-validation.js','src/reference-plan.js','src/evidence-media.js','src/device-validation.js','src/session.js','src/browser-evidence.js','src/error-explanations.js','tests/cases.js'])vm.runInThisContext(fs.readFileSync(path.join(base,file),'utf8'),{filename:file});
const report=globalThis.FX991_TESTS.run();console.log(`${report.passed}/${report.total} tests passed`);for(const t of report.details.filter(x=>!x.pass))console.log('FAIL',t.name,t.error);if(report.failed)process.exitCode=1;
// Phase 17 hardware-review readiness checks use synthetic fixtures, never device evidence.
require('../tools/phase17-review.test.cjs');

require('../tools/phase17-capture.test.cjs');

require('../tools/phase17-review-ui.test.cjs');

require('../tools/keyboard-shortcuts.test.cjs');

require('./key-inventory.cjs');

// P0-20: prevent structural keypad tests from drifting out of CI.
require('./keypad-layout.cjs');

require('./lcd-raster-audit.cjs');
