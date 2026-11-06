/* P0-01 source key coverage; never assert physical parity from a source check. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'src/keypad-layout.js'),'utf8'),ctx);
const d=JSON.parse(fs.readFileSync(path.join(root,'compatibility/key-coverage-matrix.json'),'utf8'));
const keys=Object.values(ctx.FX991_KEYPAD_LAYOUT).flat().filter(x=>x.key).map(x=>x.key);
assert.equal(d.deviceVerified,false);assert.equal(d.buttons.length,50);
assert.deepEqual(d.buttons.map(x=>x.key),keys);
const modes={standard:['COMP','CMPLX','STAT','BASE-N','EQN','MATRIX','TABLE','VECTOR'],c:['COMP','CMPLX','STAT','BASE-N','EQN','MATRIX','TABLE','VECTOR','INEQ','VERIF','DIST']};
const expected=(modes.standard.length+modes.c.length)*50*3;
assert.equal(d.cells.length,expected);
const ids=new Set();
for(const c of d.cells){
 const id=[c.model,c.mode,c.key,c.modifier].join('/');
 assert(modes[c.model]?.includes(c.mode),id);
 assert(keys.includes(c.key),id);
 assert(['normal','shift','alpha'].includes(c.modifier),id);
 assert(['disabled','enabled-no-route','expected-route-missing','legend-unverified','source-route-unverified'].includes(c.capability),id);
 assert(!ids.has(id),'duplicate '+id);ids.add(id);
}
for(const [model,ms] of Object.entries(modes))for(const mode of ms)for(const key of keys)for(const mod of ['normal','shift','alpha'])assert(ids.has([model,mode,key,mod].join('/')));
console.log('P0-01: verified '+keys.length+' declared keys and '+expected+' classified combinations; physical parity NOT verified.');
