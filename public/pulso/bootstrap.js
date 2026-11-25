"use strict";
/* ================= arranque ================= */
function initialize(o){
 store.key=o.key||LS;store.status=o.status||"Solo en este dispositivo";store.mode=o.connected?"cuenta":"local";
 if(o.state?.S){S=migrate(o.state.S);D=o.state.D||{}}
 else if(o.legacy?.habits&&o.legacy?.metrics){const converted=PulsoMigration.convert(o.legacy,defaults);S=converted.S;D=converted.D;commitAll()}
 if(!S){S=defaults();D={}}
 restoreFocus();
 render();
 if(parent!==window)accountAction("pulso:phone-read");
}
if(parent!==window){
 let ready=false;
 window.addEventListener("message",e=>{
  if(e.origin!==location.origin||e.source!==parent)return;
  if(e.data?.type==="pulso:request-ready"){parent.postMessage({type:"pulso:ready"},location.origin)}
  if((e.data?.type==="pulso:init"&&!ready)||e.data?.type==="pulso:replace"){ready=true;initialize(e.data)}
  if(e.data?.type==="pulso:status"){store.status=e.data.status;store.mode=e.data.connected?"cuenta":"local";const el=document.getElementById("cloud-status");if(el)el.textContent=store.status}
 });
 parent.postMessage({type:"pulso:ready"},location.origin);
}else{
 let state=null,legacy=null;try{state=JSON.parse(localStorage.getItem(LS)||"null");legacy=JSON.parse(localStorage.getItem("lifeos-private-v2")||"null")}catch(e){}
 initialize({state,legacy});
}
