/* CASIO compatibility baseline: integrity + internal replay only.
 * This is NOT hardware/emulator validation. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'compatibility', 'baseline-v1.json');
function fail(message) { throw new Error('Compatibility baseline: ' + message); }
function verifyCorpus(corpus) {
    if (!corpus || corpus.schema !== 'fx991-reference-v1' || corpus.baselineVersion !== 1 ||
        !Array.isArray(corpus.cases) || corpus.cases.length === 0) fail('invalid corpus envelope');
    const ids = new Set();
    for (const c of corpus.cases) {
        if (ids.has(c.caseId)) fail('duplicate caseId: ' + c.caseId);
        ids.add(c.caseId);
        if (c.source?.kind !== 'internal' || c.verification !== 'unverified')
            fail('seed case must remain an unverified internal expectation: ' + c.caseId);
        if (!Array.isArray(c.events) || !c.events.length || !c.expected || !Object.keys(c.expected).length)
            fail('missing keys or expected fields: ' + c.caseId);
        if (c.source.observedAt || c.source.device || c.source.screenshot)
            fail('internal case improperly contains observed-device evidence: ' + c.caseId);
    }
    return corpus.cases.length;
}
function run() {
    const corpus = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const total = verifyCorpus(corpus);
    for (const file of [
        'src/natural-editor.js', 'src/decimal15.js', 'src/display.js',
        'src/kernel.js', 'src/keymap.js', 'src/state-machine.js',
        'src/numerical.js', 'src/modes.js', 'src/c-edition.js',
        'src/reference.js', 'src/differential.js'
    ]) {
        vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), {filename:file});
    }
    const imported = globalThis.FX991_REFERENCE.importCorpus(corpus);
    if (imported.cases.length !== total) fail('import count mismatch');
    const report = globalThis.FX991_DIFFERENTIAL.compareCorpus(imported);
    for (const r of report.results.filter(r => !r.passed)) {
        console.error('INTERNAL MISMATCH', r.caseId,
            JSON.stringify(r.firstDivergence || r.error));
    }
    console.log('Baseline:', total, 'unverified internal cases; internal matches:',
        report.counts.passed, '; actual observed-device cases: 0');
    console.log('NOTE: internal matches do not prove CASIO compatibility.');
    if (report.counts.failed !== 0) process.exitCode = 1;
}
try { run(); } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
