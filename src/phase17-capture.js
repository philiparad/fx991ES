/* Phase 17: structured entry for user-observed checkpoints. No device predictions. */
(function(root){'use strict';
function ensure(ok,msg){if(!ok)throw Error(msg)}
function build(plan,values){
 ensure(plan&&Array.isArray(plan.keys)&&Array.isArray(plan.checkpoints),'A focused plan is required');
 ensure(Array.isArray(values),'Checkpoint rows must be an array');
 const allowed=new Set(plan.checkpoints),seen=new Set(),rows=[];
 for(const value of values){
  ensure(value&&allowed.has(value.step),'Unexpected checkpoint step');
  ensure(!seen.has(value.step),'Duplicate checkpoint step '+value.step);seen.add(value.step);
  const observed={};
  for(const name of ['expression','result','view','mode','error','ans']){
   const v=value[name];
   ensure(v===undefined||typeof v==='string','Invalid '+name);
   if(typeof v==='string'&&v.trim())observed[name]=v.trim();
  }
  const physicalKey=(value.physicalKey||'').trim(),photoRef=(value.photoRef||'').trim();
  ensure(physicalKey.length<=120&&!/[<>]/.test(physicalKey),'Invalid physical key entry');
  ensure(photoRef.length<=300&&!/[<>]/.test(photoRef),'Invalid checkpoint photo reference');
  if(Object.keys(observed).length){
   const row={step:value.step,observed};
   if(physicalKey)row.physicalKey=physicalKey;
   if(photoRef)row.photoRef=photoRef;
   rows.push(row);
  }else ensure(!physicalKey&&!photoRef,'LCD observation required at checkpoint '+value.step);
 }
 rows.sort((a,b)=>a.step-b.step);
 return {checkpoints:rows,complete:rows.length===allowed.size,missing:plan.checkpoints.filter(s=>!seen.has(s))};
}
function discrepancies(report){
 ensure(report&&Array.isArray(report.results),'A comparison report is required');
 return {schema:'fx991-phase17-discrepancies-v1',hardwareParityCertified:false,
  note:'Derived solely from user-entered observations versus this simulator; not independently authenticated.',
  records:report.results.filter(r=>r.issues&&r.issues.length).map(r=>({
   observationId:r.id,model:r.model,sourceKind:r.kind,firstDivergence:r.firstDivergence,
   issues:r.issues.map(i=>({step:i.step,scope:i.scope,field:i.field,category:i.category,
     expected:i.expected,actual:i.actual}))
  }))};
}
const API=Object.freeze({build,discrepancies});
if(typeof module!=='undefined'&&module.exports)module.exports=API;
root.FX991_PHASE17_CAPTURE=API;
})(typeof window!=='undefined'?window:globalThis);
