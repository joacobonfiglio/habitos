"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BatteryCharging, Check, ChevronRight, Dumbbell,
  Footprints, Gauge, HeartPulse, Moon, Plus, RotateCcw, Scale, Sparkles,
  Target, TrendingUp, Zap, X, PlayCircle, Info
} from "lucide-react";
import "./health.css";

type Habit = { id:string; name:string; detail?:string; category?:string; color?:string; active:boolean };
type HabitLog = { id:string; habitId:string; date:string; done:boolean; notes?:string };
type Metric = {
  id:string; date:string; weight:number|null; mood:number|null; energy:number|null;
  sleepHours:number|null; sleepQuality:number|null; stress:number|null;
  exerciseMinutes:number|null; activeCalories:number|null; screenTimeHours:number|null;
  productivity:number|null; daySatisfaction:number|null; nutritionQuality:number|null;
  socialConnection:number|null; wakeFeeling:number|null; contextTags:string[]; notes:string;
};
type LifeData = { habits:Habit[]; habitLogs:HabitLog[]; metrics:Metric[]; [key:string]:unknown };

type WellbeingCheck = {
  date:string; fatigue:number; soreness:number; energy:number; stress:number;
};
type ExerciseEntry = {
  id:string; name:string; sets:number; reps:string; targetRir:number;
  result:number|null; unit:"reps"|"sec"; progression:string; completed:boolean;
};
type StrengthSession = {
  id:string; date:string; name:string; readiness:number; duration:number;
  exercises:ExerciseEntry[]; completed:boolean;
};
type WalkLog = { id:string; date:string; minutes:number; completed:boolean };
type HealthState = {
  checks:WellbeingCheck[];
  strengthSessions:StrengthSession[];
  walks:WalkLog[];
};

const LIFE_KEY = "lifeos-private-v2";
const HEALTH_KEY = "lifeos-health-v1";

const emptyLife:LifeData = { habits:[], habitLogs:[], metrics:[] };
const emptyHealth:HealthState = { checks:[], strengthSessions:[], walks:[] };

type ExerciseGuide = {
  focus:string;
  steps:string[];
  mistakes:string[];
  easier:string;
  harder:string;
};

