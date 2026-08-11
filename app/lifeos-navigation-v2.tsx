"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, Apple, BookHeart, ChevronLeft, ChevronRight, CircleUserRound,
  Clock3, FolderKanban, HeartPulse, Home, ListChecks, Menu, Network,
  NotebookPen, Plus, Rocket, Settings, Sparkles, Star, Target, X
} from "lucide-react";
import "./navigation-v2.css";

type Destination = { label: string; icon: React.ComponentType<{size?:number;strokeWidth?:number}>; module?: string; href?: string };
type Area = { id: string; label: string; icon: React.ComponentType<{size?:number;strokeWidth?:number}>; items: Destination[] };

const areas: Area[] = [
  { id:"productivity", label:"Productividad", icon:Target, items:[
    {label:"Planificación",icon:ListChecks,module:"Plan personal"},
    {label:"Enfoque y tiempo",icon:Clock3,module:"Enfoque y tiempo"},
    {label:"Proyectos y notas",icon:FolderKanban,module:"Plan personal"},
  ]},
  { id:"health", label:"Salud", icon:HeartPulse, items:[
    {label:"Nutrición",icon:Apple,href:"/nutrition"},
    {label:"Métricas",icon:Activity,module:"Métricas"},
    {label:"Hábitos",icon:ListChecks,module:"Hábitos"},
  ]},
  { id:"wellbeing", label:"Bienestar", icon:BookHeart, items:[
    {label:"Journal",icon:NotebookPen,module:"Journal"},
    {label:"Agradecimientos",icon:BookHeart,module:"Agradecimientos"},
  ]},
  { id:"life", label:"Vida", icon:Sparkles, items:[
    {label:"Mapa vital",icon:Network,module:"Mapa vital"},
    {label:"Bucket list",icon:Star,module:"Bucket list"},
    {label:"Experimentos y retos",icon:Rocket,module:"Experimentos y retos"},
  ]},
];

function clickLegacyModule(label:string){
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".side-nav button, .mobile-drawer nav button"));
  const button = buttons.find((b)=>b.textContent?.trim()===label || b.textContent?.includes(label));
  if(button){button.click();return true;} return false;
}

