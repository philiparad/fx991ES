'use strict';
const assert=require('node:assert/strict');
const {keyFor}=require('../src/keyboard-shortcuts.js');
const event=(key,more={})=>({key,...more});
const node=(tagName,calculator=false)=>({tagName,isContentEditable:false,
 classList:{contains:name=>calculator&&name==='key'}});
const body=node('BODY'),key=node('BUTTON',true),button=node('BUTTON');
for(const [input,command] of [['1','1'],['0','0'],['.','.'],['+','ADD'],['-','SUB'],['*','MUL'],['/','DIV'],['^','POW'],['Enter','='],['Escape','AC'],['Backspace','DEL'],['ArrowLeft','LEFT']]){
 assert.equal(keyFor(event(input),body),command,'body shortcut: '+input);
}
for(const el of [node('INPUT'),node('TEXTAREA'),node('SELECT'),node('A'),button]){
 assert.equal(keyFor(event('4'),el),null,'editing/control focus must be preserved: '+el.tagName);
}
assert.equal(keyFor(event('4'),key),'4','calculator-focused button must allow digit');
assert.equal(keyFor(event('+'),key),'ADD','calculator-focused button must allow arithmetic');
assert.equal(keyFor(event('Enter'),key),null,'native button activation must be preserved');
assert.equal(keyFor(event(' '),key),null,'native Space activation must be preserved');
assert.equal(keyFor(event('7',{ctrlKey:true}),body),null);
assert.equal(keyFor(event('7',{metaKey:true}),body),null);
assert.equal(keyFor(event('7',{altKey:true}),body),null);
assert.equal(keyFor(event('7',{isComposing:true}),body),null);
assert.equal(keyFor(event('x'),body),null);
assert.equal(keyFor(event('5'),{tagName:'DIV',isContentEditable:true}),null);
assert.equal(keyFor(event('5'),{tagName:'SPAN',closest:s=>s==='[contenteditable="true"]'?{}:null}),null);
console.log('Keyboard shortcut focus tests passed');
