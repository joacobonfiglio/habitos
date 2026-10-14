"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type PulsoState = { S: Record<string, unknown>; D: Record<string, unknown> };
type SnapshotData = Record<string, unknown> & { pulso?: PulsoState };

// Keep the supplied UI isolated from legacy styles; both documents share the same origin.
export default function PulsoPage() {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const db = createClient();
    let stopped = false, initialized = false, frameReady = false, blocked = false;
    let userId: string | null = null, revision: string | null = null;
    let base: SnapshotData = {}, initial: PulsoState | null = null;
    let pending: PulsoState | null = null, saving = false;
    let status = "Solo en este dispositivo";
    const send = (type: string, payload: Record<string, unknown> = {}) => frame.current?.contentWindow?.postMessage({ type, ...payload }, window.location.origin);
    const announce = (value: string) => { status = value; send("pulso:status", { status, connected: !!userId }); };
    const key = () => userId ? `pulso:account:${userId}` : "pulso:v1";
    const initFrame = () => { if (initialized && frameReady && !stopped) send("pulso:init", { state: initial, legacy: base, key: key(), status, connected: !!userId }); };
    const readLocal = () => { try { return JSON.parse(localStorage.getItem(key()) || "null") as PulsoState | null; } catch { return null; } };
    async function saveCloud() {
      if (!db || !userId || saving || blocked || !pending) return;
      saving = true;
      try {
        while (pending && !stopped && !blocked) {
          const state = pending; pending = null;
          const data = { ...base, pulso: state };
          announce("Guardando en tu cuenta…");
          let result;
          if (revision) {
            result = await db.from("lifeos_snapshots").update({ data, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("updated_at", revision).select("updated_at").maybeSingle();
          } else {
            // Insert, never upsert: a competing first save must not overwrite another device.
            result = await db.from("lifeos_snapshots").insert({ user_id: userId, data, schema_version: 3 }).select("updated_at").maybeSingle();
          }
          if (result.error || !result.data) {
            pending = pending || state;
            blocked = true;
            announce(result.error ? "Guardado local. Reintentá la sincronización." : "Otro dispositivo cambió los datos. Exportá tu copia antes de recargar.");
            break;
          }
          revision = result.data.updated_at;
          base = data;
          localStorage.setItem(key()+":revision", revision!);
          if(!pending && localStorage.getItem(key())===JSON.stringify(state))localStorage.removeItem(key()+":pending");
          announce("Sincronizado con tu cuenta");
        }
      } finally { saving = false; }
    }
    async function initialize() {
      try {
        const session = await db?.auth.getSession();
        userId = session?.data.session?.user.id || null;
        if (userId && db) {
          const result = await db.from("lifeos_snapshots").select("data, updated_at").eq("user_id", userId).maybeSingle();
          if (result.error) { blocked = true; status = "No se pudo leer la nube. Tus cambios se guardarán localmente."; }
          else {
            base = result.data?.data || {};
            revision = result.data?.updated_at || null;
            status = "Sincronizado con tu cuenta";
          }
        }
        initial = readLocal();
        // A local pending copy is retained; optimistic locking prevents overwrites on conflict.
        if (base.pulso) {
          const dirty = localStorage.getItem(key()+":pending");
          if (!dirty) initial = base.pulso;
          else if (localStorage.getItem(key()+":revision") !== revision) {
            blocked = true;
            status = "Hay cambios locales pendientes y otra versión en la nube. Exportá tu copia antes de recargar.";
          }
        }
        if (revision && !localStorage.getItem(key()+":pending"))localStorage.setItem(key()+":revision", revision);
        if (!userId) {
          try { base = JSON.parse(localStorage.getItem("lifeos-private-v2") || "{}"); } catch { /* import remains available */ }
        }
        initialized = true; initFrame();
        if(initial && localStorage.getItem(key()+":pending")){pending=initial;void saveCloud();}
      } catch { blocked = true; initial = readLocal(); initialized = true; status = "Sin conexión. Guardado en este dispositivo."; initFrame(); }
    }
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (message?.type === "pulso:ready") { frameReady = true; initFrame(); }
      if (message?.type === "pulso:save" && initialized && message.state?.S && message.state?.D) {
        try { localStorage.setItem(key(), JSON.stringify(message.state)); }
        catch { announce("No se pudo guardar en el navegador. Exportá una copia."); return; }
        pending = message.state; void saveCloud();
      }
      if (message?.type === "pulso:login") {
        const result = await db?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
        if (result?.error) announce("No se pudo iniciar sesión con Google");
      }
      if (message?.type === "pulso:logout") {
        await db?.auth.signOut({ scope: "local" }); window.location.reload();
      }
      if (message?.type === "pulso:restore" && db && userId) {
        const result = await db.from("lifeos_snapshots").select("data, updated_at").eq("user_id", userId).maybeSingle();
        if(result.error || !result.data) { announce("No se pudo recuperar tu cuenta. Tu copia local sigue intacta."); return; }
        const local = localStorage.getItem(key());
        if(local)localStorage.setItem("pulso:before-cloud-restore:"+Date.now(), local);
        localStorage.removeItem(key());localStorage.removeItem(key()+":pending");
        base=result.data.data;revision=result.data.updated_at;pending=null;blocked=false;
        if(revision)localStorage.setItem(key()+":revision",revision);
        send("pulso:replace",{state:base.pulso||null,legacy:base,key:key(),status:"Datos de tu cuenta recuperados",connected:true});
      }
      if (message?.type === "pulso:retry") {
        // Only retry against the same revision; changed cloud data still blocks the save.
        if (blocked) { announce("Exportá tu copia local y recargá para revisar la versión de tu cuenta."); return; }
        void saveCloud();
      }
    };
    window.addEventListener("message", receive);
    void initialize();
    return () => { stopped = true; window.removeEventListener("message", receive); };
  }, []);
  return <iframe ref={frame} src="/pulso/index.html" onLoad={() => frame.current?.contentWindow?.postMessage({ type: "pulso:request-ready" }, window.location.origin)} title="Pulso · Tu espacio personal" style={{ position: "fixed", inset: 0, width: "100%", height: "100dvh", border: 0, zIndex: 200, background: "#f7f8f5" }} />;
}
