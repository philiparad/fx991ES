/* P1-07: limited physical CMPLX expression evaluator. No eval/Function.
 * Supported: real numbers, i, rectangular/polar input, + - * /, parentheses.
 * Additional CASIO functions, templates and exact radical parity are pending.
 */
(function(global){'use strict';
const bad=()=>{throw new global.FX991.CalcError(global.FX991.ERROR.SYNTAX)};
const make=(re,im=0)=>{if(!Number.isFinite(re)||!Number.isFinite(im))throw new global.FX991.CalcError(global.FX991.ERROR.MATH);return {re,im}};
const add=(a,b)=>make(a.re+b.re,a.im+b.im);
const neg=a=>make(-a.re,-a.im);
const mul=(a,b)=>make(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const div=(a,b)=>{const d=b.re*b.re+b.im*b.im;if(!d)throw new global.FX991.CalcError(global.FX991.ERROR.MATH);return make((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d)};
function parse(source,angle='DEG'){
 const s=String(source).replace(/\s/g,'');const re=/\d+(?:\.\d*)?|\.\d+|i|[()+\-*/∠]/gy;
 const t=[];let p=0;while(p<s.length){re.lastIndex=p;const match=re.exec(s);if(!match)bad();t.push(match[0]);p=re.lastIndex}
 if(!t.length)bad();let at=0;
 const peek=()=>t[at],take=c=>{if(peek()===c){at++;return true}return false};
 const required=c=>{if(!take(c))bad()};
 function atom(){
  if(take('(')){let z=sum();required(')');return z}
  if(take('i'))return make(0,1);
  const v=peek();if(v&&/^(?:\d|\.)/.test(v)){at++;return make(Number(v))}
  bad();
 }
 function unary(){if(take('-'))return neg(unary());if(take('+'))return unary();return atom()}
 function product(){
  let a=unary();while(true){
   if(take('∠')){const theta=unary();if(theta.im!==0)bad();const factor=angle==='DEG'?Math.PI/180:angle==='GRAD'?Math.PI/200:1;const rad=theta.re*factor;if(a.im!==0)bad();a=make(a.re*Math.cos(rad),a.re*Math.sin(rad));continue}
   if(take('*')){a=mul(a,unary());continue}
   if(take('/')){a=div(a,unary());continue}
   if(peek()==='i'||peek()==='('){a=mul(a,unary());continue}
   break;
  }return a;
 }
 function sum(){let a=product();while(peek()==='+'||peek()==='-'){let op=t[at++],b=product();a=op==='+'?add(a,b):add(a,neg(b))}return a}
 const result=sum();if(at!==t.length)bad();return result;
}
function textNumber(x){if(Math.abs(x)<1e-12)x=0;return Number(x.toPrecision(11)).toString()}
function display(z,format='rectangular',angle='DEG'){
 if(format==='polar'){let a=Math.atan2(z.im,z.re);a*=angle==='DEG'?180/Math.PI:angle==='GRAD'?200/Math.PI:1;return textNumber(Math.hypot(z.re,z.im))+'∠'+textNumber(a)}
 const r=textNumber(z.re),i=textNumber(Math.abs(z.im)),absIm=Math.abs(z.im)<1e-12;
 if(absIm)return r;
 const part=(i==='1'?'':i)+'i';
 return (Math.abs(z.re)<1e-12?'':r)+(z.im<0?'-':Math.abs(z.re)<1e-12?'':'+')+part;
}
global.FX991_COMPLEX_INPUT=Object.freeze({parse,display});
})(typeof window!=='undefined'?window:globalThis);