const exerciseGuides:Record<string,ExerciseGuide> = {
  "Sentadilla tempo":{
    focus:"Piernas, glúteos, core y control del movimiento.",
    steps:["Pies al ancho de los hombros.","Bajá en 3 segundos manteniendo el pecho erguido.","Pausa 1 segundo abajo.","Subí empujando el suelo con todo el pie."],
    mistakes:["Levantar los talones.","Juntar las rodillas hacia adentro.","Caer rápido sin control."],
    easier:"Sentadilla a una silla.",
    harder:"Sentadilla tempo con pausa más larga o sentadilla a una pierna asistida."
  },
  "Flexiones":{
    focus:"Pecho, hombros, tríceps y core.",
    steps:["Manos apenas más abiertas que los hombros.","Cuerpo alineado de cabeza a pies.","Bajá controlado acercando el pecho al suelo.","Empujá sin hundir la cadera."],
    mistakes:["Abrir demasiado los codos.","Hundir la cadera.","Acortar demasiado el recorrido."],
    easier:"Flexiones inclinadas sobre mesa o banco.",
    harder:"Flexiones declinadas o con tempo lento."
  },
  "Zancadas alternas":{
    focus:"Piernas, glúteos, equilibrio y estabilidad.",
    steps:["Da un paso suficientemente largo.","Bajá ambas rodillas con control.","Mantené el torso erguido.","Empujá con la pierna delantera y alterná."],
    mistakes:["Paso demasiado corto.","Rodilla hacia adentro.","Inclinar demasiado el tronco."],
    easier:"Zancada estática.",
    harder:"Walking lunges o pausa abajo."
  },
  "Puente de glúteos a una pierna":{
    focus:"Glúteos, isquiosurales y estabilidad de cadera.",
    steps:["Acostate boca arriba con un pie apoyado.","Extendé la otra pierna.","Elevá la cadera empujando con el talón.","Pausa arriba y bajá controlado."],
    mistakes:["Arquear la zona lumbar.","Rotar la pelvis.","No extender completamente la cadera."],
    easier:"Puente con las dos piernas.",
    harder:"Pausa más larga o tempo lento."
  },
  "Plancha frontal":{
    focus:"Core, hombros y estabilidad.",
    steps:["Apoyá antebrazos y puntas de los pies.","Alineá cabeza, cadera y tobillos.","Contraé abdomen y glúteos.","Respirá sin perder posición."],
    mistakes:["Hundir la cadera.","Elevar demasiado la cadera.","Tensar el cuello."],
    easier:"Plancha con rodillas apoyadas.",
    harder:"Plancha con toques de hombro o apoyo reducido."
  },
  "Burpees":{
    focus:"Capacidad cardiovascular, piernas, brazos y coordinación.",
    steps:["Desde pie, bajá y apoyá las manos.","Llevá los pies atrás.","Volvé con los pies al frente.","Levantate y saltá de forma controlada."],
    mistakes:["Ir demasiado rápido y perder técnica.","Dejar caer la zona lumbar.","No controlar la recepción."],
    easier:"Sin flexión y sin salto.",
    harder:"Burpee completo con flexión y salto."
  },
  "Pike push-ups":{
    focus:"Hombros, tríceps y parte alta del pecho.",
    steps:["Formá una V invertida con el cuerpo.","Cargá peso sobre las manos.","Llevá la cabeza hacia el suelo entre las manos.","Empujá para volver."],
    mistakes:["Convertirlo en una flexión normal.","No cargar los hombros.","Recorrido demasiado corto."],
    easier:"Pike push-up con manos elevadas.",
    harder:"Pike push-up con pies elevados."
  },
  "Sentadilla con salto":{
    focus:"Potencia de piernas y acondicionamiento.",
    steps:["Bajá en sentadilla con control.","Impulsate hacia arriba.","Aterrizá suave sobre todo el pie.","Enlazá la siguiente repetición sin colapsar rodillas."],
    mistakes:["Aterrizar duro.","Rodillas hacia adentro.","Priorizar velocidad sobre técnica."],
    easier:"Sentadilla rápida sin salto.",
    harder:"Más repeticiones o menos descanso."
  },
  "Mountain climbers":{
    focus:"Core, hombros y capacidad cardiovascular.",
    steps:["Partí de plancha alta.","Llevá una rodilla hacia el pecho.","Alterná sin perder la línea corporal.","Mantené hombros sobre las manos."],
    mistakes:["Subir demasiado la cadera.","Rebotar sin control.","Mover el peso demasiado hacia atrás."],
    easier:"Versión lenta.",
    harder:"Más velocidad manteniendo técnica."
  },
  "Hollow hold":{
    focus:"Core profundo y control corporal.",
    steps:["Acostate boca arriba.","Pegá la zona lumbar al suelo.","Elevá hombros y piernas.","Mantené tensión sin arquear la espalda."],
    mistakes:["Despegar la zona lumbar.","Tirar del cuello.","Bajar demasiado las piernas."],
    easier:"Rodillas flexionadas.",
    harder:"Brazos y piernas completamente extendidos."
  },
  "Walking lunges":{
    focus:"Piernas, glúteos y resistencia muscular.",
    steps:["Da un paso amplio hacia adelante.","Bajá en zancada.","Impulsate y avanzá con la otra pierna.","Mantené el torso alto."],
    mistakes:["Pasos cortos.","Perder equilibrio por velocidad.","Rodillas hacia adentro."],
    easier:"Zancadas alternas en el sitio.",
    harder:"Más distancia o pausa abajo."
  },
  "Flexiones cerradas":{
    focus:"Tríceps, pecho y core.",
    steps:["Colocá las manos más cerca entre sí.","Mantené el cuerpo alineado.","Bajá con los codos cerca del torso.","Empujá sin perder tensión abdominal."],
    mistakes:["Abrir los codos.","Hundirse en la cadera.","Juntar demasiado las manos."],
    easier:"Flexiones cerradas inclinadas.",
    harder:"Declinadas o tempo lento."
  },
  "Bear crawl":{
    focus:"Core, hombros, piernas y coordinación.",
    steps:["Partí en cuadrupedia con rodillas apenas elevadas.","Mantené la espalda neutra.","Avanzá mano y pie opuestos.","Movete lento y estable."],
    mistakes:["Subir demasiado la cadera.","Moverse demasiado rápido.","Perder coordinación cruzada."],
    easier:"Bear hold estático.",
    harder:"Más distancia o más tiempo."
  },
  "Squat thrust":{
    focus:"Piernas, core y acondicionamiento general.",
    steps:["Desde pie, bajá y apoyá las manos.","Llevá los pies atrás.","Volvé con los pies al frente.","Ponete de pie y repetí."],
    mistakes:["Redondear demasiado la espalda.","Perder tensión abdominal.","Acelerar sin control."],
    easier:"Más lento y con paso atrás alternado.",
    harder:"Más repeticiones o menos descanso."
  },
  "Side plank":{
    focus:"Core lateral, glúteo medio y estabilidad.",
    steps:["Apoyá un antebrazo.","Alineá hombro, cadera y pies.","Elevá la cadera.","Mantené el tronco sin rotar."],
    mistakes:["Dejar caer la cadera.","Colapsar el hombro.","Rotar el pecho hacia el suelo."],
    easier:"Con rodillas apoyadas.",
    harder:"Elevar la pierna superior."
  }
};

