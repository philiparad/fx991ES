'use strict';
const assert=require('node:assert/strict');
const {inspect,SCHEMA,IDS,CHECKPOINTS}=require('./phase17-review.cjs');
const empty=()=>({schema:'fx991-device-evidence-v1',records:[]});
const reviews=()=>({schema:SCHEMA,reviews:[]});
let r=inspect(empty(),reviews());
assert.equal(r.scenarioCount,12);assert.equal(r.recorded,0);assert.equal(r.allReviewed,false);assert.equal(r.hardwareParityCertified,false);assert.equal(r.readyForHumanSignoff,false);
const e=empty();e.records.push({id:'auth-01',scenarioId:IDS[0],kind:'physical',device:'fx-991ES PLUS',observed:{result:'1/2'},checkpoints:CHECKPOINTS[IDS[0]].map(step=>({step,observed:{expression:'observed checkpoint '+step}}))});
r=inspect(e,reviews());assert.equal(r.recorded,1);assert.equal(r.independentlyReviewed,0);
const v=reviews();v.reviews.push({scenarioId:IDS[0],observationId:'auth-01',reviewer:'Independent reviewer',reviewedAt:'2026-11-06',disposition:'mismatch',physicalKeyMappingConfirmed:true,checkpointsVerified:true,notes:'Hypothetical test fixture only'});
r=inspect(e,v);assert.deepEqual(r.discrepancies,[IDS[0]]);assert.equal(r.independentlyReviewed,1);assert.equal(r.hardwareParityCertified,false);
v.reviews[0].observationId='wrong';r=inspect(e,v);assert.equal(r.rows[0].status,'review-incomplete');
v.reviews[0].observationId='auth-01';v.reviews[0].physicalKeyMappingConfirmed=false;r=inspect(e,v);assert.equal(r.rows[0].status,'review-incomplete');
assert.throws(()=>inspect({schema:'wrong',records:[]},reviews()),/Invalid device evidence/);
assert.throws(()=>inspect(e,{schema:SCHEMA,reviews:[v.reviews[0],v.reviews[0]]}),/Duplicate independent review/);

// A bare terminal result does not constitute checkpoint review evidence.
const incomplete=empty();incomplete.records.push({...e.records[0],checkpoints:[]});
assert.equal(inspect(incomplete,v).rows[0].status,'checkpoint-observations-missing');
const partial=empty();partial.records.push({...e.records[0],checkpoints:e.records[0].checkpoints.slice(1)});
assert.equal(inspect(partial,v).independentlyReviewed,0);
assert.equal(inspect(e,v).hardwareParityCertified,false);
console.log('Phase 17 readiness tests: passed (all inputs are synthetic test fixtures)');

const fullEvidence=empty(),fullReviews=reviews();
for(const id of IDS){
 const observationId='fixture-'+id;
 fullEvidence.records.push({id:observationId,scenarioId:id,kind:'physical',
  device:'SYNTHETIC TEST FIXTURE',observed:{result:'dummy'},
  checkpoints:CHECKPOINTS[id].map(step=>({step,observed:{expression:'synthetic-'+step}}))});
 fullReviews.reviews.push({scenarioId:id,observationId,reviewer:'Synthetic fixture reviewer',
  reviewedAt:'2026-11-06',disposition:'match',physicalKeyMappingConfirmed:true,
  checkpointsVerified:true,notes:'Synthetic test fixture; no authentic device'});
}
const ready=inspect(fullEvidence,fullReviews);
assert.equal(ready.allReviewed,true);
assert.equal(ready.readyForHumanSignoff,true);
assert.equal(ready.hardwareParityCertified,false);
assert.equal(ready.releaseApproved,false);
fullReviews.reviews[2].disposition='mismatch';
const mismatch=inspect(fullEvidence,fullReviews);
assert.equal(mismatch.allReviewed,true);
assert.equal(mismatch.readyForHumanSignoff,false);
assert.deepEqual(mismatch.discrepancies,[IDS[2]]);
fullReviews.reviews[2].disposition='inconclusive';
assert.equal(inspect(fullEvidence,fullReviews).readyForHumanSignoff,false);
console.log('Phase 17 signoff gate tests: pass (synthetic fixtures only)');

const physicalPlan=globalThis.FX991_FRACTION_VALIDATION || (require('../src/fraction-validation.js'), globalThis.FX991_FRACTION_VALIDATION);
assert.equal(physicalPlan.CASES.length,IDS.length);
for(const plan of physicalPlan.CASES){
 assert.deepEqual([...plan.checkpoints],CHECKPOINTS[plan.id],plan.id+' reviewer checkpoints diverge from validated scenario');
 assert.ok(plan.checkpoints.every(step=>step<=plan.keys.length&&step>0),plan.id+' impossible checkpoint');
}
console.log('Phase 17 plan-review checkpoint alignment: passed');
