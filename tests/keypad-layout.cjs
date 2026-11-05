/* Offline structural verification; does not assert hardware parity. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/keypad-layout.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context,{filename:'src/keypad-layout.js'});
const layout=context.FX991_KEYPAD_LAYOUT;
assert.ok(layout,'layout exported');
assert.equal(layout.top.length,8,'top control zone');
assert.equal(layout.scientific.length,24,'scientific zone');
assert.equal(layout.numeric.length,20,'5-column numeric zone');
assert.deepEqual(Array.from(layout.numeric.slice(0,5),x=>x.key),['7','8','9','DEL','AC']);
assert.deepEqual(Array.from(layout.numeric.slice(5,10),x=>x.key),['4','5','6','MUL','DIV']);
assert.deepEqual(Array.from(layout.numeric.slice(10,15),x=>x.key),['1','2','3','ADD','SUB']);
assert.deepEqual(Array.from(layout.numeric.slice(15),x=>x.key),['0','.','EXP10','ANS','=']);
assert.deepEqual(Array.from(layout.scientific.slice(12,18),x=>x.key),['NEG','DMS','HYP','SIN','COS','TAN']);
const keys=[...layout.top,...layout.scientific,...layout.numeric].filter(x=>x.key);
assert.equal(new Set(keys.map(x=>x.key)).size,keys.length,'no duplicated physical key identities');
assert.equal(keys.filter(x=>x.enabled).length>=40,true,'enough enabled keys for browser smoke');
for(const item of keys)assert.equal(typeof item.enabled,'boolean','explicit capability status');
for(const name of ['CALC','DIFF','LOGBASE','ENG','MPLUS','EXP10']){
 const item=keys.find(x=>x.key===name);
 assert.ok(item&&!item.enabled,name+' must stay disabled until mapped');
}
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.indexOf('src/keypad-layout.js')>=0&&html.indexOf('src/keypad-layout.js')<html.indexOf('src/app.js'),'layout loaded before app');
assert.ok(app.includes("item.key==='RCL'&&!state.shift?'RCL_MENU':item.key"),'SHIFT+RCL preserved');
console.log('Layout checks passed; physical-key and LCD equivalence NOT verified.');
