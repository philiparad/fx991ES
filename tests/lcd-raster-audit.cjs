/* P2-02: source-only LCD raster regression; NOT hardware pixel parity. */
'use strict';
const assert=require('node:assert/strict');
const K=globalThis.FX991;
assert.ok(K&&typeof K.rasterizeScreen==='function','LCD renderer available');
const cases=[
 {name:'default edit',keys:[]},
 {name:'arithmetic result',keys:['2','ADD','3','=']},
 {name:'math error',keys:['1','DIV','0','=']},
 {name:'shift indicator',keys:['SHIFT']},
 {name:'mode choices',keys:['MODE']},
 {name:'setup choices',keys:['SHIFT','MODE']},
 {name:'fraction template',keys:['FRAC','1','RIGHT','2']},
 {name:'secondary clear menu',keys:['SHIFT','9']}
];
for(const item of cases){
 const execute=()=>{let s=K.createState();for(const key of item.keys)s=K.dispatchKey(s,key);return s};
 const a=execute(),b=execute(),sa=K.semanticScreen(a),sb=K.semanticScreen(b);
 const pixels=K.rasterizeScreen(sa),again=K.rasterizeScreen(sb);
 assert.equal(pixels.length,96*31,item.name+' 96x31 frame');
 assert.equal(again.length,96*31,item.name+' second frame');
 assert.equal(K.frameHash(pixels),K.frameHash(again),item.name+' deterministic pixels');
 assert.ok(Array.from(pixels).some(Boolean),item.name+' nonblank LCD');
 assert.ok(Array.from(pixels).every(n=>n===0||n===1),item.name+' monochrome pixels');
}
const error=(()=>{let s=K.createState();for(const key of ['1','DIV','0','='])s=K.dispatchKey(s,key);return K.semanticScreen(s)})();
assert.equal(error.view,'error');assert.equal(error.result,'Math ERROR');
console.log('P2-02: 8 deterministic 96x31 LCD source frames passed; hardware parity unverified.');
