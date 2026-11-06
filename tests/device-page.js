(function(){'use strict';
const D=window.FX991_DEVICE,K=window.FX991,M=window.FX991_EVIDENCE_MEDIA,$=id=>document.getElementById(id);let corpus=D.empty();
let photo=null,photoObjectUrl=null,photoBusy=false,photoGeneration=0;
function clearPhoto(clearReference=true){
 photoGeneration++;photo=null;photoBusy=false;
 if(photoObjectUrl){URL.revokeObjectURL(photoObjectUrl);photoObjectUrl=null}
 $('photo-file').value='';$('photo-preview').removeAttribute('src');$('photo-preview').hidden=true;
 if(clearReference)$('photo-ref').value='';
 $('photo-status').textContent='No local photo selected. External media remains unverified; JSON does not contain image bytes.';
}
async function choosePhoto(){
 const file=$('photo-file').files[0];clearPhoto(false);
 if(!file)return;
 const generation=++photoGeneration;photoBusy=true;
 $('photo-status').textContent='Computing local SHA-256; the file stays in your browser…';
 try{
  const descriptor=await M.fromFile(file);
  if(generation!==photoGeneration)return;
  photo=descriptor;$('photo-ref').value=descriptor.fileName;
  photoObjectUrl=URL.createObjectURL(file);
  $('photo-preview').src=photoObjectUrl;$('photo-preview').hidden=false;
  $('photo-status').textContent=descriptor.fileName+' · '+descriptor.bytes+' bytes · SHA-256 '+descriptor.sha256+
   '. UNREVIEWED; keep the original photo file separately. No upload or image bytes in JSON.';
 }catch(error){
  if(generation===photoGeneration){photo=null;$('photo-ref').value='';$('photo-status').textContent=error.message}
 }finally{if(generation===photoGeneration)photoBusy=false}
}

function message(m){$('feedback').textContent=m}
function download(data){let u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));let a=document.createElement('a');a.href=u;a.download='fx991-device-observations.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function populate(){for(let s of D.scenarios()){let opt=document.createElement('option');opt.value=s.id;
 opt.textContent=(s.planned?'PLAN ':'LEGACY ')+s.id+' — '+(s.title||s.area);$('scenario').append(opt)}selectScenario()}
function selectScenario(){clearPhoto();let s=D.scenario($('scenario').value);
 $('model').value=s.model;$('keys').value=s.keys.join(' ');
 if(s.setup){$('angle').value=s.setup.angle;$('number-format').value=s.setup.format;
 $('digits').value=String(s.setup.digits);$('display-style').value=s.setup.displayStyle}
 $('case-id').value=s.planned?'case-'+s.id+'-001':'observed-001';
 for(const id of ['result','mode','error','notes','photo-ref','checkpoints'])$(id).value='';
 $('view').value='';
 $('manual').textContent=s.planned?'PLANNED ONLY — '+s.title+'. No physical result has been recorded. Reproduce the sequence independently on real equipment.':s.manual===null?'Exploratory legacy scenario; no device result known.':'Unverified exploratory prediction: '+s.manual+' (NOT physical evidence).';
}
function setup(){return {angle:$('angle').value,format:$('number-format').value,digits:Number($('digits').value),displayStyle:$('display-style').value}}
function checkpoints(){let text=$('checkpoints').value.trim();if(!text)return [];let value=JSON.parse(text);if(!Array.isArray(value))throw Error('Intermediate observations must be a JSON array');return value}
function renderCoverage(){
 const progress=D.planCoverage(corpus);$('plan-summary').textContent=
  progress.recorded+' / '+progress.planned+' planned scenarios have self-reported records; '+
  progress.unrecorded+' remain unrecorded. Independent authentication: NO.';
 const root=$('plan-categories');root.replaceChildren();
 for(const [area,count] of Object.entries(progress.categories)){
  const cell=document.createElement('div');cell.className='device-category-item';
  const name=document.createElement('strong');name.textContent=area;
  const n=document.createElement('span');n.textContent=count.recorded+' / '+count.planned+' recorded';
  cell.append(name,n);root.append(cell);
 }
}
function render(){renderCoverage();let r=D.review(corpus);$('summary').textContent=r.totals.passed+' matched / '+r.totals.failed+' mismatched from '+r.totals.records+' actual-device records. Standard '+r.coverage.standard+'; C edition '+r.coverage.c+'. Certification: NOT established.';$('categories').textContent=JSON.stringify(r.byCategory,null,2);$('results').replaceChildren();for(let item of r.results){let p=document.createElement('pre');p.className='device-prewrap';p.textContent=(item.passed?'MATCH':'MISMATCH')+' '+item.id+' ('+item.model+')\n'+item.issues.map(i=>'step '+i.step+' '+i.category+': expected '+JSON.stringify(i.expected)+' vs actual '+JSON.stringify(i.actual)).join('\n')+'\nFirst difference: '+(item.firstDivergence??'none');$('results').append(p)}}
$('photo-file').onchange=choosePhoto;
$('photo-clear').onclick=()=>clearPhoto();
$('scenario').onchange=selectScenario;
$('simulate').onclick=()=>{try{let a=$('keys').value.trim().split(/\s+/);if(!a[0])throw Error('Enter a key sequence.');let st=K.createState($('model').value);st.setup={...st.setup,...setup()};for(const k of a)st=K.dispatchKey(st,k);let s=K.semanticScreen(st);$('preview').textContent=JSON.stringify({mode:s.mode,view:s.view,result:s.result,expression:s.expression,indicators:s.indicators},null,2)}catch(e){$('preview').textContent=e.message}};
$('record').onclick=()=>{try{let observed={};for(let id of ['result','mode','view','error']){let v=$(id).value.trim();if(v)observed[id]=v}if(photoBusy)throw Error('Local photo fingerprint is still being computed');let row={id:$('case-id').value.trim(),model:$('model').value,kind:$('kind').value,device:$('device').value.trim(),observedAt:$('date').value,setup:setup(),scenarioId:D.scenario($('scenario').value).planned?$('scenario').value:undefined,keys:$('keys').value.trim().split(/\s+/),observed,checkpoints:checkpoints(),photoRef:$('photo-ref').value.trim(),media:photo||undefined,notes:$('notes').value};corpus=D.add(corpus,row);message('Recorded '+row.id+'. Export JSON to preserve these observations.');render()}catch(e){message(e.message)}};
$('export').onclick=()=>download(corpus);
$('import').onchange=async e=>{try{if(!e.target.files[0])return;corpus=D.importEvidence(await e.target.files[0].text());clearPhoto();message('Imported '+corpus.records.length+' observation metadata records. Original images must be supplied separately.');render()}catch(err){message(err.message)}e.target.value=''};
populate();render();
})();