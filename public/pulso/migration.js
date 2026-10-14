/* Lossless LifeOS -> Pulso migration. Original records stay in legacyBackup. */
(function(root){
function convert(input, defaults){
 const src=input?.data||input;
 if(!src||!Array.isArray(src.habits)||!Array.isArray(src.metrics))throw new Error('Archivo no válido');
 const S=defaults(),D={};
 S.legacyBackup=JSON.parse(JSON.stringify(src));S.migration={from:'LifeOS',at:new Date().toISOString(),counts:Object.fromEntries(Object.entries(src).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]))};
 const rows=k=>src[k]||[];
 const day=d=>D[d]||(D[d]={});
 const area=n=>{if(!n)return S.areas[0].id;let a=S.areas.find(a=>a.name===n);if(!a){a={id:'legacy-area-'+S.areas.length,name:n,color:'#545DC7'};S.areas.push(a)}return a.id};
 const tag=n=>{let t=S.tags.find(t=>t.name===n);if(!t){t={id:'legacy-tag-'+S.tags.length,name:n};S.tags.push(t)}return t.id};
 const status=v=>({done:'Hecha',completed:'Hecha',doing:'En curso',in_progress:'En curso',blocked:'Bloqueada'}[v]||'Pendiente');
 const scale=(v,max)=>v==null?null:Math.max(1,Math.min(5,Math.round(Number(v)*5/max)));
 S.habits=rows('habits').map(h=>({...h,type:'bool',target:1,unit:'',freq:{kind:'daily'},area:area(h.category),identity:h.detail||'',created:h.createdAt||'2000-01-01'}));
 for(const p of rows('programs'))S.habits.push({...p,id:'program-'+p.id,name:p.title,type:'bool',target:1,unit:'',freq:{kind:'daily'},area:area('Retos'),identity:p.description||'',created:p.startDate||'2000-01-01',end:p.startDate&&p.durationDays?new Date(new Date(p.startDate+'T12:00:00Z').getTime()+(p.durationDays-1)*864e5).toISOString().slice(0,10):''});
 for(const l of rows('habitLogs')){const d=day(l.date);d.habits=d.habits||{};d.habits[l.habitId]=!!l.done}
 for(const l of rows('programLogs')){const d=day(l.date);d.habits=d.habits||{};d.habits['program-'+l.programId]=!!l.completed}
 for(const m of rows('metrics')){const d=day(m.date);d.ci={energy:scale(m.energy,10),mood:scale(m.mood,5),stress:scale(m.stress,10),sleepQ:scale(m.sleepQuality,100),sleepH:m.sleepHours};d.body={weight:m.weight,train:m.exerciseMinutes?{type:'Otro',min:m.exerciseMinutes}:null,food:scale(m.nutritionQuality,4)};d.tags=(m.contextTags||[]).map(tag);if(m.daySatisfaction!=null)d.close={score:m.daySatisfaction};d.legacyMetric=m}
 for(const j of rows('journals')){const d=day(j.date);d.mind={...d.mind,journal:[j.title,j.content].filter(Boolean).join('\n\n')};d.close={...d.close,line:j.win||'',lesson:j.learning||''};if(j.tomorrow)d.priorities=[j.tomorrow]}
 for(const g of rows('gratitudes')){const d=day(g.date);d.mind={...d.mind,gratitude:[d.mind?.gratitude,g.text].filter(Boolean).join('\n')}}
 for(const f of rows('focusSessions')){const d=day(f.date);d.mind={...d.mind,focusMin:(d.mind?.focusMin||0)+(f.completed?Number(f.minutes)||0:0)}}
 S.projects=rows('projects').map(p=>({...p,name:p.title,area:area(p.area),goalId:'',status:{completed:'Completado',done:'Completado',paused:'Pausado'}[p.status]||'Activo',start:p.startDate||'',deadline:p.dueDate||'',desc:p.description||''}));
 const seen=new Set();
 S.tasks=[...rows('projectTasks'),...rows('planTasks')].filter(t=>{if(seen.has(t.id))return false;seen.add(t.id);return true}).map(t=>({...t,title:t.title,projectId:t.projectId||'',goalId:t.goalId||'',deadline:t.dueDate||'',date:t.scheduledDate||'',status:status(t.status),doneDate:status(t.status)==='Hecha'?(t.completedAt||t.endDate||t.scheduledDate||'').slice(0,10):null,effort:!t.estimatedMinutes?'S':t.estimatedMinutes<=15?'XS':t.estimatedMinutes<=30?'S':t.estimatedMinutes<=60?'M':t.estimatedMinutes<=120?'L':'XL',importance:typeof t.importance==='number'?t.importance:({high:5,medium:3,low:1}[t.importance||t.priority]||3),notes:t.description||'',created:t.createdAt||'2000-01-01',postponed:0,subtasks:[],tags:''}));
 S.goals=rows('planGoals').map(g=>({...g,level:{year:'Anual',quarter:'Trimestral',month:'Mensual',week:'Mensual'}[g.scope]||'Mensual',parentId:g.parentGoalId||'',area:area('Objetivos'),mode:'tasks',target:0,current:0,start:g.period?.length===7?g.period+'-01':g.period?.length===4?g.period+'-01-01':'2000-01-01',end:g.targetDate||'2099-12-31'}));
 S.bucket=rows('bucketItems').map(b=>({...b,cat:{Viaje:'Viajes',Viajes:'Viajes',Crecimiento:'Aprendizaje',Experiencia:'Experiencias',Aprendizaje:'Aprendizaje',Deporte:'Retos físicos',Reto:'Retos físicos'}[b.category]||'Experiencias',status:{completed:'Cumplido',planned:'Planificado',in_progress:'En marcha',inProgress:'En marcha'}[b.status]||'Soñado',challenge:3,cost:b.estimatedCost||'',target:b.targetDate||'',doneDate:b.completedAt||'',reflection:b.description||''}));
 S.lessons=rows('notes').map(n=>({id:n.id,text:[n.title,n.content].filter(Boolean).join('\n\n'),date:n.createdAt?.slice(0,10)||new Date().toISOString().slice(0,10),src:n.category||'Notas de LifeOS'}));
 return {S,D};
}
const api={convert};if(typeof module!=='undefined')module.exports=api;else root.PulsoMigration=api;
})(typeof window!=='undefined'?window:globalThis);
