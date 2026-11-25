/* Time arithmetic and reporting. Missing plans stay missing; actual time is never estimated. */
(function(root){
 const seconds=e=>Number.isFinite(e?.seconds)&&e.seconds>=0?Math.floor(e.seconds):Number.isFinite(e?.minutes)&&e.minutes>=0?Math.round(e.minutes*60):0;
 const validSegment=s=>s&&Number.isFinite(s.from)&&Number.isFinite(s.to)&&s.to>=s.from;
 function elapsed(t,now=Date.now()){if(!t)return 0;return (t.segments||[]).filter(validSegment).reduce((n,s)=>n+s.to-s.from,0)+(t.status==='running'&&Number.isFinite(t.segmentStart)?Math.max(0,Math.min(now,t.deadline||Infinity)-t.segmentStart):0)}
 function pause(t,now=Date.now()){if(t.status!=='running')return {...t};const until=Math.max(t.segmentStart,Math.min(now,t.deadline||Infinity));return {...t,status:'paused',segmentStart:null,segments:[...(t.segments||[]),{from:t.segmentStart,to:until}]}}
 function resume(t,now=Date.now()){return t.status==='running'?{...t}:{...t,status:'running',segmentStart:now}}
 const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function split(t,now=Date.now()){
  const closed=pause(t,now),buckets={};
  for(const s of (closed.segments||[]).filter(validSegment)){let cursor=s.from;while(cursor<s.to){const d=new Date(cursor),midnight=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime(),end=Math.min(s.to,midnight);if(end<=cursor)break;const key=day(d);buckets[key]=(buckets[key]||0)+end-cursor;cursor=end}}
  const dates=Object.keys(buckets).sort(),target=Math.floor(Object.values(buckets).reduce((n,v)=>n+v,0)/1000);let used=0;
  return dates.map((date,i)=>{const value=i===dates.length-1?target-used:Math.floor(buckets[date]/1000);used+=value;return {date,seconds:value}}).filter(r=>r.seconds>0);
 }
 const belongs=(row,scope)=>scope==='all'||(scope==='professional'?row.workspaceId!=='personal':row.workspaceId===scope);
 function entries(state,from,to,scope='all'){return (state.timeEntries||[]).filter(e=>e.date>=from&&e.date<=to&&belongs(e,scope))}
 function matches(entry,plan){if(plan.taskId)return entry.taskId===plan.taskId;if(plan.projectId)return entry.projectId===plan.projectId;return entry.workspaceId===plan.workspaceId}
 function overlap(a,b,state){if(a.week!==b.week)return false;const project=id=>state.tasks.find(t=>t.id===id)?.projectId||'';const ap=a.projectId||project(a.taskId),bp=b.projectId||project(b.taskId);if(a.taskId&&b.taskId)return a.taskId===b.taskId;if(a.taskId||b.taskId){const task=a.taskId?a:b,other=a.taskId?b:a;return other.projectId?project(task.taskId)===other.projectId:task.workspaceId===other.workspaceId}if(ap&&bp)return ap===bp;return a.workspaceId===b.workspaceId}
 function rows(state,from,to,scope='all',group='workspace'){
  const totals=new Map();for(const e of entries(state,from,to,scope)){const id=group==='task'?(e.taskId||'without-task'):group==='project'?(e.projectId||'without-project'):(e.workspaceId||'unassigned');const old=totals.get(id)||{id,seconds:0,count:0};old.seconds+=seconds(e);old.count++;totals.set(id,old)}return [...totals.values()].sort((a,b)=>b.seconds-a.seconds);
 }
 function comparison(state,week,from,to,scope='all'){
  const actual=entries(state,from,to,scope),plans=(state.timePlans||[]).filter(p=>p.week===week&&belongs(p,scope));return plans.map(p=>({...p,plannedSeconds:p.minutes*60,actualSeconds:actual.filter(e=>matches(e,p)).reduce((n,e)=>n+seconds(e),0)}));
 }
 const api={seconds,elapsed,pause,resume,split,belongs,entries,matches,overlap,rows,comparison};if(typeof module!=='undefined')module.exports=api;else root.TimeModel=api;
})(typeof window!=='undefined'?window:globalThis);
