/* REA emulator tools: deterministic metadata and integration wiring checks.
 * No claimed parity with physical CASIO LCD or keyboard.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/emulator-tools.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context,{filename:'src/emulator-tools.js'});
const E=context.FX991_EMULATOR_TOOLS;
assert.equal(E.LIMIT,300,'bounded log capacity');
assert.equal(typeof E.create,'function','tools initialized');
const first=E.describeKey('7',{mode:'COMP',shift:false,alpha:false},{view:'edit',result:''});
assert.equal(first.key,'7');
assert.equal(first.modifier,'');
assert.equal(first.mode,'COMP');
const shifted=E.describeKey('MODE',{mode:'COMP',shift:true,alpha:false},{view:'setup',result:''});
assert.equal(shifted.modifier,'SHIFT');
assert.equal(shifted.view,'setup');
const alpha=E.describeKey('SIN',{mode:'COMP',shift:false,alpha:true},{view:'edit',result:'3'});
assert.equal(alpha.modifier,'ALPHA');
assert.equal(alpha.result,'3');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
assert.ok(html.indexOf('src/emulator-tools.js')>=0,'reference tools loaded');
assert.ok(html.indexOf('src/emulator-tools.js')<html.indexOf('src/app.js'),'loaded before app');
assert.ok(app.includes("emulatorTools?.record(key,prior,state)"),'key event capture');
assert.ok(app.includes('emulatorTools?.refresh()'),'live LCD sync');
assert.ok(css.includes('.emulator-popup-canvas'),'popup display styles available');
console.log('REA emulator tools: metadata and source integration checks passed.');
