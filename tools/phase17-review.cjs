#!/usr/bin/env node
'use strict';
/* Phase 17: Evidence review readiness. This tool never certifies hardware parity. */
const fs=require('node:fs');
const IDS=Array.from({length:12},(_,i)=>`F16-${String(i+1).padStart(2,'0')}`);
const SCHEMA='fx991-phase17-independent-review-v1';
function assert(ok,message){if(!ok)throw new Error(message)}
function object(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
function inspect(evidence,reviews){
 assert(object(evidence)&&evidence.schema==='fx991-device-evidence-v1'&&Array.isArray(evidence.records),'Invalid device evidence corpus');
 assert(object(reviews)&&reviews.schema===SCHEMA&&Array.isArray(reviews.reviews),'Invalid independent review document');
 const records=new Map(),entries=new Map();
 for(const r of evidence.records){
  if(!IDS.includes(r.scenarioId))continue;
  assert(!records.has(r.scenarioId),'Duplicate focused scenario evidence: '+r.scenarioId);
  assert(typeof r.id==='string'&&r.id.length>0,'Observation ID missing');
  records.set(r.scenarioId,r);
 }
 for(const r of reviews.reviews){
  assert(object(r)&&IDS.includes(r.scenarioId),'Invalid review scenario ID');
  assert(!entries.has(r.scenarioId),'Duplicate independent review: '+r.scenarioId);
  assert(['match','mismatch','inconclusive'].includes(r.disposition),'Invalid review disposition');
  assert(typeof r.reviewer==='string'&&r.reviewer.trim().length>=3,'Reviewer identification required');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(r.reviewedAt||'')&&!Number.isNaN(Date.parse(r.reviewedAt+'T00:00:00Z')),'Valid review date required');
  assert(typeof r.observationId==='string'&&r.observationId.length>0,'Observation ID required for review');
  assert(typeof r.notes==='string'&&r.notes.trim().length>0,'Review notes required');
  assert(typeof r.physicalKeyMappingConfirmed==='boolean','Physical-key mapping decision required');
  assert(typeof r.checkpointsVerified==='boolean','Checkpoint verification decision required');
  entries.set(r.scenarioId,r);
 }
 const rows=IDS.map(id=>{
  const evidenceRecord=records.get(id),review=entries.get(id);
  const captured=!!evidenceRecord&&['physical','official-emulator'].includes(evidenceRecord.kind)&&
    typeof evidenceRecord.observed?.result==='string'&&evidenceRecord.observed.result.trim().length>0&&
    typeof evidenceRecord.device==='string'&&evidenceRecord.device.trim().length>0;
  const reviewed=captured&&!!review&&review.observationId===evidenceRecord.id&&
    review.physicalKeyMappingConfirmed&&review.checkpointsVerified;
  const status=!captured?'awaiting-device-observation':!review?'awaiting-independent-review':
    !reviewed?'review-incomplete':review.disposition==='match'?'human-reviewed-match':
    review.disposition==='mismatch'?'human-reviewed-discrepancy':'inconclusive';
  return {scenarioId:id,observationId:evidenceRecord?.id||null,status,
    disposition:reviewed?review.disposition:null};
 });
 return {schema:'fx991-phase17-readiness-report-v1',scenarioCount:12,
  recorded:rows.filter(r=>r.status!=='awaiting-device-observation').length,
  independentlyReviewed:rows.filter(r=>['human-reviewed-match','human-reviewed-discrepancy','inconclusive'].includes(r.status)).length,
  discrepancies:rows.filter(r=>r.status==='human-reviewed-discrepancy').map(r=>r.scenarioId),
  allReviewed:rows.every(r=>['human-reviewed-match','human-reviewed-discrepancy','inconclusive'].includes(r.status)),
  hardwareParityCertified:false,releaseApproved:false,
  warning:'Human review readiness only; neither evidence claims nor matches authenticate the physical device.',rows};
}
if(require.main===module){
 try{
  const argv=process.argv.slice(2);
  if(argv.length!==2){console.error('Usage: node tools/phase17-review.cjs evidence.json independent-reviews.json');process.exitCode=2}
  else{const report=inspect(JSON.parse(fs.readFileSync(argv[0],'utf8')),JSON.parse(fs.readFileSync(argv[1],'utf8')));console.log(JSON.stringify(report,null,2));if(!report.allReviewed)process.exitCode=1}
 }catch(error){console.error('Phase 17 review failed: '+error.message);process.exitCode=2}
}
module.exports={inspect,SCHEMA,IDS};
