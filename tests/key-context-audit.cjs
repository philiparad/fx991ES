/* P2-03: source-observed key × modifier × model × mode × view inventory.
 * Do not confuse controller routing with hardware/emulator verification.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),K=globalThis.FX991;
if(!K)throw Error('Calculator controller must load before P2-03');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'src/keypad-layout.js'),'utf8'),context);
const keys=Object.values(context.FX991_KEYPAD_LAYOUT).flat().filter(item=>item.key);
const profiles={standard:['COMP','CMPLX','STAT','BASE-N','EQN','MATRIX','TABLE','VECTOR'],
 c:['COMP','CMPLX','STAT','BASE-N','EQN','MATRIX','TABLE','VECTOR','INEQ','VERIF','DIST']};
const mods=['normal','shift','alpha'],views=['edit','result','error'];
const cells=[],counts={};
function digest(s){
 const view={...s};delete view.trace;
 return JSON.stringify(view,(key,value)=>typeof value==='bigint'?value.toString():value);
}
for(const [model,modes] of Object.entries(profiles))for(const mode of modes)for(const stateView of views)for(const item of keys)for(const modifier of mods){
 let s=K.createState(model);s.mode=mode;s.view=stateView;
 if(stateView==='result'){s.expression='2';s.cursor=1;s.document=globalThis.FX991_EDITOR.fromSource('2');s.result='2';s.lastValue=K.rat(2n);s.ans=K.rat(2n)}
 if(stateView==='error'){s.error=K.ERROR.MATH;s.result=s.error}
 if(modifier==='shift')s=K.dispatchKey(s,'SHIFT');
 if(modifier==='alpha')s=K.dispatchKey(s,'ALPHA');
 const before=digest(s);let classification,after=null,error=null;
 try{const next=K.dispatchKey(s,item.key);after=next.view;
  classification=item.enabled?(digest(next)===before?'source-no-action':'source-routed'):'disabled';
 }catch(e){classification='runtime-exception';error=String(e.message||e)}
 counts[classification]=(counts[classification]||0)+1;
 cells.push({model,mode,view:stateView,key:item.key,modifier,classification,viewAfter:after,...(error?{error}:{})});
}
const expected=(profiles.standard.length+profiles.c.length)*views.length*keys.length*mods.length;
assert.equal(cells.length,expected,'complete contextual key inventory');
assert.equal(new Set(cells.map(x=>[x.model,x.mode,x.view,x.key,x.modifier].join('/'))).size,expected,'unique contextual keys');
const report={schema:'fx991-key-context-audit-v1',physicalDeviceVerified:false,
 sourceRevision:'CI checkout',note:'State changes are source observations only, not device behavior; no-action may be intentional or unimplemented.',
 dimensions:{models:2,modes:19,views:views.length,physicalKeys:keys.length,modifiers:mods.length},counts,cells};
const output=path.join(root,'release-evidence','key-context-audit.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('P2-03: classified '+expected+' contexts; '+JSON.stringify(counts)+'; hardware parity unverified.');
if(counts['runtime-exception']){const examples=cells.filter(c=>c.classification==='runtime-exception').slice(0,5);throw Error('P2-03 controller exceptions: '+JSON.stringify(examples))}