export function LifeOSNavigationV2(){
  const pathname=usePathname(); const router=useRouter();
  const [expanded,setExpanded]=useState(false); const [openArea,setOpenArea]=useState<string|null>(null); const [mobileOpen,setMobileOpen]=useState(false);
  const activeArea=useMemo(()=>pathname.startsWith("/nutrition")?"health":null,[pathname]);

  useEffect(()=>{ try{setExpanded(localStorage.getItem("lifeos-nav-expanded")==="1")}catch{} },[]);
  useEffect(()=>{ try{localStorage.setItem("lifeos-nav-expanded",expanded?"1":"0")}catch{} },[expanded]);
  useEffect(()=>{ document.documentElement.dataset.lifeosNav=expanded?"expanded":"compact"; return()=>{delete document.documentElement.dataset.lifeosNav}; },[expanded]);

  useEffect(()=>{
    if(pathname!=="/")return;
    const params=new URLSearchParams(window.location.search); const module=params.get("module"); if(!module)return;
    let tries=0; const id=window.setInterval(()=>{tries++; if(clickLegacyModule(module)||tries>20){window.clearInterval(id); if(tries<=20)history.replaceState({},"","/");}},80);
    return()=>window.clearInterval(id);
  },[pathname]);

  useEffect(()=>{
    if(!pathname.startsWith("/nutrition"))return;
    const params=new URLSearchParams(window.location.search); if(params.get("add")!=="1")return;
    let tries=0; const id=window.setInterval(()=>{tries++; const button=document.querySelector<HTMLButtonElement>("button[class*='stickyAdd']"); if(button||tries>20){window.clearInterval(id);button?.click();history.replaceState({},"","/nutrition");}},80);
    return()=>window.clearInterval(id);
  },[pathname]);

  const go=(item:Destination)=>{
    setOpenArea(null);setMobileOpen(false);
    if(item.href){router.push(item.href);return;}
    if(!item.module)return;
    if(pathname==="/"){if(!clickLegacyModule(item.module))router.push(`/?module=${encodeURIComponent(item.module)}`)}
    else router.push(`/?module=${encodeURIComponent(item.module)}`);
  };
  const goHome=()=>{setMobileOpen(false); if(pathname==="/"){clickLegacyModule("Hoy")}else router.push("/")};
  const openRegister=()=>{
    if(pathname.startsWith("/nutrition")){const b=document.querySelector<HTMLButtonElement>("button[class*='stickyAdd']"); if(b)b.click(); else router.push("/nutrition?add=1");return;}
    const b=document.querySelector<HTMLButtonElement>(".top-actions .primary-button, .mobile-fab"); b?.click();
  };
  const goSettings=()=>{setMobileOpen(false); if(pathname==="/"){clickLegacyModule("Ajustes y datos")}else router.push("/?module=Ajustes%20y%20datos")};

  return <>
    <aside className={`lifeos-nav-v2 ${expanded?"is-expanded":""}`} aria-label="Navegación LifeOS">
      <div className="lifeos-nav-brand"><span className="lifeos-brand-orb"><Sparkles size={18}/></span>{expanded&&<div><strong>LifeOS</strong><small>Espacio personal</small></div>}</div>
      <button className="lifeos-collapse" aria-label={expanded?"Contraer menú":"Expandir menú"} onClick={()=>setExpanded(v=>!v)}>{expanded?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}</button>
      <nav className="lifeos-primary-nav">
        <button className={pathname==="/"?"is-active":""} onClick={goHome}><Home size={20}/>{expanded&&<span>Hoy</span>}</button>
        {areas.map(area=>{const Icon=area.icon; const active=activeArea===area.id; return <div className="lifeos-area" key={area.id}>
          <button className={active?"is-active":""} onClick={()=>setOpenArea(openArea===area.id?null:area.id)} aria-expanded={openArea===area.id}><Icon size={20}/>{expanded&&<><span>{area.label}</span><ChevronRight className="area-chevron" size={15}/></>}</button>
          {openArea===area.id&&<div className="lifeos-flyout">
            <div className="lifeos-flyout-head"><span>{area.label}</span><button onClick={()=>setOpenArea(null)}><X size={15}/></button></div>
            {area.items.map(item=>{const ItemIcon=item.icon;return <button key={item.label} onClick={()=>go(item)}><span><ItemIcon size={18}/></span><div><strong>{item.label}</strong><small>{item.href?"Abrir módulo":"Ver en LifeOS"}</small></div><ChevronRight size={15}/></button>})}
          </div>}
        </div>})}
      </nav>
      <div className="lifeos-nav-bottom">
        <button onClick={goSettings}><Settings size={20}/>{expanded&&<span>Ajustes</span>}</button>
        <button className="lifeos-profile"><CircleUserRound size={22}/>{expanded&&<div><strong>Mi LifeOS</strong><small>Espacio privado</small></div>}</button>
      </div>
    </aside>

    <button className="lifeos-global-register" onClick={openRegister}><Plus size={19}/><span>Registrar</span></button>

    <nav className="lifeos-mobile-nav-v2" aria-label="Navegación móvil LifeOS">
      <button className={pathname==="/"?"is-active":""} onClick={goHome}><Home size={20}/><span>Hoy</span></button>
      <button onClick={()=>{setMobileOpen(true);setOpenArea("productivity")}}><Target size={20}/><span>Plan</span></button>
      <button className={pathname.startsWith("/nutrition")?"is-active":""} onClick={()=>{setMobileOpen(true);setOpenArea("health")}}><HeartPulse size={20}/><span>Salud</span></button>
      <button onClick={()=>setMobileOpen(true)}><Menu size={20}/><span>Más</span></button>
    </nav>

    {mobileOpen&&<div className="lifeos-mobile-sheet-backdrop" onMouseDown={()=>setMobileOpen(false)}>
      <section className="lifeos-mobile-sheet" onMouseDown={e=>e.stopPropagation()}>
        <header><div><small>LifeOS</small><h2>¿Dónde quieres ir?</h2></div><button onClick={()=>setMobileOpen(false)}><X size={19}/></button></header>
        <button className="lifeos-sheet-home" onClick={goHome}><Home size={19}/><span>Hoy</span><ChevronRight size={16}/></button>
        {areas.map(area=>{const Icon=area.icon;return <div className="lifeos-sheet-area" key={area.id}><button onClick={()=>setOpenArea(openArea===area.id?null:area.id)}><Icon size={19}/><span>{area.label}</span><ChevronRight className={openArea===area.id?"rotate":""} size={16}/></button>{openArea===area.id&&<div>{area.items.map(item=>{const I=item.icon;return <button key={item.label} onClick={()=>go(item)}><I size={17}/><span>{item.label}</span></button>})}</div>}</div>})}
        <button className="lifeos-sheet-settings" onClick={goSettings}><Settings size={19}/><span>Ajustes y datos</span><ChevronRight size={16}/></button>
      </section>
    </div>}
  </>;
}
