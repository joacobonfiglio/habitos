"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, Apple, BookHeart, ChevronDown, ChevronRight, CircleUserRound,
  Clock3, FolderKanban, HeartPulse, Home, ListChecks, Menu, Network,
  NotebookPen, Rocket, Settings, Sparkles, Star, Target, X
} from "lucide-react";
import "./navigation-v2.css";

type Destination = { label: string; icon: React.ComponentType<{size?:number;strokeWidth?:number}>; module?: string; href?: string };
type Area = { id: string; label: string; icon: React.ComponentType<{size?:number;strokeWidth?:number}>; items: Destination[] };

const areas: Area[] = [
  { id:"productivity", label:"Planificar", icon:Target, items:[
    {label:"Plan personal",icon:ListChecks,module:"Plan personal"},
    {label:"Enfoque",icon:Clock3,module:"Enfoque y tiempo"},
    {label:"Proyectos y notas",icon:FolderKanban,module:"Plan personal"},
  ]},
  { id:"health", label:"Salud", icon:HeartPulse, items:[
    {label:"Mi salud",icon:HeartPulse,href:"/health"},
    {label:"Nutrición",icon:Apple,href:"/nutrition"},
    {label:"Métricas",icon:Activity,module:"Métricas"},
    {label:"Hábitos",icon:ListChecks,module:"Hábitos"},
  ]},
  { id:"wellbeing", label:"Reflexión", icon:BookHeart, items:[
    {label:"Journal",icon:NotebookPen,module:"Journal"},
    {label:"Agradecimientos",icon:BookHeart,module:"Agradecimientos"},
  ]},
  { id:"life", label:"Vida", icon:Sparkles, items:[
    {label:"Mapa vital",icon:Network,module:"Mapa vital"},
    {label:"Bucket list",icon:Star,module:"Bucket list"},
    {label:"Experimentos",icon:Rocket,module:"Experimentos y retos"},
  ]},
];

function clickLegacyModule(label:string){
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".side-nav button, .mobile-drawer nav button"));
  const button = buttons.find((b)=>b.textContent?.trim()===label || b.textContent?.includes(label));
  if(button){button.click();return true;} return false;
}