function dateKey(date = new Date()){
  return new Intl.DateTimeFormat("en-CA", {
    timeZone:"America/Argentina/Buenos_Aires", year:"numeric", month:"2-digit", day:"2-digit"
  }).format(date);
}
function startOfWeek(key:string){
  const d = new Date(`${key}T12:00:00Z`);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0,10);
}
function addDays(key:string, amount:number){
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate()+amount);
  return d.toISOString().slice(0,10);
}
function clamp(value:number,min:number,max:number){ return Math.min(max,Math.max(min,value)); }
function uid(prefix:string){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function avg(values:Array<number|null|undefined>){
  const clean=values.filter((v):v is number=>typeof v==="number"&&Number.isFinite(v));
  return clean.length ? clean.reduce((a,b)=>a+b,0)/clean.length : null;
}
function formatWeight(value:number|null|undefined){
  return value == null ? "—" : `${new Intl.NumberFormat("es-AR",{maximumFractionDigits:1}).format(value)} kg`;
}
function formatDate(key:string){
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});
}
function shortDay(key:string){
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("es-AR",{weekday:"short",timeZone:"UTC"}).replace(".","").toUpperCase();
}

function ensureCoreHabits(life:LifeData){
  const habits=[...life.habits];
  const add=(id:string,name:string,detail:string)=>{
    if(!habits.some(h=>h.id===id || h.name.toLowerCase().includes(name.toLowerCase().split(" ")[0]))){
      habits.push({id,name,detail,category:"Salud física",color:"rose",active:true});
    }
  };
  add("health-walk","Caminar","Movimiento diario");
  add("health-strength","Entrenamiento de fuerza","Rutina adaptativa");
  return {...life,habits};
}

function saveLife(life:LifeData){
  window.localStorage.setItem(LIFE_KEY,JSON.stringify(life));
  window.dispatchEvent(new StorageEvent("storage",{key:LIFE_KEY,newValue:JSON.stringify(life)}));
}
function saveHealth(health:HealthState){
  window.localStorage.setItem(HEALTH_KEY,JSON.stringify(health));
}

function upsertHabitLog(life:LifeData, habitId:string, day:string, done:boolean){
  const existing=life.habitLogs.find(l=>l.habitId===habitId&&l.date===day);
  const next={id:existing?.id??uid("habitlog"),habitId,date:day,done,notes:existing?.notes??""};
  return {...life,habitLogs:[...life.habitLogs.filter(l=>!(l.habitId===habitId&&l.date===day)),next]};
}

function readinessScore(metric:Metric|undefined, check:WellbeingCheck|undefined){
  const sleep = metric?.sleepHours == null ? 70 : clamp((metric.sleepHours/8)*100,35,100);
  const energy = (check?.energy ?? metric?.energy ?? 7)*10;
  const stress = 110-(check?.stress ?? metric?.stress ?? 5)*10;
  const fatigue = 110-(check?.fatigue ?? 5)*10;
  const soreness = 110-(check?.soreness ?? 4)*10;
  return Math.round(clamp(sleep*.30+energy*.25+stress*.15+fatigue*.20+soreness*.10,0,100));
}

function readinessLabel(score:number){
  if(score>=82) return {label:"Muy buena",tone:"good",copy:"Podés progresar con normalidad si la sesión anterior también fue sólida."};
  if(score>=65) return {label:"Normal",tone:"normal",copy:"Mantenemos el plan y ajustamos solo si el rendimiento cae."};
  if(score>=48) return {label:"Baja",tone:"warn",copy:"Reducimos algo de volumen y priorizamos técnica y recuperación."};
  return {label:"Recuperación",tone:"low",copy:"Sesión suave: menos volumen, sin buscar máximos ni fatiga alta."};
}

