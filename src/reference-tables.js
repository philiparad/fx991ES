/* P0-16 — independent teaching-table implementation.
 * Conversion codes follow the CASIO fx-991ES PLUS 2nd edition manual, pp.43-44.
 * Scientific numeric constants use CODATA 2014 rounded reference values;
 * exact last-digit device equivalence still requires emulator observations.
 */
(function(global){'use strict';
const constants=Object.freeze([
null,
['mp',1.672621898e-27],['mn',1.674927471e-27],
['me',9.10938356e-31],['mμ',1.883531594e-28],
['a0',5.2917721067e-11],['h',6.626070040e-34],
['μN',5.050783699e-27],['μB',9.274009994e-24],
['ħ',1.054571800e-34],['α',7.2973525664e-3],
['re',2.8179403227e-15],['λC',2.4263102367e-12],
['γp',2.675221900e8],['λCp',1.32140985396e-15],
['λCn',1.31959090481e-15],['R∞',10973731.568508],
['u',1.660539040e-27],['μp',1.4106067873e-26],
['μe',-9.284764620e-24],['μn',-9.662365023e-27],
['μμ',-4.49044826e-26],['F',96485.33289],
['e',1.6021766208e-19],['NA',6.022140857e23],
['k',1.38064852e-23],['Vm',0.022710947],
['R',8.3144598],['C0',299792458],
['C1',3.741771790e-16],['C2',1.43877736e-2],
['σ',5.670367e-8],['ε0',8.854187817e-12],
['μ0',1.2566370614e-6],['Φ0',2.067833831e-15],
['g',9.80665],['G0',7.748091731e-5],
['Z0',376.730313461],['t',273.15],
['G',6.67408e-11],['atm',101325]
].map(x=>x&&Object.freeze(x)));
const pairs=[
['in','cm',2.54],['ft','m',0.3048],['yd','m',0.9144],
['mile','km',1.609344],['n mile','m',1852],['acre','m²',4046.8564224],
['gal(US)','L',3.785411784],['gal(UK)','L',4.54609],
['pc','km',3.085677581491367e13],['km/h','m/s',1/3.6],
['oz','g',28.34952],['lb','kg',0.45359237],
['atm','Pa',101325],['mmHg','Pa',133.322387415],
['hp','kW',0.7456998715822702],['kgf/cm²','Pa',98066.5],
['kgf·m','J',9.80665],['lbf/in²','kPa',6.894757293168],
['°F','°C',null],['J','cal',1/4.1855]
];
const conversions=[null];
for(let i=0;i<pairs.length;i++){
 const [from,to,factor]=pairs[i];
 if(i===18){
  conversions.push(Object.freeze({from,to,apply:x=>(x-32)*5/9}));
  conversions.push(Object.freeze({from:to,to:from,apply:x=>x*9/5+32}));
 }else{
  conversions.push(Object.freeze({from,to,apply:x=>x*factor}));
  conversions.push(Object.freeze({from:to,to:from,apply:x=>x/factor}));
 }
}
function scientific(code){const item=constants[Number(code)];if(!item)throw Error('Invalid constant code');return {name:item[0],value:item[1]}}
function conversion(code){const item=conversions[Number(code)];if(!item)throw Error('Invalid conversion code');return item}
function asExpression(value){
 const parts=Number(value).toExponential(12).split('e');
 const exponent=Number(parts[1]);
 return exponent===0?parts[0]:'('+parts[0]+'*10^('+exponent+'))';
}
global.FX991_REFERENCE_TABLES=Object.freeze({constants,conversions,scientific,conversion,asExpression});
})(typeof window!=='undefined'?window:globalThis);
