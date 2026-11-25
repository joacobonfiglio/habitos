/* Scope is explicit. Old projects are preserved and left unassigned. */
(function(root){
 const defaults=()=>[
  {id:'personal',name:'Personal',short:'P',color:'#356b5c'},
  {id:'traka',name:'Traka',short:'T',color:'#bd5839'},
  {id:'aquabon',name:'Aquabon',short:'A',color:'#2b77ae'},
  {id:'constitucion',name:'Tintorería Constitución',short:'C',color:'#7856a1'},
  {id:'otros',name:'Otros proyectos',short:'O',color:'#686d7d'}];
 function spaces(state){const own=Array.isArray(state.workspaces)?state.workspaces:[];return [...defaults(),...own.filter(w=>w&&typeof w.id==='string'&&typeof w.name==='string'&&!defaults().some(d=>d.id===w.id))]}
 function projectSpace(state,p){const id=p?.workspaceId;return spaces(state).some(w=>w.id===id)?id:'unassigned'}
 function taskSpace(state,t){const p=state.projects.find(p=>p.id===t.projectId);if(p)return projectSpace(state,p);return spaces(state).some(w=>w.id===t.workspaceId)?t.workspaceId:'unassigned'}
 function scopeTasks(state,id){return state.tasks.filter(t=>id==='all'||(id==='professional'?taskSpace(state,t)!=='personal':taskSpace(state,t)===id))}
 function scopeProjects(state,id){return state.projects.filter(p=>id==='all'||(id==='professional'?projectSpace(state,p)!=='personal':projectSpace(state,p)===id))}
 function minutes(state,id,from,until){return (state.timeEntries||[]).filter(e=>e.date>=from&&e.date<=until&&(id==='all'||(id==='professional'?e.workspaceId!=='personal':e.workspaceId===id))).reduce((n,e)=>n+(Number.isFinite(e.minutes)&&e.minutes>0?e.minutes:0),0)}
 function summary(state,id,from,until,today){const tasks=scopeTasks(state,id),projects=scopeProjects(state,id);return {active:projects.filter(p=>p.status==='Activo').length,pending:tasks.filter(t=>t.status!=='Hecha').length,overdue:tasks.filter(t=>t.status!=='Hecha'&&t.deadline&&t.deadline<today).length,done:tasks.filter(t=>t.status==='Hecha'&&t.doneDate>=from&&t.doneDate<=until).length,minutes:minutes(state,id,from,until)}}
 const api={defaults,spaces,projectSpace,taskSpace,scopeTasks,scopeProjects,minutes,summary};if(typeof module!=='undefined')module.exports=api;else root.SpaceModel=api;
})(typeof window!=='undefined'?window:globalThis);
