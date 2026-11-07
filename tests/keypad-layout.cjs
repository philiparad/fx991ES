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
 assert.ok(item&&item.enabled,name+' must stay enabled with a routed implementation');
}
assert.equal(keys.length,50,'physical key identity inventory');
assert.equal(keys.filter(item=>item.enabled).length,50,'all 50 visible keys currently enabled');
const keymapText=fs.readFileSync(path.join(root,'src/keymap.js'),'utf8');
for(const legend of ["9:'CLR'","7:'CONST'","8:'CONV'","ANS:'DRG'","CALC:'EQUALITY'","LOGBASE:'SIGMA'","MPLUS:'MMINUS'"])
 assert.ok(keymapText.includes(legend),'modifier map must route '+legend);
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.indexOf('src/keypad-layout.js')>=0&&html.indexOf('src/keypad-layout.js')<html.indexOf('src/app.js'),'layout loaded before app');
assert.ok(app.includes("item.key==='RCL'&&!state.shift?'RCL_MENU':item.key"),'SHIFT+RCL preserved');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
assert.ok(css.includes('aspect-ratio: 77 / 161.5'),'device proportions must remain manufacturer-grounded');
assert.ok(css.includes('P2-01: manufacturer case proportions'),'physical design approximation explicitly qualified');
assert.ok(css.includes('.keypad-top .key-cell:nth-child(4){grid-column:5;grid-row:1}'),'UP must be in upper cross arm');
assert.ok(css.includes('.keypad-top .key-cell:nth-child(5){grid-column:5;grid-row:3}'),'DOWN must be in lower cross arm');
// REA bitmap layout: case-normalized positions and four physical rows.
assert.ok(css.includes('REA physical-key geometry v2'),'emulator bitmap geometry patch loaded');
assert.ok(css.includes('aspect-ratio:540 / 1135'),'bitmap face proportions retained');
assert.ok(css.includes('.calculator .keys{'),'physical keypad uses a face-relative overlay');
assert.ok(css.includes('top:16%;height:37%;display:grid'),'four-row scientific region present');
assert.ok(css.includes('top:56%;height:44%;display:grid'),'four-row numeric region present');
assert.ok(css.includes('grid-template-rows:repeat(4,minmax(0,1fr))'),'four-key-row structure present');
for(const [index,property] of [
 [3,'left:38%;top:40%'],[4,'left:50%;top:8%'],
 [5,'left:50%;top:70%'],[6,'left:62%;top:40%']]){
 assert.ok(css.includes('.calculator .keypad-top .key-cell:nth-child('+index+'){'+property+'}'),
  'direction-pad reference coordinate for key '+index);
}
assert.ok(css.includes('.calculator .keypad-group .key-spacer{visibility:hidden}'),
 'empty scientific cells preserve grid position');
// Screenshot supplied 2026-11-07: reference-calibrated appearance.
assert.ok(html.includes('<span>CASIO</span>'),'reference face title rendered');
assert.ok(css.includes('Screenshot-fidelity calibration, reference image 316 x 628'),
 'user image is the documented visual reference');
assert.ok(css.includes('aspect-ratio:270 / 569'),'reference body proportions');
assert.ok(css.includes('top:14.0%;left:6.65%;width:86.7%;height:18.1%'),
 'screen bezel placed using reference face');
assert.ok(css.includes('top:63%;height:37%'),'numeric zone moved below scientific rows');
assert.ok(css.includes('background:#7fae29;color:#fff'),'DEL/AC green, not magenta');
assert.ok(css.includes('font:400 8.1cqw/1'),'number legend scales with face width');
assert.ok(css.includes('container-type:inline-size'),'responsive face units available');
console.log('Layout checks passed; physical-key and LCD equivalence NOT verified.');