const templates = {
  A:[
    ["Sentadilla tempo","3","12–15","reps","Bajá en 3 s y mantené 1 s abajo"],
    ["Flexiones","3","8–15","reps","Progresá hacia declinadas o tempo lento"],
    ["Zancadas alternas","3","10–14 por pierna","reps","Aumentá repeticiones antes de subir dificultad"],
    ["Puente de glúteos a una pierna","3","10–15 por pierna","reps","Pausa 2 s arriba"],
    ["Plancha frontal","3","30–60 s","sec","Aumentá tiempo o pasá a plancha con apoyo reducido"]
  ],
  B:[
    ["Burpees","4","8–12","reps","Buscá ritmo constante, no sprint"],
    ["Pike push-ups","3","6–12","reps","Progresá elevando los pies"],
    ["Sentadilla con salto","3","10–15","reps","Aterrizaje suave y controlado"],
    ["Mountain climbers","4","30–45 s","sec","Subí tiempo manteniendo técnica"],
    ["Hollow hold","3","20–40 s","sec","Aumentá tiempo o extendé brazos y piernas"]
  ],
  C:[
    ["Walking lunges","4","12–20 por pierna","reps","Simula el patrón de lunges de HYROX"],
    ["Flexiones cerradas","3","8–15","reps","Progresá con tempo o pies elevados"],
    ["Bear crawl","4","30–45 s","sec","Más tiempo o mayor distancia sin perder postura"],
    ["Squat thrust","4","12–20","reps","Aumentá densidad con descansos más cortos"],
    ["Side plank","3","25–45 s por lado","sec","Aumentá tiempo o elevá la pierna superior"]
  ],
} as const;

function nextStrengthName(sessions:StrengthSession[],weekStart:string){
  const count=sessions.filter(s=>s.completed&&s.date>=weekStart&&s.date<=addDays(weekStart,6)).length;
  return (["A","B","C"] as const)[Math.min(count,2)];
}
function buildExercises(kind:"A"|"B"|"C", score:number, previous:StrengthSession|undefined):ExerciseEntry[]{
  const volumeFactor=score<48?.65:score<65?.8:1;
  return templates[kind].map(([name,baseSets,reps,unit,progression],idx)=>{
    const prev=previous?.exercises.find(e=>e.name===name);
    const sets=Math.max(2,Math.round(Number(baseSets)*volumeFactor));
    const legacyResult = prev && "result" in prev ? prev.result : prev && "weight" in (prev as unknown as Record<string, unknown>) ? Number((prev as unknown as Record<string, unknown>).weight) : null;
    return {
      id:`${kind}-${idx}`, name, sets, reps, targetRir:score<65?3:2,
      result:Number.isFinite(legacyResult as number)?legacyResult:null,
      unit:unit as "reps"|"sec", progression, completed:false
    };
  });
}

