/* Milestone 14: deterministic, browser-only state-machine extension.
 * Input events are semantic key codes. Device-specific screen/key parity
 * remains subject to black-box reference validation.
 */
(function(global){'use strict';
const base=global.FX991;
const E=global.FX991_EDITOR;const KEYS=global.FX991_KEYS;
const SETUP=[['Angle','DEG','RAD','GRAD'],['Format','Norm1','Norm2','Fix','Sci']];
const wizardConfigs={
 EQN:{menu:['QUAD','CUBIC','LINEAR2','LINEAR3'],fields:{QUAD:['a','b','c'],CUBIC:['a','b','c','d'],LINEAR2:['a11','a12','b1','a21','a22','b2'],LINEAR3:['a11','a12','a13','b1','a21','a22','a23','b2','a31','a32','a33','b3']}},
 MATRIX:{menu:['DET2','DET3','INV2','TRANS2','MUL2'],fields:{DET2:['a11','a12','a21','a22'],DET3:['a11','a12','a13','a21','a22','a23','a31','a32','a33'],INV2:['a11','a12','a21','a22'],TRANS2:['a11','a12','a21','a22'],MUL2:['a11','a12','a21','a22','b11','b12','b21','b22']}},
 VECTOR:{menu:['DOT2','DOT3','CROSS3','ADD2','ANGLE2'],fields:{DOT2:['ax','ay','bx','by'],DOT3:['ax','ay','az','bx','by','bz'],CROSS3:['ax','ay','az','bx','by','bz'],ADD2:['ax','ay','bx','by'],ANGLE2:['ax','ay','bx','by']}},
 STAT:{menu:['1VAR','1VAR5','LINEAR3'],fields:{'1VAR':['x1','x2','x3'],'1VAR5':['x1','x2','x3','x4','x5'],LINEAR3:['x1','y1','x2','y2','x3','y3']}},
 TABLE:{menu:['SINGLE','FUNCTION','DUAL'],fields:{SINGLE:['start','end','step'],FUNCTION:['f(X)','start','end','step'],DUAL:['f(X)','g(X)','start','end','step']}}
};
function decorate(s){if(!s.ui)s.ui={page:0,pending:null,setupSection:null,wizard:null,insertMode:true};if(s.ui.insertMode===undefined)s.ui.insertMode=true;if(!base.DISPLAY_STYLES.includes(s.setup.displayStyle))s.setup.displayStyle=base.DISPLAY_STYLES.includes(s.ui.displayStyle)?s.ui.displayStyle:'MathO';s.ui.displayStyle=s.setup.displayStyle;
 if(!s.ui.modeMemory)s.ui.modeMemory={matrix:{A:null,B:null,C:null},vector:{A:null,B:null,C:null},stat:{kind:'1VAR',rows:[]}};
 return s}
// Milestone 27 persistent mode-memory: plain numeric arrays only; no executable text.
function cloneCells(rows){return rows.map(row=>row.slice())}
function registerCategory(mode){return mode==='MATRIX'?'matrix':mode==='VECTOR'?'vector':null}
function ensureReg(s,category,name){let r=s.ui.modeMemory[category][name];if(!r){r=category==='matrix'?[[0,0],[0,0]]:[0,0];s.ui.modeMemory[category][name]=r}return r}
function startRegister(s){let category=registerCategory(s.mode);if(!category)return s;
 s.ui.registerFlow={category,name:null,other:'B',size:2,field:0,buffer:'',operation:null};s.view='register-menu';return s}
function regValues(flow,store){let data=ensureReg(store,flow.category,flow.name);return flow.category==='matrix'?data.flat():data.slice()}
function saveRegValue(s){let flow=s.ui.registerFlow,v=flow.buffer;if(v==='')return;
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v)||!Number.isFinite(Number(v)))throw new base.CalcError(base.ERROR.ARGUMENT);
 let data=ensureReg(s,flow.category,flow.name),n=flow.category==='matrix'?data.length:1,i=flow.field;
 if(flow.category==='matrix')data[Math.floor(i/n)][i%n]=Number(v);else data[i]=Number(v);
 flow.buffer='';}
function regExpression(s,op){let flow=s.ui.registerFlow,cat=flow.category,one=s.ui.modeMemory[cat][flow.name],two=s.ui.modeMemory[cat][flow.other];
 const matrixText=a=>a.map(row=>row.join(',')).join(';'),vectorText=a=>a.join(',');
 let unary=cat==='matrix'?['DET','INV','TRANS']:['ABS'];let binary=cat==='matrix'?['ADD','MUL']:['DOT','ADD','CROSS','ANGLE'];
 if(!unary.includes(op)&&!binary.includes(op))throw new base.CalcError(base.ERROR.ARGUMENT);
 if(!one||((!unary.includes(op))&&!two))throw new base.CalcError(base.ERROR.ARGUMENT);
 let encode=cat==='matrix'?matrixText:vectorText;
 return op+':'+encode(one)+(unary.includes(op)?'':'|'+encode(two));}
function regResult(s,op){try{let expression=regExpression(s,op),value=base.calculateExpression(s.mode,expression,s);
 s.expression=expression;s.cursor=expression.length;s.resultScrollX=0;s.mixedView=false;s.lastValue=value;s.ans=value.kind==='mode-result'?value.ans:value;s.result=base.valueDisplay(value,s.setup,s.decimalView,s.mode);s.error=null;s.view='result';s.ui.registerFlow=null;
 s.history=[{expression,display:s.result},...s.history].slice(0,50);
 s.ui.lastWizard={mode:s.mode,kind:op,fields:[],values:[],resultPage:0};}
 catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error';s.result=s.error}return s}
function editStat(s){let data=s.ui.modeMemory.stat;s.ui.statFlow={field:0,buffer:data.rows[0]?.[0]===undefined?'':String(data.rows[0][0])};s.view='stat-grid';return s}
function statFields(s){return s.ui.modeMemory.stat.rows.flat()}
function statColumns(s){const stat=s.ui.modeMemory.stat;return stat.kind==='LINEAR'||s.setup.statFrequency?2:1}
function statAccept(s){let f=s.ui.statFlow,stat=s.ui.modeMemory.stat,v=f.buffer;if(v==='')return;
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v)||!Number.isFinite(Number(v)))throw new base.CalcError(base.ERROR.ARGUMENT);
 let cols=statColumns(s),row=Math.floor(f.field/cols),col=f.field%cols;
 if(stat.kind==='1VAR'&&col===1&&(!Number.isSafeInteger(Number(v))||Number(v)<=0))throw new base.CalcError(base.ERROR.ARGUMENT);
 while(stat.rows.length<=row)stat.rows.push(stat.kind==='1VAR'&&s.setup.statFrequency?[0,1]:Array(cols).fill(0));stat.rows[row][col]=Number(v);f.buffer='';}
function statNavigate(s,step){let f=s.ui.statFlow,stat=s.ui.modeMemory.stat,cols=statColumns(s);
 statAccept(s);f.field=Math.max(0,Math.min((stat.rows.length+1)*cols-1,f.field+step));let row=Math.floor(f.field/cols),col=f.field%cols;f.buffer=stat.rows[row]?.[col]===undefined?'':String(stat.rows[row][col]);f.replaceOnInput=true}