export function LifeOSNavigationV2(){
  const pathname=usePathname();
  const router=useRouter();
  const [openArea,setOpenArea]=useState<string|null>(null);
  const [mobileOpen,setMobileOpen]=useState(false);
  const activeArea=useMemo(()=>pathname.startsWith("/nutrition")||pathname.startsWith("/health")?"health":null,[pathname]);

  useEffect(()=>{
    document.documentElement.dataset.lifeosNav="top";
    return()=>{delete document.documentElement.dataset.lifeosNav};
  },[]);

  useEffect(()=>{
    if(pathname!=="/")return;
    const params=new URLSearchParams(window.location.search);
    const module=params.get("module");
    if(!module)return;
    let tries=0;
    const id=window.setInterval(()=>{
      tries++;
      if(clickLegacyModule(module)||tries>20){
        window.clearInterval(id);
        if(tries<=20)history.replaceState({},"","/");
      }
    },80);
    return()=>window.clearInterval(id);
  },[pathname]);

  const go=(item:Destination)=>{
    setOpenArea(null);setMobileOpen(false);
    if(item.href){router.push(item.href);return;}
    if(!item.module)return;
    if(pathname==="/"){
      if(!clickLegacyModule(item.module))router.push(`/?module=${encodeURIComponent(item.module)}`);
    } else router.push(`/?module=${encodeURIComponent(item.module)}`);
  };
  const goHome=()=>{setMobileOpen(false);setOpenArea(null);if(pathname==="/"){clickLegacyModule("Hoy")}else router.push("/")};
  const goSettings=()=>{setMobileOpen(false);setOpenArea(null);if(pathname==="/"){clickLegacyModule("Ajustes y datos")}else router.push("/?module=Ajustes%20y%20datos")};

  return <>
    <header className="lifeos-topnav" aria-label="Navegación LifeOS">
      <button className="lifeos-wordmark" onClick={goHome} aria-label="Ir a Hoy">
        <span className="lifeos-wordmark-mark"><Sparkles size={17}/></span>
        <span><strong>LifeOS</strong><small>Mi espacio</small></span>
      </button>

      <nav className="lifeos-topnav-main">
        <button className={pathname==="/"&&!openArea?"is-active":""} onClick={goHome}><Home size={17}/><span>Hoy</span></button>
        {areas.map(area=>{
          const Icon=area.icon;
          const active=activeArea===area.id||openArea===area.id;
          return <div className="lifeos-top-area" key={area.id}>
            <button className={active?"is-active":""} onClick={()=>setOpenArea(openArea===area.id?null:area.id)} aria-expanded={openArea===area.id}>
              <Icon size={17}/><span>{area.label}</span><ChevronDown size={14}/>
            </button>
            {openArea===area.id&&<div className="lifeos-mega-menu">
              <div className="lifeos-mega-copy"><small>ÁREA</small><strong>{area.label}</strong><p>Entrá directo al espacio que necesitás sin perder el contexto de tu día.</p></div>
              <div className="lifeos-mega-links">
                {area.items.map(item=>{const ItemIcon=item.icon;return <button key={item.label} onClick={()=>go(item)}>
                  <span><ItemIcon size={18}/></span><div><strong>{item.label}</strong><small>Abrir módulo</small></div><ChevronRight size={15}/>
                </button>})}
              </div>
            </div>}
          </div>
        })}
      </nav>

      <div className="lifeos-topnav-actions">
        <button className="lifeos-settings" onClick={goSettings} aria-label="Ajustes"><Settings size={18}/></button>
        <button className="lifeos-account"><CircleUserRound size={20}/><span>Mi LifeOS</span></button>
      </div>
    </header>

    <nav className="lifeos-mobile-nav-v2" aria-label="Navegación móvil LifeOS">
      <button className={pathname==="/"?"is-active":""} onClick={goHome}><Home size={20}/><span>Hoy</span></button>
      <button onClick={()=>{setMobileOpen(true);setOpenArea("productivity")}}><Target size={20}/><span>Plan</span></button>
      <button className={pathname.startsWith("/health")||pathname.startsWith("/nutrition")?"is-active":""} onClick={()=>{setMobileOpen(false);setOpenArea(null);router.push("/health")}}><HeartPulse size={20}/><span>Salud</span></button>
      <button onClick={()=>setMobileOpen(true)}><Menu size={20}/><span>Más</span></button>
    </nav>

    {mobileOpen&&<div className="lifeos-mobile-sheet-backdrop" onMouseDown={()=>setMobileOpen(false)}>
      <section className="lifeos-mobile-sheet" onMouseDown={e=>e.stopPropagation()}>
        <header><div><small>LIFEOS</small><h2>Tu espacio</h2></div><button onClick={()=>setMobileOpen(false)}><X size={19}/></button></header>
        <button className="lifeos-sheet-home" onClick={goHome}><Home size={19}/><span>Hoy</span><ChevronRight size={16}/></button>
        {areas.map(area=>{const Icon=area.icon;return <div className="lifeos-sheet-area" key={area.id}>
          <button onClick={()=>setOpenArea(openArea===area.id?null:area.id)}><Icon size={19}/><span>{area.label}</span><ChevronRight className={openArea===area.id?"rotate":""} size={16}/></button>
          {openArea===area.id&&<div>{area.items.map(item=>{const I=item.icon;return <button key={item.label} onClick={()=>go(item)}><I size={17}/><span>{item.label}</span></button>})}</div>}
        </div>})}
        <button className="lifeos-sheet-settings" onClick={goSettings}><Settings size={19}/><span>Ajustes y datos</span><ChevronRight size={16}/></button>
      </section>
    </div>}
  </>;
}
