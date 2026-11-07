/* Emulator reference tools: independently authored pop-up LCD and opt-in KeyLog.
 * Inspired by functions documented in the bundled CASIO emulator user guide.
 * These tools do not claim native hardware/firmware parity.
 */
(function(global){'use strict';
const LIMIT=300;
function describeKey(key,before,after){
 const modifier=before&&before.alpha?'ALPHA':before&&before.shift?'SHIFT':'';
 return Object.freeze({
  key:String(key), modifier,
  mode:String((before&&before.mode)||'COMP'),
  result:String((after&&after.result)||''),
  view:String((after&&after.view)||'edit')
 });
}
function create(doc, sourceCanvas){
 if(!doc||!sourceCanvas)return null;
 const host=doc.querySelector('.calculator');
 if(!host)return null;
 let enabled=false,entries=[];
 const el=(tag,cls,text)=>{
  const e=doc.createElement(tag);
  if(cls)e.className=cls;
  if(text)e.textContent=text;
  return e;
 };
 const controls=el('div','emulator-tools-actions');
 const zoomButton=el('button','button secondary','Pop-up Display');
 const logButton=el('button','button secondary','KeyLog');
 zoomButton.type=logButton.type='button';
 controls.append(zoomButton,logButton);
 const housing=host.querySelector('.lcd-housing');
 if(housing)housing.insertAdjacentElement('afterend',controls);
 else host.append(controls);
 const popup=el('dialog','emulator-tools-dialog');
 popup.setAttribute('aria-label','Enlarged calculator display');
 const popupHead=el('div','emulator-tools-header');
 const popupTitle=el('strong','','Pop-up LCD — enlarged pixels');
 const closePopup=el('button','button secondary','Close');closePopup.type='button';
 popupHead.append(popupTitle,closePopup);
 const canvas=el('canvas','emulator-popup-canvas');
 canvas.width=768;canvas.height=248;
 canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label','Enlarged monochrome calculator display');
 const note=el('p','muted','Independent 96 × 31 framebuffer; enlargement is not an increase in native resolution.');
 popup.append(popupHead,canvas,note);
 const logDialog=el('dialog','emulator-tools-dialog');
 logDialog.setAttribute('aria-label','KeyLog history');
 const logHead=el('div','emulator-tools-header');
 const logTitle=el('strong','','KeyLog');
 const closeLog=el('button','button secondary','Close');closeLog.type='button';
 logHead.append(logTitle,closeLog);
 const logControls=el('div','emulator-tools-actions');
 const recordButton=el('button','button secondary','Start recording');
 const clearButton=el('button','button secondary','Clear');
 const exportButton=el('button','button secondary','Export JSON');
 for(const b of [recordButton,clearButton,exportButton])b.type='button';
 logControls.append(recordButton,clearButton,exportButton);
 const status=el('p','muted','Recording is off. Entries are kept in this tab only.');
 status.setAttribute('role','status');
 const logList=el('ol','emulator-keylog-list');
 logDialog.append(logHead,logControls,status,logList);
 doc.body.append(popup,logDialog);
 function open(dialog){
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
 }
 function close(dialog){
  if(typeof dialog.close==='function')dialog.close();
  else dialog.removeAttribute('open');
 }
 function refresh(){
  if(!popup.open)return;
  const context=canvas.getContext('2d',{alpha:false});
  if(context){
   context.imageSmoothingEnabled=false;
   context.clearRect(0,0,canvas.width,canvas.height);
   context.drawImage(sourceCanvas,0,0,canvas.width,canvas.height);
  }
 }
 function renderLog(){
  recordButton.textContent=enabled?'Stop recording':'Start recording';
  status.textContent=(enabled?'Recording on':'Recording off')+
   ' — '+entries.length+' / '+LIMIT+' entries (this tab only).';
  logList.textContent='';
  const fragment=doc.createDocumentFragment();
  for(let i=0;i<entries.length;i++){
   const e=entries[i],item=el('li','',
    (i+1)+'. '+(e.modifier?e.modifier+' + ':'')+e.key+
    ' ['+e.mode+'] → '+e.view+(e.result?' : '+e.result:''));
   fragment.append(item);
  }
  logList.append(fragment);
 }
 zoomButton.addEventListener('click',()=>{open(popup);refresh()});
 logButton.addEventListener('click',()=>{renderLog();open(logDialog)});
 closePopup.addEventListener('click',()=>close(popup));
 closeLog.addEventListener('click',()=>close(logDialog));
 recordButton.addEventListener('click',()=>{enabled=!enabled;renderLog()});
 clearButton.addEventListener('click',()=>{entries=[];renderLog()});
 exportButton.addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({schema:'fx991-keylog-v1',entries},null,2)],
   {type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=el('a');a.href=url;a.download='fx991-keylog.json';a.click();
  global.setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 return Object.freeze({
  refresh,
  record(key,before,after){
   if(!enabled)return;
   entries.push(describeKey(key,before,after));
   if(entries.length>LIMIT)entries.shift();
   if(logDialog.open)renderLog();
  }
 });
}
global.FX991_EMULATOR_TOOLS=Object.freeze({create,describeKey,LIMIT});
})(typeof window!=='undefined'?window:globalThis);
