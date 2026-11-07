/* Key routing regression: modifier handling must not be swallowed by UI.
 * This checks routing only; numerical/hardware parity is separate.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'src/key-input.js'),'utf8'),ctx);
const route=ctx.FX991_KEY_INPUT.route;
assert.equal(route('RCL',{shift:false,alpha:false}),'RCL_MENU','plain RCL opens recall');
assert.equal(route('RCL',{shift:true,alpha:false}),'RCL','SHIFT+RCL reaches controller');
assert.equal(route('RCL',{shift:false,alpha:true}),'RCL','ALPHA+RCL reaches controller');
assert.equal(route('AC',{shift:true,alpha:false}),'AC','SHIFT+AC preserved');
assert.equal(route('DIFF',{shift:true,alpha:false}),'DIFF','SHIFT+integral preserved');
assert.equal(route('MODE',{shift:true,alpha:false}),'MODE','SHIFT+MODE preserved');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
assert.ok(html.indexOf('src/key-input.js')>=0&&html.indexOf('src/key-input.js')<html.indexOf('src/app.js'),'router loaded before app');
assert.ok(app.includes('keyInput.route(item.key,state)'),'all button events use router');
assert.ok(!app.includes("item.key==='RCL'&&!state.shift"),'outdated UI modifier check removed');
console.log('Physical key routing checks passed.');