export default function HealthPage(){
  const today=dateKey();
  const weekStart=startOfWeek(today);
  const weekDays=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const [life,setLife]=useState<LifeData>(emptyLife);
  const [health,setHealth]=useState<HealthState>(emptyHealth);
  const [ready,setReady]=useState(false);
  const [tab,setTab]=useState<"today"|"training"|"progress">("today");
  const [editingCheck,setEditingCheck]=useState(false);
  const [checkDraft,setCheckDraft]=useState({energy:7,stress:5,fatigue:5,soreness:4});
  const [walkMinutes,setWalkMinutes]=useState(30);
  const [sessionDraft,setSessionDraft]=useState<ExerciseEntry[]|null>(null);
  const [guideExercise,setGuideExercise]=useState<string|null>(null);

  useEffect(()=>{
    try{
      const raw=window.localStorage.getItem(LIFE_KEY);
      const parsed=raw?JSON.parse(raw):emptyLife;
      const normalized=ensureCoreHabits({
        ...parsed,
        habits:Array.isArray(parsed?.habits)?parsed.habits:[],
        habitLogs:Array.isArray(parsed?.habitLogs)?parsed.habitLogs:[],
        metrics:Array.isArray(parsed?.metrics)?parsed.metrics:[]
      });
      setLife(normalized); saveLife(normalized);
      const rawHealth=window.localStorage.getItem(HEALTH_KEY);
      if(rawHealth){
        const h=JSON.parse(rawHealth);
        setHealth({
          checks:Array.isArray(h?.checks)?h.checks:[],
          strengthSessions:Array.isArray(h?.strengthSessions)?h.strengthSessions:[],
          walks:Array.isArray(h?.walks)?h.walks:[]
        });
      }
    }catch{}
    setReady(true);
  },[]);

  useEffect(()=>{ if(ready) saveHealth(health); },[health,ready]);

  const todayMetric=life.metrics.find(m=>m.date===today);
  const todayCheck=health.checks.find(c=>c.date===today);
  const score=readinessScore(todayMetric,todayCheck);
  const state=readinessLabel(score);
  const walkHabit=life.habits.find(h=>h.id==="health-walk"||/caminar|caminata/i.test(h.name));
  const strengthHabit=life.habits.find(h=>h.id==="health-strength"||/fuerza|entrenamiento/i.test(h.name));
  const walkDone=Boolean(walkHabit&&life.habitLogs.find(l=>l.habitId===walkHabit.id&&l.date===today&&l.done));
  const strengthDone=Boolean(strengthHabit&&life.habitLogs.find(l=>l.habitId===strengthHabit.id&&l.date===today&&l.done));
  const completedWeekStrength=health.strengthSessions.filter(s=>s.completed&&weekDays.includes(s.date)).length;
  const strengthKind=nextStrengthName(health.strengthSessions,weekStart);
  const lastSame=[...health.strengthSessions].reverse().find(s=>s.name===`Fuerza ${strengthKind}`&&s.completed);
  const generatedExercises=useMemo(()=>buildExercises(strengthKind,score,lastSame),[strengthKind,score,lastSame]);
  const strengthScheduled=[0,2,4].includes(weekDays.indexOf(today)) || (completedWeekStrength<3 && new Date(`${today}T12:00:00Z`).getUTCDay()>=5);
  const recentMetrics=[...life.metrics].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  const latestWeight=[...life.metrics].filter(m=>m.weight!=null).sort((a,b)=>b.date.localeCompare(a.date))[0]?.weight??null;
  const previousWeight=[...life.metrics].filter(m=>m.weight!=null).sort((a,b)=>b.date.localeCompare(a.date))[1]?.weight??null;
  const avgSleep=avg(recentMetrics.map(m=>m.sleepHours));
  const avgEnergy=avg(recentMetrics.map(m=>m.energy));
  const weeklyWalks=health.walks.filter(w=>w.completed&&weekDays.includes(w.date));
  const weeklyMinutes=weeklyWalks.reduce((s,w)=>s+w.minutes,0);

  function completeWalk(){
    if(!walkHabit)return;
    const nextLife=upsertHabitLog(life,walkHabit.id,today,!walkDone);
    setLife(nextLife); saveLife(nextLife);
    setHealth(current=>({
      ...current,
      walks: walkDone
        ? current.walks.filter(w=>w.date!==today)
        : [...current.walks.filter(w=>w.date!==today),{id:uid("walk"),date:today,minutes:walkMinutes,completed:true}]
    }));
  }

  function saveCheck(){
    const check:WellbeingCheck={date:today,...checkDraft};
    setHealth(current=>({...current,checks:[...current.checks.filter(c=>c.date!==today),check]}));
    const existing=todayMetric;
    const metric:Metric={
      id:existing?.id??uid("metric"), date:today, weight:existing?.weight??null,
      mood:existing?.mood??null, energy:checkDraft.energy,
      sleepHours:existing?.sleepHours??null, sleepQuality:existing?.sleepQuality??null,
      stress:checkDraft.stress, exerciseMinutes:existing?.exerciseMinutes??null,
      activeCalories:existing?.activeCalories??null, screenTimeHours:existing?.screenTimeHours??null,
      productivity:existing?.productivity??null, daySatisfaction:existing?.daySatisfaction??null,
      nutritionQuality:existing?.nutritionQuality??null, socialConnection:existing?.socialConnection??null,
      wakeFeeling:existing?.wakeFeeling??null, contextTags:existing?.contextTags??[], notes:existing?.notes??""
    };
    const nextLife={...life,metrics:[...life.metrics.filter(m=>m.date!==today),metric]};
    setLife(nextLife);saveLife(nextLife);setEditingCheck(false);
  }

  function startStrength(){ setSessionDraft(generatedExercises.map(e=>({...e}))); setTab("training"); }
  function finishStrength(){
    if(!sessionDraft||!strengthHabit)return;
    const session:StrengthSession={
      id:uid("strength"),date:today,name:`Fuerza ${strengthKind}`,readiness:score,duration:50,
      exercises:sessionDraft.map(e=>({...e,completed:true})),completed:true
    };
    setHealth(current=>({...current,strengthSessions:[...current.strengthSessions.filter(s=>s.date!==today),session]}));
    const nextLife=upsertHabitLog(life,strengthHabit.id,today,true);
    setLife(nextLife);saveLife(nextLife);setSessionDraft(null);setTab("today");
  }

  if(!ready) return <main className="health-app health-loading">Preparando tu módulo de salud…</main>;

  return <main className="health-app">
    <section className="health-hero">
      <div>
        <span className="health-eyebrow"><HeartPulse size={15}/> SALUD · {formatDate(today)}</span>
        <h1>Tu salud, convertida en un plan diario.</h1>
        <p>La rutina se adapta a tu descanso, energía, cansancio y rendimiento reciente; al completarla también actualiza tus hábitos.</p>
      </div>
      <div className={`readiness-ring ${state.tone}`}>
        <small>PREPARACIÓN</small><strong>{score}</strong><span>{state.label}</span>
      </div>
    </section>

    <nav className="health-tabs">
      <button className={tab==="today"?"active":""} onClick={()=>setTab("today")}>Hoy</button>
      <button className={tab==="training"?"active":""} onClick={()=>setTab("training")}>Entrenamiento</button>
      <button className={tab==="progress"?"active":""} onClick={()=>setTab("progress")}>Progreso</button>
    </nav>

    {tab==="today"&&<>
      <section className="health-signal-strip">
        <article><Moon size={18}/><span>Sueño</span><strong>{todayMetric?.sleepHours==null?"—":`${todayMetric.sleepHours.toFixed(1)} h`}</strong></article>
        <article><Zap size={18}/><span>Energía</span><strong>{todayCheck?.energy??todayMetric?.energy??"—"}{(todayCheck?.energy??todayMetric?.energy)!=null?"/10":""}</strong></article>
        <article><BatteryCharging size={18}/><span>Fatiga</span><strong>{todayCheck?.fatigue??"—"}{todayCheck?"/10":""}</strong></article>
        <article><Scale size={18}/><span>Peso</span><strong>{formatWeight(latestWeight)}</strong></article>
      </section>

      <div className="health-grid">
        <section className="health-card plan-card">
          <header><div><span className="health-eyebrow">PLAN DE HOY</span><h2>Lo que toca hacer</h2></div><span className={`status-pill ${state.tone}`}>{state.label}</span></header>
          <p className="adaptive-note"><Sparkles size={16}/>{state.copy}</p>

          <article className={`plan-action ${walkDone?"done":""}`}>
            <div className="action-icon"><Footprints size={20}/></div>
            <div><span>ACTIVIDAD</span><h3>Caminata adaptativa</h3><p>{score<48?"Recuperación suave":score<65?"Movimiento moderado":"Movimiento diario"} · {walkMinutes} min</p></div>
            <div className="action-controls">
              <select value={walkMinutes} onChange={e=>setWalkMinutes(Number(e.target.value))} aria-label="Minutos de caminata">
                <option value={20}>20 min</option><option value={30}>30 min</option><option value={40}>40 min</option><option value={45}>45 min</option>
              </select>
              <button onClick={completeWalk}>{walkDone?<><Check size={15}/> Hecho</>:<>Completar <ChevronRight size={15}/></>}</button>
            </div>
          </article>

          <article className={`plan-action ${strengthDone?"done":""}`}>
            <div className="action-icon"><Dumbbell size={20}/></div>
            <div><span>FUERZA + HYROX</span><h3>{strengthScheduled?`Calistenia ${strengthKind}`:"Recuperación / movilidad"}</h3>
              <p>{strengthScheduled ? `${generatedExercises.length} bloques · peso corporal · ${score<65?"volumen reducido":"sesión completa"}` : "Hoy no hay sesión de fuerza programada en la base semanal."}</p>
            </div>
            <div className="action-controls">
              {strengthScheduled&&!strengthDone?<button onClick={startStrength}>Ver rutina <ArrowRight size={15}/></button>:strengthDone?<span className="done-label"><Check size={14}/> Completado</span>:<span className="rest-label">Descanso</span>}
            </div>
          </article>

          <div className="habit-link-note"><Target size={16}/><span>Estas acciones están enlazadas con tus hábitos. No tendrás que completarlas dos veces.</span></div>
        </section>

        <aside className="health-side">
          <section className="health-card checkin-card">
            <header><div><span className="health-eyebrow">CHECK-IN</span><h2>Cómo estás hoy</h2></div>{todayCheck&&<button className="icon-link" onClick={()=>setEditingCheck(true)}>Editar</button>}</header>
            {!todayCheck&&!editingCheck?<button className="checkin-cta" onClick={()=>setEditingCheck(true)}><Gauge size={21}/><span><strong>Completar check-in</strong><small>4 respuestas · menos de 10 segundos</small></span><ChevronRight size={17}/></button>:null}
            {(editingCheck||todayCheck)&&<div className="check-sliders">
              {([
                ["energy","Energía"],["stress","Estrés"],["fatigue","Cansancio"],["soreness","Dolor muscular"]
              ] as const).map(([key,label])=><label key={key}><span>{label}<strong>{editingCheck?checkDraft[key]:todayCheck?.[key]}/10</strong></span>
                <input type="range" min="1" max="10" value={editingCheck?checkDraft[key]:todayCheck?.[key]??5} disabled={!editingCheck}
                  onChange={e=>setCheckDraft(d=>({...d,[key]:Number(e.target.value)}))}/>
              </label>)}
              {editingCheck&&<button className="primary-health" onClick={saveCheck}>Guardar check-in</button>}
            </div>}
          </section>

          <section className="health-card week-card">
            <header><div><span className="health-eyebrow">SEMANA</span><h2>Ritmo actual</h2></div><strong>{completedWeekStrength}/3</strong></header>
            <div className="week-row">
              {weekDays.map((day,i)=>{
                const strength=health.strengthSessions.some(s=>s.date===day&&s.completed);
                const walk=health.walks.some(w=>w.date===day&&w.completed);
                const scheduled=[0,2,4].includes(i);
                return <div key={day} className={day===today?"today":""}><span>{shortDay(day)}</span><b>{new Date(`${day}T12:00:00Z`).getUTCDate()}</b><i className={strength?"strength":walk?"walk":scheduled?"scheduled":""}>{strength?"F":walk?"C":scheduled?"·":""}</i></div>;
              })}
            </div>
            <div className="week-summary"><span><Dumbbell size={14}/> Fuerza {completedWeekStrength}/3</span><span><Footprints size={14}/> {weeklyMinutes} min caminando</span></div>
          </section>
        </aside>
      </div>
    </>}

    {tab==="training"&&<section className="training-layout">
      <div className="health-card training-main">
        <header><div><span className="health-eyebrow">ENTRENAMIENTO DE HOY</span><h2>Calistenia + HYROX {strengthKind}</h2><p>Sin gimnasio: fuerza con tu propio cuerpo, capacidad de trabajo y progresión por repeticiones, tiempo, tempo y dificultad.</p></div><span className={`status-pill ${state.tone}`}>{score}/100</span></header>
        {!sessionDraft&&<button className="primary-health start-session" onClick={startStrength}><Dumbbell size={17}/> Preparar sesión</button>}
        {(sessionDraft??generatedExercises).map((exercise,index)=><article className="exercise-row" key={exercise.id}>
          <div className="exercise-index">{String(index+1).padStart(2,"0")}</div>
          <div><h3>{exercise.name}</h3><p>{exercise.sets} series · objetivo {exercise.reps} · RIR {exercise.targetRir}</p><small>{exercise.progression}</small>{lastSame?.exercises.find(e=>e.name===exercise.name)&&<small>Última vez: {(lastSame.exercises.find(e=>e.name===exercise.name) as ExerciseEntry | undefined)?.result??"—"} {exercise.unit==="sec"?"s":"reps"}</small>}<button className="exercise-help" onClick={()=>setGuideExercise(exercise.name)}><Info size={13}/> Cómo se hace</button></div>
          <label><span>{exercise.unit==="sec"?"SEG":"REPS"}</span><input type="number" step="1" min="0" value={exercise.result??""} placeholder="—"
            onChange={e=>{
              const value=e.target.value===""?null:Number(e.target.value);
              setSessionDraft(current=>(current??generatedExercises).map(item=>item.id===exercise.id?{...item,result:value}:item));
            }}/></label>
        </article>)}
        <div className="training-footer">
          <div><RotateCcw size={16}/><span>{lastSame?"Usamos tus repeticiones y tiempos anteriores como referencia.":"Primera sesión: registrá repeticiones o segundos para crear tu línea base."}</span></div>
          <button className="primary-health" onClick={finishStrength} disabled={!sessionDraft}>Finalizar y guardar sesión</button>
        </div>
      </div>
      <aside className="health-card training-context">
        <span className="health-eyebrow">POR QUÉ ESTA RUTINA</span><h2>Adaptación de hoy</h2>
        <div className="context-score"><strong>{score}</strong><span>{state.label}</span></div>
        <ul>
          <li>Sueño: {todayMetric?.sleepHours==null?"sin dato":`${todayMetric.sleepHours.toFixed(1)} h`}</li>
          <li>Energía: {todayCheck?.energy??todayMetric?.energy??"sin dato"}</li>
          <li>Fatiga: {todayCheck?.fatigue??"sin dato"}</li>
          <li>Sesiones de fuerza esta semana: {completedWeekStrength}</li>
        </ul>
        <p>El motor usa reglas deterministas: con recuperación baja reduce series y densidad. Con buena recuperación progresa sin pesas: más repeticiones, más segundos, tempo más lento, menor descanso o una variante más difícil.</p>
      </aside>
    </section>}

    {guideExercise&&exerciseGuides[guideExercise]&&<div className="exercise-guide-backdrop" onMouseDown={()=>setGuideExercise(null)}>
      <section className="exercise-guide-modal" onMouseDown={e=>e.stopPropagation()}>
        <header>
          <div><span className="health-eyebrow">GUÍA DEL EJERCICIO</span><h2>{guideExercise}</h2><p>{exerciseGuides[guideExercise].focus}</p></div>
          <button className="guide-close" onClick={()=>setGuideExercise(null)} aria-label="Cerrar"><X size={18}/></button>
        </header>
        <div className="guide-video-card">
          <div><PlayCircle size={32}/><strong>Ver demostración en video</strong><small>Abrí una referencia visual del movimiento antes de empezar.</small></div>
          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(guideExercise+" exercise proper form")}`} target="_blank" rel="noreferrer">Ver video <ArrowRight size={14}/></a>
        </div>
        <div className="guide-grid">
          <article><h3>Cómo hacerlo</h3><ol>{exerciseGuides[guideExercise].steps.map(step=><li key={step}>{step}</li>)}</ol></article>
          <article><h3>Errores comunes</h3><ul>{exerciseGuides[guideExercise].mistakes.map(item=><li key={item}>{item}</li>)}</ul></article>
        </div>
        <div className="guide-levels">
          <div><span>MÁS FÁCIL</span><strong>{exerciseGuides[guideExercise].easier}</strong></div>
          <div><span>MÁS DIFÍCIL</span><strong>{exerciseGuides[guideExercise].harder}</strong></div>
        </div>
      </section>
    </div>}

    {tab==="progress"&&<section className="progress-grid">
      <article className="health-card progress-stat"><Scale/><span>Peso actual</span><strong>{formatWeight(latestWeight)}</strong><small>{latestWeight!=null&&previousWeight!=null?`${latestWeight-previousWeight>0?"+":""}${(latestWeight-previousWeight).toFixed(1)} kg vs. registro anterior`:"Añadí más registros para ver tendencia"}</small></article>
      <article className="health-card progress-stat"><Moon/><span>Sueño · 7 días</span><strong>{avgSleep==null?"—":`${avgSleep.toFixed(1)} h`}</strong><small>Promedio reciente</small></article>
      <article className="health-card progress-stat"><Zap/><span>Energía · 7 días</span><strong>{avgEnergy==null?"—":`${avgEnergy.toFixed(1)}/10`}</strong><small>Promedio reciente</small></article>
      <article className="health-card progress-stat"><Dumbbell/><span>Fuerza · semana</span><strong>{completedWeekStrength}/3</strong><small>Sesiones completadas</small></article>
      <section className="health-card progress-history">
        <header><div><span className="health-eyebrow">HISTÓRICO</span><h2>Últimos entrenamientos</h2></div><TrendingUp size={20}/></header>
        {health.strengthSessions.slice().reverse().slice(0,6).map(session=><div key={session.id}><span>{session.date}</span><strong>{session.name}</strong><small>Preparación {session.readiness}/100 · {session.exercises.length} ejercicios</small></div>)}
        {!health.strengthSessions.length&&<p>Todavía no hay sesiones guardadas. La primera sesión crea la referencia para que el sistema pueda empezar a progresar cargas.</p>}
      </section>
    </section>}
  </main>;
}
