/* Physical key-to-controller translation.
 * Route is deliberately small: modifier meaning stays in state-machine.js.
 * Keep RCL_MENU for a plain RCL click, but dispatch the physical RCL
 * for SHIFT/ALPHA so the controller can apply the current modifier.
 */
(function(global){'use strict';
function route(key,state){
 if(key==='RCL'&&!state?.shift&&!state?.alpha)return 'RCL_MENU';
 return key;
}
global.FX991_KEY_INPUT=Object.freeze({route});
})(typeof window!=='undefined'?window:globalThis);
