"use client";

import { useEffect } from "react";
import { Apple, ArrowRight } from "lucide-react";
import { createRoot, Root } from "react-dom/client";

const roots = new Map<Element, Root>();

export function NutritionNavLink() {
  useEffect(() => {
    const mount = () => {
      const sidebar = document.querySelector(".side-nav");
      if (sidebar && !sidebar.querySelector("[data-nutrition-nav]")) {
        const host = document.createElement("div");
        host.setAttribute("data-nutrition-nav", "desktop");
        const systemEyebrow = sidebar.querySelector(".nav-eyebrow-spaced");
        sidebar.insertBefore(host, systemEyebrow ?? null);
        const root = createRoot(host); roots.set(host, root);
        root.render(<a href="/nutrition" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,textDecoration:"none",color:"inherit",fontSize:14,fontWeight:600}}><Apple size={19} strokeWidth={1.8}/><span>Nutrición</span></a>);
      }
      const drawer = document.querySelector(".mobile-drawer nav");
      if (drawer && !drawer.querySelector("[data-nutrition-nav]")) {
        const host = document.createElement("div"); host.setAttribute("data-nutrition-nav","mobile"); drawer.insertBefore(host, drawer.lastElementChild);
        const root=createRoot(host); roots.set(host,root);
        root.render(<a href="/nutrition" style={{display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:12,padding:"12px",borderRadius:12,textDecoration:"none",color:"inherit",fontWeight:650}}><span className="mobile-drawer-icon"><Apple size={19}/></span><span>Nutrición</span><ArrowRight size={15}/></a>);
      }
    };
    mount(); const observer=new MutationObserver(mount); observer.observe(document.body,{childList:true,subtree:true});
    return ()=>{observer.disconnect(); roots.forEach((root,host)=>{root.unmount();host.remove()});roots.clear()};
  },[]);
  return null;
}