function statResult(s){try{statAccept(s);let stat=s.ui.modeMemory.stat,rows=stat.rows;
 if(!rows.length||(stat.kind==='LINEAR'&&rows.length<2))throw new base.CalcError(base.ERROR.ARGUMENT);
 let samples=rows.map(r=>r[0]);
  if(stat.kind==='1VAR'&&s.setup.statFrequency){
   samples=[];
   for(const row of rows){
    const freq=row[1]===undefined?1:row[1];
    if(!Number.isSafeInteger(freq)||freq<=0||samples.length+freq>80)throw new base.CalcError(base.ERROR.MEM);
    for(let n=0;n<freq;n++)samples.push(row[0]);
   }
  }
  let expression=stat.kind+':'+(stat.kind==='LINEAR'?rows.map(row=>row.join(',')).join(';'):samples.join(','));
 let value=base.calculateExpression('STAT',expression,s);s.expression=expression;s.cursor=expression.length;s.resultScrollX=0;s.mixedView=false;s.lastValue=value;s.ans=value.ans;s.result=value.text;s.view='result';s.error=null;
 s.history=[{expression,display:s.result},...s.history].slice(0,50);s.ui.statFlow=null;}
 catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error';s.result=s.error}return s}

function syncInput(s){if(s.mode==='COMP'){s.document=E.fromSource(s.expression)}s.cursor=Math.min(s.expression.length,Math.max(0,s.cursor))}
function record(s,key){s.trace=[...s.trace,{key,mode:s.mode,view:s.view,expression:s.expression,result:s.result}].slice(-200);return s}
function enterWizard(s,mode){let config=wizardConfigs[mode];if(!config)return s;s.ui.wizard={mode,kind:null,fields:[],values:[],index:0,buffer:''};s.view='workflow-menu';s.menuPage=0;return s}
function selectWizard(s,i){let w=s.ui.wizard,config=wizardConfigs[w.mode],kind=config.menu[i];if(!kind||(w.mode==='TABLE'&&kind==='DUAL'&&s.model!=='c'))return s;w.kind=kind;w.fields=config.fields[kind];w.values=[];w.index=0;w.buffer='';w.resultPage=0;s.view='coefficient';s.expression='';s.cursor=0;return s}
function wizardExpression(w){const v=w.values;
 if(w.mode==='EQN'){if(w.kind==='QUAD')return 'QUAD:'+v.join(',');if(w.kind==='CUBIC')return 'CUBIC:'+v.join(',');let n=w.kind==='LINEAR2'?2:3,rows=[];for(let i=0;i<n;i++)rows.push(v.slice(i*(n+1),i*(n+1)+n).join(','));return 'LINEAR:'+rows.join(';')+'|'+Array.from({length:n},(_,i)=>v[i*(n+1)+n]).join(',')}
 if(w.mode==='MATRIX'){let n=w.kind==='DET3'?3:2,mat=x=>Array.from({length:n},(_,i)=>x.slice(i*n,i*n+n).join(',')).join(';');if(w.kind==='MUL2')return 'MUL:'+mat(v.slice(0,4))+'|'+mat(v.slice(4));return (w.kind==='INV2'?'INV':w.kind==='TRANS2'?'TRANS':'DET')+':'+mat(v)}
 if(w.mode==='VECTOR'){let n=['DOT2','ADD2','ANGLE2'].includes(w.kind)?2:3,op=w.kind==='CROSS3'?'CROSS':w.kind==='ADD2'?'ADD':w.kind==='ANGLE2'?'ANGLE':'DOT';return op+':'+v.slice(0,n).join(',')+'|'+v.slice(n).join(',')}
 if(w.mode==='STAT')return w.kind==='LINEAR3'?'LINEAR:'+Array.from({length:3},(_,i)=>v.slice(i*2,i*2+2).join(',')).join(';'):'1VAR:'+v.join(',');
 if(w.mode==='TABLE')return (w.kind==='SINGLE'?'X^2':w.kind==='DUAL'?v.slice(0,2).join(';'):v[0])+'|'+(w.kind==='SINGLE'?v.join('|'):v.slice(w.kind==='DUAL'?2:1).join('|'));
 throw new base.CalcError(base.ERROR.ARGUMENT)}
function safeNumber(t){if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))throw new base.CalcError(base.ERROR.ARGUMENT);return t}
function safeFunction(t){if(!t||t.length>96||!/^[A-Za-z0-9.+\-*/^() ]+$/.test(t))throw new base.CalcError(base.ERROR.ARGUMENT);try{base.parse(t)}catch(e){throw new base.CalcError(e.code||base.ERROR.SYNTAX)}return t}
function acceptField(w){let field=w.fields[w.index],value=/^[fg]\(X\)$/.test(field)?safeFunction(w.buffer):safeNumber(w.buffer);w.values[w.index]=value;return value}
function pushBuffer(w,k){if(k==='NEG'){w.buffer=w.buffer.startsWith('-')?w.buffer.slice(1):'-'+w.buffer;return}let map={ADD:'+',SUB:'-',MUL:'*',DIV:'/',LP:'(',RP:')',POW:'^',SQ:'^2',PI:'pi',ANS:'Ans'};if(/^[0-9.]$/.test(k)||(/^[X]$/.test(k)&&/^[fg]\(X\)$/.test(w.fields[w.index])))w.buffer+=k;else if(/^[fg]\(X\)$/.test(w.fields[w.index])&&map[k])w.buffer+=map[k]}
function finishWizard(s){let w=s.ui.wizard;try{let expression=wizardExpression(w),value=base.calculateExpression(w.mode,expression,s);s.expression=expression;s.cursor=expression.length;s.lastValue=value;s.ans=value.kind==='mode-result'?value.ans:value.kind==='complex'?value.re:value.kind==='base'?base.rat(value.value):value;s.result=base.valueDisplay(value,s.setup,s.decimalView,s.mode);s.view='result';s.error=null;s.history=[{expression,display:s.result},...s.history].slice(0,50);s.historyCursor=-1;s.ui.lastWizard={mode:w.mode,kind:w.kind,fields:[...w.fields],values:[...w.values],resultPage:0};s.ui.wizard=null}catch(e){s.error=e.code||base.ERROR.MATH;s.errorPos=s.cursor;s.view='error';s.result=s.error;s.ui.wizard=null}return s}
function formatDms(value){
 const negative=value<0?'-':'',magnitude=Math.abs(value);
 let totalSeconds=Math.round(magnitude*3600*1e7)/1e7;
 let degrees=Math.floor(totalSeconds/3600);
 totalSeconds-=degrees*3600;
 let minutes=Math.floor(totalSeconds/60);
 let seconds=Math.round((totalSeconds-minutes*60)*1e7)/1e7;
 if(seconds>=60){seconds-=60;minutes++}
 if(minutes>=60){minutes-=60;degrees++}
 return negative+degrees+'°'+minutes+'′'+seconds+'″';
}
function dispatchKey(state,key){let s=decorate({...state,ui:state.ui?structuredClone(state.ui):undefined,history:state.history.slice(),memory:{...state.memory},trace:state.trace.slice(),setup:{...state.setup}});
 const end=()=>record(s,key);
 // Persistent matrix/vector registers and editable STAT data are intentionally
 // separate from COMP scalar memory. MODE switches preserve them until reset.
 if(key==='REGS'&&registerCategory(s.mode)){startRegister(s);return end()}
 if(key==='DATA'&&s.mode==='STAT'){editStat(s);return end()}
 if(s.view==='register-menu'){
  if(key==='AC'){s.view='edit';s.ui.registerFlow=null;return end()}
  if(['1','2','3'].includes(key)){
   const f=s.ui.registerFlow;f.name=['A','B','C'][Number(key)-1];let data=ensureReg(s,f.category,f.name);f.size=f.category==='matrix'?data.length:data.length;
   f.field=0;f.buffer='';s.view='register-editor';return end()}
  return end();
 }
 if(s.view==='register-editor'){
  const f=s.ui.registerFlow;
  if(key==='AC'){s.view='register-menu';return end()}
  if(key==='OP'){try{saveRegValue(s);s.view='register-operation'}catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error'}return end()}
  if(key==='SIZE'){
   let n=f.size===2?3:2;f.size=n;f.field=0;f.buffer='';s.ui.modeMemory[f.category][f.name]=f.category==='matrix'?Array.from({length:n},()=>Array(n).fill(0)):Array(n).fill(0);return end()}
  if(key==='DEL'){f.buffer=f.buffer.slice(0,-1);return end()}
  if(key==='NEG'){f.buffer=f.buffer.startsWith('-')?f.buffer.slice(1):'-'+f.buffer;return end()}
  if(/^[0-9.]$/.test(key)){if(f.buffer.length<24)f.buffer+=key;return end()}
  if(['=','RIGHT','LEFT'].includes(key)){
   try{saveRegValue(s);let count=f.category==='matrix'?f.size*f.size:f.size;
    if(key==='LEFT')f.field=Math.max(0,f.field-1);
    else if(f.field+1<count)f.field++;
    else {s.view='register-summary';return end()}
    f.buffer='';}
   catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error'}return end()}
  return end();
 }
 if(s.view==='register-summary'){
  if(key==='AC'){s.view='edit';s.ui.registerFlow=null;return end()}
  if(key==='CLRREG'){s.ui.modeMemory[s.ui.registerFlow.category][s.ui.registerFlow.name]=null;s.view='register-menu';return end()}
  if(key==='COPY'){const f=s.ui.registerFlow,source=s.ui.modeMemory[f.category][f.name];if(source){s.ui.modeMemory[f.category][f.other]=structuredClone(source)}return end()}
  if(key==='EDIT'){s.view='register-editor';s.ui.registerFlow.field=0;s.ui.registerFlow.buffer='';return end()}
  if(key==='OP'){s.view='register-operation';return end()}
  if(key==='REGS'){s.view='register-menu';return end()}
  return end();
 }
 if(s.view==='register-operation'){
  let f=s.ui.registerFlow,ops=f.category==='matrix'?['DET','INV','TRANS','ADD','MUL']:['ABS','DOT','ADD','CROSS','ANGLE'];
  if(key==='AC'){s.view='register-summary';return end()}
  if(key==='OTHER'){f.other=f.other==='B'?'C':'B';return end()}
  if(/^[1-5]$/.test(key)){regResult(s,ops[Number(key)-1]);return end()}
  return end();
 }
 if(s.view==='stat-grid'){
  let f=s.ui.statFlow,stat=s.ui.modeMemory.stat;
  if(key==='AC'){s.view='edit';s.ui.statFlow=null;return end()}
  if(key==='PAIR'){stat.kind=stat.kind==='1VAR'?'LINEAR':'1VAR';stat.rows=[];f.field=0;f.buffer='';return end()}
  if(key==='DELROW'){stat.rows.splice(Math.floor(f.field/statColumns(s)),1);f.field=0;f.buffer=stat.rows[0]?.[0]===undefined?'':String(stat.rows[0][0]);return end()}
  if(key==='ADDROW'){try{statAccept(s);if(stat.rows.length>=80)throw new base.CalcError(base.ERROR.MEM);stat.rows.push(stat.kind==='1VAR'&&s.setup.statFrequency?[0,1]:Array(statColumns(s)).fill(0));f.field=(stat.rows.length-1)*statColumns(s);f.buffer=''}catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error'}return end()}
  if(key==='STATS'){statResult(s);return end()}
  if(key==='DEL'){f.buffer=f.buffer.slice(0,-1);f.replaceOnInput=false;return end()}
  if(key==='NEG'){f.buffer=f.buffer.startsWith('-')?f.buffer.slice(1):'-'+f.buffer;f.replaceOnInput=false;return end()}
  if(/^[0-9.]$/.test(key)){if(f.replaceOnInput){f.buffer='';f.replaceOnInput=false}if(f.buffer.length<24)f.buffer+=key;return end()}
  if(['=','RIGHT','LEFT','DOWN','UP'].includes(key)){
   try{statNavigate(s,['LEFT','UP'].includes(key)?-1:1)}catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error'}return end()}
  return end();
 }

 if(key==='ON'){s.power=true;if(s.view==='off')s.view='edit';return end()}
 if(!s.power)return end();
 // P1-07: ENG enters i, SHIFT NEG enters angle, and = evaluates CMPLX input.
 if(s.mode==='CMPLX'&&(s.view==='edit'||s.view==='result')){
  if(key==='ENG'||key==='NEG'&&s.shift){
   const symbol=key==='ENG'?'i':'∠';
   if(s.view==='result'){s.expression='';s.cursor=0}
   s.expression=s.expression.slice(0,s.cursor)+symbol+s.expression.slice(s.cursor);
   s.cursor+=symbol.length;s.view='edit';s.result='';s.shift=false;s.alpha=false;return end();
  }
  if(key==='='&&!s.expression.includes(':')){
   try{
    const Z=global.FX991_COMPLEX_INPUT;
    const z=Z.parse(s.expression,s.setup.angle);
    const value={kind:'complex',re:base.dec(z.re),im:base.dec(z.im)};
    s.lastValue=value;s.ans=value.re;s.decimalView=true;s.mixedView=false;s.resultScrollX=0;
    s.result=Z.display(z,s.setup.complexFormat||'rectangular',s.setup.angle);
    s.history=[{expression:s.expression,display:s.result},...s.history].slice(0,50);
    s.view='result';s.error=null;
   }catch(error){s.error=error.code||base.ERROR.SYNTAX;s.result=s.error;s.view='error'}
   s.shift=false;s.alpha=false;return end();
  }
 }
 // P1-06: LCD contrast editor.
 if(s.view==='contrast'){
  if(key==='AC'){s.view='edit';s.ui.setupSection=null;return end()}
  if(key==='LEFT'||key==='RIGHT'){
   const value=Number.isInteger(s.setup.contrast)?s.setup.contrast:5;
   s.setup.contrast=Math.max(0,Math.min(10,value+(key==='RIGHT'?1:-1)));
  }
  return end();
 }
 // P1-05: mode-aware secondary menus, accessible using the yellow SHIFT legends.
 if(s.view==='secondary-menu'){
  const parent=s.ui.secondaryMode;
  if(key==='AC'){s.view='edit';s.ui.secondaryMode=null;return end()}
  if(parent==='STAT'&&key==='1'){s.view='edit';s.ui.secondaryMode=null;editStat(s);return end()}
  if(parent==='STAT'&&key==='2'){s.view='edit';s.ui.secondaryMode=null;statResult(s);return end()}
  if((parent==='MATRIX'||parent==='VECTOR')&&key==='1'){
   s.view='edit';s.ui.secondaryMode=null;startRegister(s);return end();
  }
  if(parent==='BASE-N'&&['1','2','3','4','5','6'].includes(key)){
   if(key==='5'||key==='6'){
    const op=key==='5'?'NOT':'NEG',idx=s.expression.indexOf(':'),radix=idx>=0?s.expression.slice(0,idx+1):'DEC:',value=idx>=0?s.expression.slice(idx+1).trim():s.expression;
    s.expression=radix+op+'('+value+')';s.cursor=s.expression.length;s.view='edit';s.ui.secondaryMode=null;return end();
   }
   const op={1:'AND',2:'OR',3:'XOR',4:'XNOR'}[key];
   s.expression=s.expression.slice(0,s.cursor)+' '+op+' '+s.expression.slice(s.cursor);
   s.cursor=s.expression.length;s.view='edit';s.ui.secondaryMode=null;return end();
  }
  return end();
 }
 if(s.shift&&(s.view==='edit'||s.view==='result')){
  const mapped=KEYS.resolve(s.model,key,'shift',s.mode);
  const active={STAT:'STAT_MENU','BASE-N':'BASE_MENU',MATRIX:'MATRIX_MENU',VECTOR:'VECTOR_MENU'}[s.mode];
  if(active&&mapped===active){
   s.ui.secondaryMode=s.mode;s.shift=false;s.alpha=false;s.view='secondary-menu';return end();
  }
 }
 // P0-15: SHIFT 9 CLR with explicit Memory/Setup/All confirmation.
 if(s.view==='clr-menu'){
  if(key==='AC'){s.view='edit';s.ui.clearChoice=null;return end()}
  if(['1','2','3'].includes(key)){s.ui.clearChoice=key;s.view='clr-confirm';return end()}
  return end();
 }
 if(s.view==='clr-confirm'){
  if(key==='AC'){s.view='edit';s.ui.clearChoice=null;return end()}
  if(key==='='){
   const choice=s.ui.clearChoice,initial=base.createState(s.model);
   if(choice==='3')s=decorate(initial);
   else{
    if(choice==='1'){s.setup={...initial.setup};s.history=[];s.historyCursor=-1}
    if(choice==='2'){s.memory={...initial.memory};s.ans=initial.ans;s.lastValue=null;s.ui.modeMemory=decorate(initial).ui.modeMemory}
    s.view='edit';s.result='';s.error=null;s.expression='';s.cursor=0;s.document=E.create();
   }
   s.shift=false;s.alpha=false;s.ui.clearChoice=null;
  }
  return end();
 }
 // P0-17: DRG▶ postfix conversion: 1 degrees, 2 radians, 3 grads.
 if(s.view==='drg-menu'){
  if(key==='AC'){s.view='edit';s.ui.angleConversion=null;return end()}
  if(['1','2','3'].includes(key)){
   s.ui.angleConversion={sourceUnit:{1:'DEG',2:'RAD',3:'GRAD'}[key],expression:s.ui.drgSource};
   s.ui.drgSource=null;s.view='edit';s.result='';return end();
  }
  return end();
 }
 if(key==='ANS'&&s.shift&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  s.ui.drgSource=s.view==='result'?'Ans':(s.document?E.serialize(s.document):s.expression);
  s.view='drg-menu';s.shift=false;s.alpha=false;return end();
 }
 if(key==='='&&s.ui.angleConversion&&s.view==='edit'&&s.mode==='COMP'){
  const conversion=s.ui.angleConversion;
  try{
   if(!conversion.expression)throw new base.CalcError(base.ERROR.SYNTAX);
   const value=base.calculateExpression('COMP',conversion.expression,s);
   const unitRadians={DEG:Math.PI/180,RAD:1,GRAD:Math.PI/200};
   const n=base.numeric(value)*unitRadians[conversion.sourceUnit]/unitRadians[s.setup.angle];
   const result=base.dec(n);
   s.lastValue=result;s.ans=result;s.decimalView=true;s.mixedView=false;s.resultScrollX=0;
   s.result=base.valueDisplay(result,s.setup,true,s.mode);s.view='result';s.error=null;
   s.ui.drgDisplay=conversion.expression+' '+conversion.sourceUnit+'→'+s.setup.angle;
   s.history=[{expression:s.ui.drgDisplay,display:s.result},...s.history].slice(0,50);
  }catch(error){s.error=error.code||base.ERROR.MATH;s.view='error';s.result=s.error}
  s.ui.angleConversion=null;s.shift=false;s.alpha=false;return end();
 }
 if(key==='AC'){s.ui.angleConversion=null;s.ui.drgDisplay=null}
 if(key==='='&&!s.ui.angleConversion)s.ui.drgDisplay=null;
 // P0-16: two-digit constants and conversion selection from physical SHIFT keys.
 if(s.view==='reference-code'){
  const f=s.ui.referenceFlow;
  if(key==='AC'){s.ui.referenceFlow=null;s.view='edit';s.shift=false;return end()}
  if(key==='DEL'){f.digits=f.digits.slice(0,-1);return end()}
  if(/^[0-9]$/.test(key)&&f.digits.length<2){
   f.digits+=key;
   if(f.digits.length===2){
    const table=global.FX991_REFERENCE_TABLES,number=Number(f.digits);
    if(number<1||number>40){s.error=base.ERROR.ARGUMENT;s.result=s.error;s.view='error';s.ui.referenceFlow=null;return end()}
    if(f.kind==='CONST'){
     const entry=table.scientific(number);
     if(f.previousView==='result'){s.document=E.create();s.expression='';s.cursor=0}
     s.document=E.insertToken(s.document,table.asExpression(entry.value));
     s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
     s.ui.referenceFlow=null;s.view='edit';s.result='';
    }else{
     s.ui.pendingConversion=number;
     s.ui.conversionSource=s.document?E.serialize(s.document):s.expression;
     s.ui.referenceFlow=null;s.view='edit';s.result='';
    }
   }
  }
  return end();
 }
 if(s.shift&&['7','8'].includes(key)&&(s.view==='edit'||s.view==='result')&&s.mode==='COMP'){
  s.ui.referenceFlow={kind:key==='7'?'CONST':'CONV',digits:'',previousView:s.view};
  s.shift=false;s.alpha=false;s.view='reference-code';return end();
 }
 // Conversion suffix applies after the expression is evaluated.
 if(key==='='&&s.ui.pendingConversion&&s.mode==='COMP'&&s.view==='edit'){
  const code=s.ui.pendingConversion,source=s.ui.conversionSource;
  try{
   if(!source)throw new base.CalcError(base.ERROR.SYNTAX);
   const value=base.calculateExpression('COMP',source,s);
   const item=global.FX991_REFERENCE_TABLES.conversion(code);
   const converted=item.apply(base.numeric(value));
   if(!Number.isFinite(converted))throw new base.CalcError(base.ERROR.MATH);
   const result=base.dec(converted);
   s.lastValue=result;s.ans=result;s.decimalView=true;s.mixedView=false;s.resultScrollX=0;
   s.result=base.valueDisplay(result,s.setup,true,s.mode);s.view='result';s.error=null;
   s.ui.conversionDisplay=source+' '+item.from+'→'+item.to;
   s.history=[{expression:s.ui.conversionDisplay,display:s.result},...s.history].slice(0,50);
  }catch(error){s.error=error.code||base.ERROR.MATH;s.view='error';s.result=s.error}
  s.ui.pendingConversion=null;s.ui.conversionSource=null;s.shift=false;s.alpha=false;return end();
 }
 if(key==='AC'){s.ui.pendingConversion=null;s.ui.conversionSource=null;s.ui.conversionDisplay=null}
 if(s.ui.conversionDisplay&&key!=='ENG'&&key!=='S-D'&&key!=='='&&s.view==='result')s.ui.conversionDisplay=null;
 if(key==='='&&!s.ui.pendingConversion)s.ui.conversionDisplay=null;
 if(key==='9'&&s.shift&&(s.view==='edit'||s.view==='result')){
  s.view='clr-menu';s.ui.clearChoice=null;s.shift=false;s.alpha=false;return end();
 }
 if(key==='SHIFT'&&s.view==='hyp-menu'){
  s.ui.hypMenu.inverse=!s.ui.hypMenu.inverse;s.shift=false;return end();
 }
 if(key==='SHIFT'){s.shift=!s.shift;s.alpha=false;return end()}
 if(key==='ALPHA'){s.alpha=!s.alpha;s.shift=false;return end()}
 if(key==='AC'&&s.shift){s.power=false;s.view='off';s.shift=false;return end()}
 // Printed INS alternate: SHIFT+DEL toggles between insert and overwrite.
 // The state is independent of the structural cursor position.
 if((key==='DEL'&&s.shift)||key==='INS'){
  s.ui.insertMode=!s.ui.insertMode;s.shift=false;s.alpha=false;return end();
 }
 // ALPHA is one-shot and resolves printed letter legends before evaluation.
 // Explicit A-F/M/X/Y keys remain available for teacher-mode input.
 if(s.alpha&&!['mode','setup','coefficient','register-prompt','workflow-menu'].includes(s.view)){
  let letter=KEYS.resolve(s.model,key,'alpha');
  if(letter){key=letter;s.alpha=false}
 }
 // In TABLE function-entry fields, ALPHA+LP is a physical-key route to X.
 if(s.alpha&&s.view==='coefficient'&&s.ui.wizard&&/^[fg]\(X\)$/.test(s.ui.wizard.fields[s.ui.wizard.index])){
  let letter=KEYS.resolve(s.model,key,'alpha');
  if(letter){key=letter;s.alpha=false}
 }
 // Resolve mode-specific physical legends before the generic expression editor.
 // The MODE/SETUP/coefficient/register screens keep precedence over expression entry.
 if(s.view==='edit'||s.view==='result'){
  if(s.mode==='BASE-N'&&!s.shift&&!s.alpha){
   const command=KEYS.resolve(s.model,key,'none','BASE-N');
   if(['BIN','OCT','DEC','HEX'].includes(command)){
    const suffix=s.expression.replace(/^(?:BIN|OCT|DEC|HEX):/,'');
    s.expression=command+':'+suffix;s.cursor=s.expression.length;
    s.result='';s.view='edit';s.document=E.fromSource('');
    return end();
   }
   if(command!==key){key=command}
  }
  if(s.shift){
   let action=KEYS.resolve(s.model,key,'shift',s.mode);
   if(action==='MIX'){key=s.view==='edit'?'MIXIN':'MIX';s.shift=false;s.alpha=false}
   if(action==='NROOT'){key='NROOT';s.shift=false;s.alpha=false}
   if(action==='CUBE'||action==='POW10'||action==='EXP'){
    let value={CUBE:'^3',POW10:'10^(',EXP:'exp('}[action];
    if(s.mode==='COMP'&&s.document){
     if(s.view==='result')s.document=E.create();
     if(action==='POW10'){s.document=E.insertToken(s.document,'10');s.document=E.template(s.document,'Power')}
     else if(action==='EXP')s.document=E.template(s.document,'Function','exp');
     else s.document=E.insertToken(s.document,value);
     s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
    }else{
     if(s.view==='result'){s.expression='';s.cursor=0}
     s.expression=s.expression.slice(0,s.cursor)+value+s.expression.slice(s.cursor);s.cursor+=value.length;
    }
    s.shift=false;s.alpha=false;s.result='';s.view='edit';return end();
   }
  }
 }

 // P0-18: ALPHA CALC enters a true equation equality separator.
 if(key==='EQUALITY'&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  if(s.view==='result'){s.document=E.create();s.expression='';s.cursor=0}
  const source=E.serialize(s.document);
  if(!source.includes('=')){
   s.document=E.insertToken(s.document,'=');
   s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
   s.view='edit';s.result='';s.error=null;
  }
  s.shift=false;s.alpha=false;return end();
 }
 // COMP-only CALC substitution / SHIFT+CALC numerical SOLVE.
 // Educational behavior; no physical CASIO observations have been claimed.
 // Sequential CALC variable prompts; source expression remains unchanged.
 if(s.view==='calc-input'){
  const f=s.ui.calcFlow;
  if(key==='AC'){s.ui.calcFlow=null;s.view='edit';s.error=null;s.result='';return end()}
  if(key==='DEL'){f.buffer=f.buffer.slice(0,-1);return end()}
  // P1-01: allow editing earlier variables and resuming a multi-variable run.
  // Moving right accepts the present field; '=' retains its original
  // confirmation behavior, including final evaluation.
  if(key==='LEFT'&&f.index>0){
   f.buffers=f.buffers||{};
   f.buffers[f.variables[f.index]]=f.buffer;
   f.index--;f.buffer=f.buffers[f.variables[f.index]]||'';
   return end();
  }
  if(key==='RIGHT'&&f.index+1<f.variables.length){
   f.buffers=f.buffers||{};
   const name=f.variables[f.index];
   if(f.buffer&&!/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(f.buffer)){
    s.error=base.ERROR.ARGUMENT;s.result=s.error;s.view='error';s.ui.calcFlow=null;return end();
   }
   const n=f.buffer?Number(f.buffer):null;
   if(n!==null&&!Number.isFinite(n)){s.error=base.ERROR.ARGUMENT;s.result=s.error;s.view='error';s.ui.calcFlow=null;return end()}
   f.values[name]=n===null?(s.memory[name]||base.rat(0n)):base.dec(n);
   f.buffers[name]=f.buffer;f.index++;f.buffer=f.buffers[f.variables[f.index]]||'';
   return end();
  }
  if(key==='NEG'||(key==='SUB'&&!f.buffer)){f.buffer=f.buffer.startsWith('-')?f.buffer.slice(1):'-'+f.buffer;return end()}
  if(/^[0-9.]$/.test(key)){if(f.buffer.length<24&&!(key==='.'&&f.buffer.includes('.')))f.buffer+=key;return end()}
  if(key==='='){
   try{
    const name=f.variables[f.index];
    let given;
    if(!f.buffer)given=s.memory[name]||base.rat(0);
    else{
     if(!/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(f.buffer))throw new base.CalcError(base.ERROR.ARGUMENT);
     const n=Number(f.buffer);if(!Number.isFinite(n))throw new base.CalcError(base.ERROR.ARGUMENT);
     given=base.dec(n);
    }
    if(f.index+1<f.variables.length){
     f.values[name]=given;f.buffers=f.buffers||{};f.buffers[name]=f.buffer;
     f.index++;f.buffer=f.buffers[f.variables[f.index]]||'';return end();
    }
    let value;
    if(f.operation==='SOLVE'){
     const num=global.FX991_NUM;if(!num)throw new base.CalcError(base.ERROR.UNSUPPORTED);
     const equation=f.source.includes('=')?('('+f.source.split('=')[0]+')-('+f.source.split('=')[1]+')'):f.source;
     const source=f.target==='Y'?equation.replace(/Y/g,'X'):equation;
     const withParameters={...s.memory,...f.values,X:f.target==='X'?given:s.memory.X};
     const output=num.run({...s,memory:withParameters},'SOLVE',source,{guess:base.numeric(given)});
     value=output.value;Object.assign(s.memory,f.values);s.memory[f.target]=value;
     s.numericalDetails={...output.metadata,variable:f.target,originalEquation:f.source,parameters:Object.fromEntries(Object.entries(f.values).map(([k,v])=>[k,base.numeric(v)])),leftMinusRight:output.metadata.residual};
     s.decimalView=true;
    }else{
     const inputs={...f.values,[name]:given};
     value=base.evaluate(base.parse(f.source),{setup:s.setup,ans:s.ans,memory:{...s.memory,...inputs}});
     Object.assign(s.memory,inputs);s.decimalView=false;
     s.numericalDetails={operation:'CALC',source:f.source,variables:Object.fromEntries(Object.entries(inputs).map(([n,v])=>[n,base.numeric(v)]))};
    }
    s.ans=value;s.lastValue=value;s.mixedView=false;s.resultScrollX=0;
    s.result=base.valueDisplay(value,s.setup,s.decimalView,s.mode);
    s.history=[{expression:f.operation+'('+f.source+')',display:s.result},...s.history].slice(0,50);
    s.historyCursor=-1;s.view='result';s.error=null;
   }catch(error){s.error=error.code||base.ERROR.MATH;s.result=s.error;s.view='error';s.errorPos=s.cursor}
   s.ui.calcFlow=null;return end();
  }
  return end();
 }
 if(key==='CALC'&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  const source=s.document?E.serialize(s.document):s.expression;
  let variables=[];
  try{variables=[...new Set(base.tokenize(source).map(t=>t.value).filter(v=>/^[A-FMXY]$/.test(v)))]}
  catch(error){s.shift=false;s.alpha=false;return end()}
  const operation=s.shift?'SOLVE':'CALC';
  const target=variables.includes('X')?'X':variables.includes('Y')?'Y':null;
  if(!variables.length||(operation==='SOLVE'&&!target)){s.shift=false;s.alpha=false;return end()}
  if(source.includes('=')&&(operation!=='SOLVE'||source.split('=').length!==2||source.startsWith('=')||source.endsWith('='))){s.shift=false;s.alpha=false;s.error=base.ERROR.SYNTAX;s.result=s.error;s.view='error';return end()}
  s.ui.calcFlow={operation,source,target:operation==='SOLVE'?target:null,variables:operation==='SOLVE'?[...variables.filter(v=>v!==target),target]:variables,index:0,buffer:'',buffers:{},values:{}};
  s.shift=false;s.alpha=false;s.view='calc-input';s.error=null;return end();
 }

 // COMP numerical calculus uses the shared AST and bounded numerical engine.
 // This guided input is educational; it does not certify physical CASIO behavior.
 if(s.view==='numerical-input'&&s.ui.numericalFlow){
  const f=s.ui.numericalFlow;
  // Accept decimal or scientific input, never nonfinite or incomplete exponent values.
  const parseNumber=text=>{
   if(!/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:e[+-]?[0-9]+)?$/.test(text))
    throw new base.CalcError(base.ERROR.ARGUMENT);
   const number=Number(text);
   if(!Number.isFinite(number))throw new base.CalcError(base.ERROR.ARGUMENT);
   return number;
  };
  const current=()=>f.fields[f.index];
   if(current()==='expression'){
    if(key==='AC'){s.ui.numericalFlow=null;s.view='edit';s.result='';s.error=null;return end()}
    if(key==='DEL'){f.buffer=f.buffer.slice(0,-1);return end()}
    const mapping={ADD:'+',SUB:'-',NEG:'-',MUL:'*',DIV:'/',LP:'(',RP:')',POW:'^',SQ:'^2',SIN:'sin(',COS:'cos(',TAN:'tan(',SQRT:'sqrt(',LOG:'log(',LN:'ln(',PI:'pi'};
    const addition=/^[0-9.XY]$/.test(key)?key:mapping[key];
    if(addition!==undefined){if(f.buffer.length+addition.length<=96)f.buffer+=addition;return end()}
    if(key==='='||key==='RIGHT'){
     try{
      if(!f.buffer||!base.tokenize(f.buffer).some(x=>x.value==='X'))throw new base.CalcError(base.ERROR.ARGUMENT);
      base.parse(f.buffer);
      f.source=f.buffer;f.buffers.expression=f.buffer;f.index=1;f.buffer=f.buffers[current()]||'';
     }catch(error){s.error=error.code||base.ERROR.SYNTAX;s.result=s.error;s.view='error';s.ui.numericalFlow=null}
     return end();
    }
    return end();
   }
  if(key==='AC'){s.ui.numericalFlow=null;s.view='edit';s.result='';s.error=null;return end()}
  if(key==='DEL'){f.buffer=f.buffer.slice(0,-1);return end()}
  if(key==='LEFT'&&f.index>0){
   f.buffers[current()]=f.buffer;
   f.index--;f.buffer=f.buffers[current()]||'';
   return end();
  }
  if(key==='NEG'||(key==='SUB'&&!f.buffer)){
   const e=f.buffer.indexOf('e');
   if(e>=0){
    const mantissa=f.buffer.slice(0,e+1),exponent=f.buffer.slice(e+1);
    f.buffer=mantissa+(exponent.startsWith('-')?exponent.slice(1):'-'+exponent.replace(/^\+/,''));
   }else f.buffer=f.buffer.startsWith('-')?f.buffer.slice(1):'-'+f.buffer;
   return end();
  }
  if(key==='ADD'&&/e-?$/.test(f.buffer)){
   f.buffer=f.buffer.replace(/e[-+]?$/,'e+');
   return end();
  }
  if(key==='EXP10'&&!f.buffer.includes('e')&&/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(f.buffer)){
   f.buffer+='e';return end();
  }
  if(/^[0-9.]$/.test(key)){
   const mantissa=f.buffer.split('e')[0];
   if(f.buffer.length<24&&!(key==='.'&&(f.buffer.includes('e')||mantissa.includes('.'))))
    f.buffer+=key;
   return end();
  }
  if(key==='='||(key==='RIGHT'&&f.index+1<f.fields.length)){
   try{
    const number=parseNumber(f.buffer);
    const parameter=current();
    if(f.index+1<f.fields.length){
     f.values[parameter]=number;f.buffers[parameter]=f.buffer;
     f.index++;f.buffer=f.buffers[current()]||'';
     return end();
    }
    if(key!=='=')return end();
    const parameters={...f.values,[parameter]:number};
    const numerical=global.FX991_NUM;
    if(!numerical)throw new base.CalcError(base.ERROR.UNSUPPORTED);
    const output=numerical.run(s,f.operation,f.source,parameters);
    const value=output.value;
    s.lastValue=value;s.ans=value;s.decimalView=true;s.mixedView=false;s.resultScrollX=0;
    s.result=base.valueDisplay(value,s.setup,true,s.mode);
    s.numericalDetails=output.metadata;
    s.history=[{expression:f.operation+'('+f.source+')',display:s.result},...s.history].slice(0,50);
    s.historyCursor=-1;s.view='result';s.error=null;
   }catch(error){
    s.error=error.code||base.ERROR.MATH;s.result=s.error;s.errorPos=s.cursor;s.view='error';
    s.numericalDetails={operation:f.operation,error:s.error,reason:error.numericalReason||'evaluation_error',diagnostic:error.numericalDetails||null};
   }
   s.ui.numericalFlow=null;return end();
  }
  return end();
 }
 if(key==='DIFF'&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  const source=s.document?E.serialize(s.document):s.expression;
  try{if(source)base.tokenize(source)}catch(error){s.shift=false;s.alpha=false;return end()}
  const operation=s.shift?'INTEGRAL':'DIFF';
  const empty=!source;
  s.ui.numericalFlow={operation,source,fields:empty?(operation==='DIFF'?['expression','at']:['expression','lower','upper']):(operation==='DIFF'?['at']:['lower','upper']),
   index:0,buffer:'',buffers:{},values:{}};
  s.shift=false;s.alpha=false;s.view='numerical-input';s.error=null;
  return end();
 }
 // Inverse trigonometric keys use the underlying structural template engine.

 // SHIFT + MODE enters a hierarchical SETUP menu. Direct setting keys are
 // also accepted to keep the prior controller and reference traces stable.
 if(key==='MODE'&&s.shift){s.shift=false;s.alpha=false;s.view='setup';s.ui.setupSection=null;s.ui.setupPage=0;return end()}
 if(s.view==='setup'){
  if(key==='AC'){s.view='edit';s.ui.setupSection=null;s.ui.setupPage=0;return end()}
  if(s.ui.setupSection){
   if(['CMPLX','STAT','Disp'].includes(s.ui.setupSection)&&['1','2'].includes(key)){
    if(s.ui.setupSection==='CMPLX')s.setup.complexFormat=key==='1'?'rectangular':'polar';
    if(s.ui.setupSection==='STAT')s.setup.statFrequency=key==='1';
    if(s.ui.setupSection==='Disp')s.setup.decimalPoint=key==='1'?'Dot':'Comma';
    s.ui.setupSection=null;s.view='edit';return end();
   }
   if(s.ui.setupSection==='Fix'||s.ui.setupSection==='Sci'){
    if(/^[0-9]$/.test(key)){s.setup.format=s.ui.setupSection;s.setup.digits=Number(key);s.ui.setupSection=null;s.view='edit'}return end()
   }
   if(s.ui.setupSection==='Norm'&&['1','2'].includes(key)){
    s.setup.format=key==='1'?'Norm1':'Norm2';s.ui.setupSection=null;s.view='edit';return end()
   }
   if(s.ui.setupSection==='MthIO'&&['1','2'].includes(key)){
    // Record the preferred output layout; exact firmware raster/output is unverified.
    s.ui.displayStyle=key==='1'?'MathO':'LineO';s.setup.displayStyle=s.ui.displayStyle;s.ui.setupSection=null;s.view='edit';return end()
   }
   return end();
  }
  if(key==='UP'||key==='DOWN'){s.ui.setupPage=key==='DOWN'?1:0;return end()}
  if(s.ui.setupPage===1){
   if(key==='1'||key==='2'){s.setup.fractionStyle=key==='1'?'mixed':'improper';s.view='edit';return end()}
   if(['3','4','5'].includes(key)){s.ui.setupSection={3:'CMPLX',4:'STAT',5:'Disp'}[key];return end()}
   if(key==='6'){s.ui.setupSection='Contrast';s.view='contrast';return end()}
   return end();
  }
  if(key==='1'){s.ui.setupSection='MthIO';return end()}
  if(key==='2'){s.ui.displayStyle='LineIO';s.setup.displayStyle='LineIO';s.view='edit';return end()}
  if(['3','4','5'].includes(key)){s.setup.angle={3:'DEG',4:'RAD',5:'GRAD'}[key];s.view='edit';return end()}
  if(key==='6'||key==='7'){s.ui.setupSection=key==='6'?'Fix':'Sci';return end()}
  if(key==='8'){s.ui.setupSection='Norm';return end()}
  return end();
 }
 // Existing MODE menu dispatch remains the source of truth for descriptors.
 if(s.view==='mode'){
  const next=base.dispatchKey(s,key);s=decorate(next);
  if(next.view==='edit'&&next.mode!==state.mode)enterWizard(s,next.mode);
  return s;
 }
 if(key==='MODE'){s=decorate(base.dispatchKey(s,key));return s}
 if(s.view==='workflow-menu'){
  if(key==='AC'){s.ui.wizard=null;s.view='edit';return end()}
  if(key==='UP'||key==='DOWN'){s.menuPage=Math.max(0,Math.min(2,s.menuPage+(key==='DOWN'?1:-1)));return end()}
  if(/^[1-9]$/.test(key)){selectWizard(s,s.menuPage*4+Number(key)-1);return end()}
  return end();
 }
 if(s.view==='coefficient'){
  let w=s.ui.wizard;
  // EQN: move back to the first coefficient of the preceding equation row.
  if(key==='UP'&&w.mode==='EQN'&&w.index>0){
   if(w.buffer){try{acceptField(w)}catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error';return end()}}
   const width=w.kind==='LINEAR3'?4:w.kind==='LINEAR2'?3:1;
   w.index=Math.max(0,w.index-width);w.buffer=w.values[w.index]||'';return end();
  }
  if(key==='AC'){w.buffer='';return end()}
  if(key==='DEL'){w.buffer=w.buffer.slice(0,-1);return end()}
  if(key==='LEFT'&&w.index>0){if(w.buffer){try{acceptField(w)}catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error';return end()}}w.index--;w.buffer=w.values[w.index]||'';return end()}
  if(key==='RIGHT'&&w.index<w.fields.length-1){if(w.buffer){try{acceptField(w)}catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.view='error';return end()}}w.index++;w.buffer=w.values[w.index]||'';return end()}
  if(key==='='||key==='DOWN'){
   try{acceptField(w);if(w.index+1===w.fields.length)return endAfter(finishWizard(s),key);w.index++;w.buffer=w.values[w.index]||''}catch(e){s.error=e.code||base.ERROR.ARGUMENT;s.errorPos=s.cursor;s.view='error'}return end()
  }
  pushBuffer(w,key);
  return end();
 }
 if(s.view==='result'&&s.ui.lastWizard?.mode==='EQN'&&key==='EDIT'){
  const last=s.ui.lastWizard;
  s.ui.wizard={mode:'EQN',kind:last.kind,fields:[...last.fields],values:[...last.values],index:0,buffer:last.values[0]||'',resultPage:0};
  s.ui.lastWizard=null;s.view='coefficient';s.result='';s.error=null;return end();
 }
 if(s.view==='result'&&s.ui.lastWizard&&['UP','DOWN'].includes(key)){let w=s.ui.lastWizard;let pages=s.lastValue?.data?.rows||s.lastValue?.data?.roots;if(Array.isArray(pages)&&pages.length){w.resultPage=Math.max(0,Math.min(pages.length-1,w.resultPage+(key==='DOWN'?1:-1)));return end()}}
 if(s.view==='register-prompt'){
  if(key==='AC'){s.ui.pending=null;s.view='edit';return end()}
  if(s.alpha){const letter=KEYS.resolve(s.model,key,'alpha');if(letter){key=letter;s.alpha=false}}
  if(/^[A-FMXY]$/.test(key)){
   if(s.ui.pending==='STO')s.memory[key]=s.lastValue||s.ans;
   else {s.expression=s.expression.slice(0,s.cursor)+key+s.expression.slice(s.cursor);s.cursor++;syncInput(s)}
   s.ui.pending=null;s.shift=false;s.alpha=false;s.view='edit';return end()
  }return end();
 }
 if(s.view==='error'&&['LEFT','RIGHT'].includes(key)){
  s.view='edit';
  if(s.mode==='COMP'&&s.document){
   s.document=E.seekSource(s.document,s.errorPos);
   s.expression=E.serialize(s.document);
   s.cursor=E.sourceCursor(s.document);
  }else s.cursor=Math.max(0,Math.min(s.expression.length,s.errorPos));
  s.error=null;return end()
 }
 if(key==='RCL'&&s.shift){s.shift=false;s.ui.pending='STO';s.view='register-prompt';return end()}
 if(key==='RCL'&&s.alpha){s.alpha=false;s.ui.pending='RCL';s.view='register-prompt';return end()}
 if(key==='RCL_MENU'&&!s.shift&&(s.view==='edit'||s.view==='result')){s.ui.pending='RCL';s.view='register-prompt';return end()}
 if(key==='FDEL'&&s.view==='edit'&&s.mode==='COMP'&&s.document){
  s.document=E.delForward(s.document);s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.result='';return end();
 }
 if(s.ui.insertMode===false&&s.view==='edit'&&s.mode==='COMP'&&s.document&&/^[0-9.]$/.test(key)){
  s.document=E.overwriteToken(s.document,key);s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.result='';s.shift=false;s.alpha=false;return end();
 }
 // P0-07: physical modifier keys for permutations and combinations.
 if(s.shift&&['MUL','DIV'].includes(key)&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  const operator=key==='MUL'?'nPr':'nCr';
  if(s.view==='result'){s.document=E.fromSource('Ans');s.expression='Ans';s.cursor=3}
  const prefix=s.document?E.serialize(s.document).slice(0,E.sourceCursor(s.document)):'';
  if(/[0-9A-FMXY)!]$/.test(prefix)||prefix.endsWith('Ans')){
   s.document=E.insertToken(s.document,operator);
   s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
   s.view='edit';s.result='';s.error=null;
  }
  s.shift=false;s.alpha=false;return end();
 }
 // P0-06: SHIFT + reciprocal enters postfix factorial.
 if(key==='RECIP'&&s.shift&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  if(s.view==='result'){s.document=E.fromSource('Ans');s.expression='Ans';s.cursor=3}
  const prefix=s.document?E.serialize(s.document).slice(0,E.sourceCursor(s.document)):'';
  if(/[0-9A-FMXY)!]$/.test(prefix)||prefix.endsWith('Ans')){
   s.document=E.insertToken(s.document,'!');
   s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
   s.view='edit';s.result='';s.error=null;
  }
  s.shift=false;s.alpha=false;return end();
 }
 // P0-02: reciprocal of the preceding operand, not the entire sum.
 if(key==='RECIP'&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  if(s.view==='result'){s.document=E.fromSource('Ans');s.expression='Ans';s.cursor=3}
  const prefix=s.document?E.serialize(s.document).slice(0,E.sourceCursor(s.document)):'';
  if(/[0-9A-FMXY)!]$/.test(prefix)||prefix.endsWith('Ans')){
   s.document=E.insertToken(s.document,'^(-1)');
   s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
   s.view='edit';s.result='';s.error=null;s.shift=false;s.alpha=false;
  }
  return end();
 }
 // P1-04: polar and rectangular coordinate conversion through SHIFT +/-.
 if(s.view==='coordinate-input'){
  const f=s.ui.coordinateFlow;
  if(key==='AC'){s.ui.coordinateFlow=null;s.view='edit';s.result='';return end()}
  if(key==='DEL'){f.buffer=f.buffer.slice(0,-1);return end()}
  if(key==='NEG'||key==='SUB'&&!f.buffer){f.buffer=f.buffer.startsWith('-')?f.buffer.slice(1):'-'+f.buffer;return end()}
  if(/^[0-9.]$/.test(key)){if(f.buffer.length<24&&!(key==='.'&&f.buffer.includes('.')))f.buffer+=key;return end()}
  if(key==='='||key==='RIGHT'){
   if(!/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(f.buffer)){
    s.error=base.ERROR.ARGUMENT;s.result=s.error;s.view='error';s.ui.coordinateFlow=null;return end();
   }
   f.values[f.index]=Number(f.buffer);
   if(!Number.isFinite(f.values[f.index])){s.error=base.ERROR.ARGUMENT;s.result=s.error;s.view='error';s.ui.coordinateFlow=null;return end()}
   if(f.index===0){f.index=1;f.buffer='';return end()}
   const [a,b]=f.values,angle=s.setup.angle==='DEG'?180/Math.PI:s.setup.angle==='GRAD'?200/Math.PI:1;
   const x=f.kind==='POL'?Math.hypot(a,b):a*Math.cos(b/angle);
   const y=f.kind==='POL'?Math.atan2(b,a)*angle:a*Math.sin(b/angle);
   try{
    const outX=base.dec(Math.abs(x)<1e-13?0:x),outY=base.dec(Math.abs(y)<1e-13?0:y);
    s.memory.X=outX;s.memory.Y=outY;s.lastValue=outX;s.ans=outX;s.decimalView=true;
    s.result=base.valueDisplay(outX,s.setup,true,'COMP')+', '+base.valueDisplay(outY,s.setup,true,'COMP');
    s.ui.coordinateDisplay=f.kind+'('+a+','+b+')';
    s.history=[{expression:s.ui.coordinateDisplay,display:s.result},...s.history].slice(0,50);
    s.view='result';s.error=null;
   }catch(error){s.error=error.code||base.ERROR.MATH;s.result=s.error;s.view='error'}
   s.ui.coordinateFlow=null;return end();
  }
  return end();
 }
 if(s.shift&&['ADD','SUB'].includes(key)&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  s.ui.coordinateFlow={kind:key==='ADD'?'POL':'RECT',index:0,values:[],buffer:''};
  s.view='coordinate-input';s.shift=false;s.alpha=false;return end();
 }
 // P0-14: independent M memory handles M+ and SHIFT M−.
 if(key==='MPLUS'&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  try{
   let value;
   if(s.view==='result'&&s.lastValue)value=s.lastValue;
   else{
    const expression=s.document?E.serialize(s.document):s.expression;
    if(!expression||E.invalidSlots(s.document).length)throw new base.CalcError(base.ERROR.SYNTAX);
    value=base.calculateExpression('COMP',expression,s);
   }
   s.memory.M=s.shift?base.sub(s.memory.M||base.rat(0n),value):base.add(s.memory.M||base.rat(0n),value);
   s.ans=value;s.lastValue=value;s.mixedView=false;s.decimalView=false;s.result=base.valueDisplay(value,s.setup,false,s.mode);s.resultScrollX=0;
   s.view='result';s.error=null;s.ui.engExponent=null;
   s.history=[{expression:s.expression,display:s.result},...s.history].slice(0,50);
  }catch(error){s.error=error.code||base.ERROR.MATH;s.view='error';s.result=s.error;s.errorPos=s.cursor}
  s.shift=false;s.alpha=false;return end();
 }
 // P0-13: ENG shifts only the displayed notation, never the stored value.
 if(key==='ENG'&&s.mode==='COMP'&&s.view==='result'&&s.lastValue){
  const value=base.numeric(s.lastValue),reverse=s.shift;
  if(Number.isFinite(value)){
   const initial=value===0?0:Math.floor(Math.log10(Math.abs(value))/3)*3;
   const previous=Number.isInteger(s.ui.engExponent)?s.ui.engExponent:null;
   const exponent=previous===null?(reverse?initial+3:initial):previous+(reverse?3:-3);
   if(exponent>=-99&&exponent<=99){
    s.ui.engExponent=exponent;
    const mantissa=value/Math.pow(10,exponent);
    s.result=Number(mantissa.toPrecision(12)).toString()+'×10^'+exponent;
    s.resultScrollX=0;
   }
  }
  s.shift=false;s.alpha=false;return end();
 }
 if(key==='='||key==='AC')s.ui.engExponent=null;
 // P0-12: log-base and finite summation use multi-slot natural input.
 if(key==='LOGBASE'&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  const name=s.shift?'Sigma':'logbase';
  if(s.view==='result'){s.document=E.create();s.expression='';s.cursor=0}
  s.document=E.template(s.document,'MultiFunction',name);
  s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.view='edit';s.result='';s.error=null;s.shift=false;s.alpha=false;return end();
 }
 // P0-03: °′″ enters sexagesimal fields; on a result it toggles DMS/decimal.
 // P0-05: SHIFT+hyp inserts absolute value, not the hyperbolic menu.
 if(key==='HYP'&&s.shift&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  if(s.view==='result'){s.document=E.create();s.expression='';s.cursor=0}
  s.document=E.template(s.document,'Function','abs');
  s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.shift=false;s.alpha=false;s.view='edit';s.result='';s.error=null;return end();
 }
 // P0-04: the physical hyp key opens six hyperbolic function choices.
 // They do not use the DEG/RAD/GRAD angle setting.
 if(s.view==='hyp-menu'){
  if(key==='AC'){s.view='edit';s.ui.hypMenu=null;return end()}
  if(key==='SHIFT'){s.ui.hypMenu.inverse=!s.ui.hypMenu.inverse;return end()}
  const functions=['sinh','cosh','tanh','asinh','acosh','atanh'];
  let idx=/^[1-6]$/.test(key)?Number(key)-1:
   ['SIN','COS','TAN'].includes(key)?
    ['SIN','COS','TAN'].indexOf(key)+(s.ui.hypMenu.inverse?3:0):-1;
  if(idx>=0){
   const name=functions[idx];
   if(s.ui.hypMenu.previousView==='result'){s.document=E.create();s.expression='';s.cursor=0}
   s.document=E.template(s.document,'Function',name);
   s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
   s.view='edit';s.result='';s.error=null;s.shift=false;s.alpha=false;s.ui.hypMenu=null;
  }
  return end();
 }
 if(key==='HYP'&&!s.shift&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  s.ui.hypMenu={inverse:false,previousView:s.view};s.view='hyp-menu';s.alpha=false;
  return end();
 }
 if(key==='DMS'&&s.mode==='COMP'){
  if(s.view==='result'&&s.lastValue){
   const x=base.numeric(s.lastValue);
   if(!Number.isFinite(x)||Math.abs(x)>=10000000){
    s.error=base.ERROR.MATH;s.result=s.error;s.view='error';return end();
   }
   s.ui.dmsResult=!s.ui.dmsResult;
   if(s.ui.dmsResult)s.result=formatDms(x);
   else s.result=base.valueDisplay(s.lastValue,s.setup,true,s.mode);
   s.resultScrollX=0;return end();
  }
  if(s.view==='edit'){
   const before=s.document?E.serialize(s.document).slice(0,E.sourceCursor(s.document)):'';
   if(/[0-9]$/.test(before)){
    s.document=E.insertToken(s.document,'°');
    s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
    s.result='';s.error=null;s.shift=false;s.alpha=false;
   }
   return end();
  }
 }
 // P0-10: SHIFT period enters Ran#; ALPHA period enters RanInt#.
 if(((key==='.'&&s.shift)||key==='RANINT')&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  const integer=key==='RANINT';
  if(s.view==='result'){s.document=E.create();s.expression='';s.cursor=0}
  s.document=integer?E.template(s.document,'Function','RanInt#'):E.insertToken(s.document,'Ran#');
  s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.view='edit';s.result='';s.error=null;s.shift=false;s.alpha=false;return end();
 }
 if(key==='RP'&&s.shift&&s.mode==='COMP'&&s.view==='edit'&&s.document){
  s.document=E.insertToken(s.document,',');
  s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.shift=false;s.alpha=false;s.result='';return end();
 }
 // P0-09: SHIFT+0 inserts the mathematical Rnd() function.
 if(key==='0'&&s.shift&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  if(s.view==='result'){s.document=E.create();s.expression='';s.cursor=0}
  s.document=E.template(s.document,'Function','Rnd');
  s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.view='edit';s.result='';s.error=null;s.shift=false;s.alpha=false;return end();
 }
 // P0-08: SHIFT ×10^x enters pi; ALPHA ×10^x enters Euler's constant.
 if(((key==='EXP10'&&s.shift)||key==='EULER')&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  const value=key==='EULER'?'e':'pi';
  if(s.view==='result'){s.document=E.create();s.expression='';s.cursor=0}
  s.document=E.insertToken(s.document,value);
  s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
  s.view='edit';s.result='';s.error=null;s.shift=false;s.alpha=false;return end();
 }
 // Educational EXP10 key: enter a power-of-ten template after a coefficient.
 // This is mathematically equivalent to coefficient × 10^exponent, but does
 // not claim exact physical CASIO keypress/raster behavior.
 if(key==='EXP10'&&s.mode==='COMP'&&(s.view==='edit'||s.view==='result')){
  if(s.view==='result'){s.document=E.create();s.expression='';s.cursor=0}
  if(s.document){
   const before=E.serialize(s.document).slice(0,E.sourceCursor(s.document));
   // A coefficient (digit or closing group) must precede ×10^.
   if(/[0-9)]$/.test(before)){
    s.document=E.insertToken(s.document,'*10');
    s.document=E.template(s.document,'Power');
    s.expression=E.serialize(s.document);s.cursor=E.sourceCursor(s.document);
    s.view='edit';s.result='';s.shift=false;s.alpha=false;
   }
  }
  return end();
 }
 // Support explicit RCL/STO keys for existing prototypes and tests.
 // A physical layout can use SHIFT+RCL for STO standby.
 s=decorate(base.dispatchKey(s,key));
 if(key==='='&&s.mode==='COMP'&&s.view==='result'&&s.setup.fractionStyle==='mixed'){
  const mixed=s.lastValue?base.mixedFractionText(s.lastValue):null;
  if(mixed){s.result=mixed;s.mixedView=true}
 }
 if(key==='='&&s.mode==='COMP'&&s.view==='result'){
  s.ui.dmsResult=s.expression.includes('°');
  if(s.ui.dmsResult){
   s.result=formatDms(base.numeric(s.lastValue));
   if(s.history?.length)s.history[0].display=s.result;
  }
 }
 return s;
}
function endAfter(s,key){return s} // finishWizard records current dispatch event exactly once
function semanticScreen(s){if(!s.ui)return base.semanticScreen(s);let screen=base.semanticScreen(s);
 if(s.view==='result'&&Number.isInteger(s.ui.engExponent))screen.resultValue=null;
 if(s.view==='mode'){
  let modes=base.modeList(s);
  screen.menuItems=s.menuPage===0?modes.slice(0,8).map((name,i)=>(i+1)+':'+name):modes.slice(8).map((name,i)=>(i+1)+':'+name);
  screen.menuPage=s.menuPage;
  screen.hasMore=s.menuPage===0&&modes.length>8;
 }if(s.view==='workflow-menu'){let w=s.ui.wizard,choices=wizardConfigs[w.mode].menu;screen.result=choices.slice(s.menuPage*4,s.menuPage*4+4).map((c,i)=>(i+s.menuPage*4+1)+':'+c).join(' ');screen.expression='SELECT '+w.mode}
 if(s.view==='coefficient'){let w=s.ui.wizard;screen.expression=(w.mode==='EQN'?w.kind+' ':'')+w.fields[w.index]+' = '+w.buffer;screen.result=(w.index+1)+'/'+w.fields.length+(w.mode==='EQN'?'  LEFT/RIGHT: fields':'')}
 if(s.view==='result'&&s.ui.lastWizard){let w=s.ui.lastWizard,rows=s.lastValue?.data?.rows||s.lastValue?.data?.roots;if(Array.isArray(rows)&&rows.length){let index=w.resultPage||0;screen.expression=w.mode+' '+(index+1)+'/'+rows.length;screen.result=Array.isArray(rows[index])?rows[index].join(', '):String(rows[index])}}
 if(s.view==='register-menu'){screen.expression=s.mode+' REGISTERS';screen.result='1:A 2:B 3:C'}
 if(['register-editor','register-summary','register-operation'].includes(s.view)){
  let f=s.ui.registerFlow,reg=s.ui.modeMemory[f.category][f.name],count=f.category==='matrix'?reg.length*reg.length:reg.length;
  if(s.view==='register-editor'){screen.expression=(f.category==='matrix'?'Mat':'Vct')+f.name+' '+(f.field+1)+'/'+count;screen.result=f.buffer||String(regValues(f,s)[f.field]);}
  else if(s.view==='register-summary'){screen.expression=(f.category==='matrix'?'Mat':'Vct')+f.name+' SAVED';screen.result='OP EDIT REGS';}
  else{screen.expression=(f.category==='matrix'?'MATRIX':'VECTOR')+' OP';screen.result=f.category==='matrix'?'1:DET 2:INV 3:T 4:+ 5:*':'1:ABS 2:DOT 3:+ 4:X 5:ANGLE';}
 }
 if(s.view==='stat-grid'){let f=s.ui.statFlow,stat=s.ui.modeMemory.stat;screen.expression=stat.kind+' '+(stat.kind==='1VAR'&&s.setup.statFrequency?'X/FREQ':'DATA')+' '+(f.field+1);screen.result=f.buffer||'0';}
 if(s.view==='calc-input'&&s.ui.calcFlow){const f=s.ui.calcFlow,n=f.variables[f.index];screen.expression=f.operation+' '+f.source;screen.result=n+'? '+(f.buffer||'['+base.valueToString(s.memory[n]||base.rat(0))+']')+' ('+(f.index+1)+'/'+f.variables.length+')';screen.menuItems=null}
 if(s.view==='numerical-input'&&s.ui.numericalFlow){
  const f=s.ui.numericalFlow,parameter=f.fields[f.index],label=parameter==='expression'?'f(X)':parameter==='at'?'X':parameter==='lower'?'Lower':'Upper';
  screen.expression=(f.operation==='DIFF'?'d/dx':'INTEGRAL')+' '+(f.source||'f(X)');
  screen.result=label+'? '+(f.buffer||'_')+' ('+(f.index+1)+'/'+f.fields.length+')';
  screen.menuItems=null;
 }
 if(s.view==='hyp-menu'){screen.expression='HYP';screen.result='1:sinh 2:cosh 3:tanh 4:asinh 5:acosh 6:atanh';screen.menuItems=null}
 if(s.view==='register-prompt'){screen.expression=s.ui.pending+' REG';screen.result='A-F M X Y'}
 if(s.view==='coordinate-input'){const f=s.ui.coordinateFlow;screen.expression=f.kind==='POL'?'Pol(X,Y)':'Rec(r,θ)';screen.result=(f.index===0?(f.kind==='POL'?'X':'r'):(f.kind==='POL'?'Y':'θ'))+'? '+(f.buffer||'_');screen.menuItems=null}
 if(s.view==='result'&&s.ui.coordinateDisplay){screen.expression=s.ui.coordinateDisplay;screen.resultValue=null}
 if(s.view==='secondary-menu'){
  const m=s.ui.secondaryMode;screen.expression=m+' MENU';screen.result=m==='STAT'?'1:Data 2:Calc':m==='BASE-N'?'1:AND 2:OR 3:XOR 4:XNOR 5:NOT 6:NEG':'1:Registers';screen.menuItems=screen.result.split(' ')
 }
 if(s.view==='drg-menu'){screen.expression='DRG▶';screen.result='1:° 2:r 3:g';screen.menuItems=['1:Deg','2:Rad','3:Grad']}
 if(s.view==='result'&&s.ui.drgDisplay){screen.expression=s.ui.drgDisplay;screen.resultValue=null}
 if(s.view==='reference-code'){screen.expression=s.ui.referenceFlow.kind==='CONST'?'CONSTANT':'CONVERSION';screen.result='Number 01~40? '+(s.ui.referenceFlow.digits||'__');screen.menuItems=null}
 if(s.ui.pendingConversion&&s.view==='edit'){screen.result='CONV '+String(s.ui.pendingConversion).padStart(2,'0')+'  = to compute'}
 if(s.view==='result'&&s.ui.conversionDisplay){screen.expression=s.ui.conversionDisplay;screen.resultValue=null}
 if(s.view==='clr-menu'){screen.expression='CLR';screen.result='1:Setup 2:Memory 3:All';screen.menuItems=['1:Setup','2:Memory','3:All']}
 if(s.view==='clr-confirm'){screen.expression='CLR '+({1:'Setup',2:'Memory',3:'All'}[s.ui.clearChoice]||'');screen.result='Reset? =:Yes AC:No';screen.menuItems=null}
 if(s.ui.insertMode===false)screen.indicators=[...screen.indicators,'OVR'];
 if(s.view==='result'&&s.mode==='CMPLX')screen.resultValue=null;
 if(s.view==='contrast'){screen.expression='CONTRAST';screen.result='LIGHT ◀ '+(s.setup.contrast??5)+'/10 ▶ DARK';screen.menuItems=null}
 if(s.view==='result'&&s.setup.decimalPoint==='Comma')screen.result=screen.result.replace(/, /g,'; ').replace(/(\d)\.(\d)/g,'$1,$2');
 if(s.view==='setup'){
  const section=s.ui.setupSection;
  screen.expression='SETUP';
  screen.result=section==='MthIO'?'1:MathO 2:LineO':section==='Norm'?'1:Norm1 2:Norm2':section==='CMPLX'?'1:a+bi 2:r∠θ':section==='STAT'?'1:FREQ ON 2:OFF':section==='Disp'?'1:Dot 2:Comma':section==='Fix'||section==='Sci'?section+' 0-9':s.ui.setupPage===1?'1:ab/c 2:d/c 3:CMPLX 4:STAT 5:Disp 6:CONT':'1:MthIO 2:LineIO 3:Deg 4:Rad 5:Gra 6:Fix 7:Sci 8:Norm';
  screen.menuItems=section?null:s.ui.setupPage===1?['1:ab/c','2:d/c','3:CMPLX','4:STAT','5:Disp','6:CONT']:['1:MthIO','2:LineIO','3:Deg','4:Rad','5:Gra','6:Fix','7:Sci','8:Norm'];
  screen.menuPage=s.ui.setupPage||0;
 }
 return screen}
function runTrace(test){let s=createState(test.model||'standard');for(let k of test.events)s=dispatchKey(s,k);let screen=semanticScreen(s),pixels=base.rasterizeScreen(screen);return {state:s,screen,pixels,hash:base.frameHash(pixels)}}
function createState(model='standard'){return decorate(base.createState(model))}
global.FX991=Object.freeze({...base,createState,dispatchKey,semanticScreen,runTrace});
})(typeof window!=='undefined'?window:globalThis);
