"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "./account.css";

type PulsoState = { S: Record<string, unknown>; D: Record<string, unknown> };
type SnapshotData = Record<string, unknown> & { pulso?: PulsoState };

// Keep the supplied UI isolated from legacy styles; both documents share the same origin.
export default function PulsoPage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, values = new FormData(form), db = createClient();
    if (!db) return;
    setAuthBusy(true); setAuthError("");
    try {
      const { error } = await db.auth.signInWithPassword({ email: String(values.get("email") || "").trim(), password: String(values.get("password") || "") });
      if (error) { setAuthError("No se pudo iniciar sesión. Revisá el correo y la contraseña de tu cuenta de Traka."); return; }
      form.reset(); window.location.reload();
    } catch { setAuthError("No se pudo conectar. Volvé a intentarlo."); }
    finally { setAuthBusy(false); }
  }
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
            result = await db.from("personal_snapshots").update({ data, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("updated_at", revision).select("updated_at").maybeSingle();
          } else {
            // Insert, never upsert: a competing first save must not overwrite another device.
            result = await db.from("personal_snapshots").insert({ user_id: userId, data, schema_version: 3 }).select("updated_at").maybeSingle();
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
          const result = await db.from("personal_snapshots").select("data, updated_at").eq("user_id", userId).maybeSingle();
          if (result.error) { blocked = true; status = "No se pudo leer la nube. Tus cambios se guardarán localmente."; }
          else {
            base = result.data?.data || {};
            revision = result.data?.updated_at || null;
            status = "Sincronizado con tu cuenta";
          }
        }
        initial = readLocal();
        // First account save can adopt this device's real records; the guest copy stays intact.
        // Never replace an existing cloud account with guest or example data.
        if (userId && !initial && !base.pulso && !blocked) {
          try {
            const guest = JSON.parse(localStorage.getItem("pulso:v1") || "null") as PulsoState | null;
            if (guest?.S && !guest.S.demo) {
              initial = guest;
              localStorage.setItem(key(), JSON.stringify(guest));
              localStorage.setItem(key()+":pending", "1");
              const active = localStorage.getItem("pulso:v1:active-time-v2");
              if (active && !localStorage.getItem(key()+":active-time-v2")) {
                localStorage.setItem(key()+":active-time-v2",active);
                localStorage.removeItem("pulso:v1:active-time-v2");
              }
            }
          } catch { /* Guest copy stays available for export. */ }
        }
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
    const phoneRequest = async (path: string, options: RequestInit = {}) => {
      if (!db || !userId) throw new Error("Iniciá sesión para conectar Pulso.");
      const session = await db.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Iniciá sesión para conectar Pulso.");
      const response = await fetch(path, { ...options, cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo conectar con Pulso.");
      return body;
    };
    const readPhone = async (extra: Record<string, unknown> = {}) => {
      try {
        const [usage, devices] = await Promise.all([phoneRequest("/api/phone/days"), phoneRequest("/api/phone/pair")]);
        send("pulso:phone-data", { days: usage.days, devices: devices.devices, ...extra });
      } catch (error) { send("pulso:phone-data", { error: error instanceof Error ? error.message : "No se pudo consultar Pulso.", ...extra }); }
    };
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (message?.type === "pulso:phone-read") await readPhone();
      if (message?.type === "pulso:phone-pair") {
        try { const pair = await phoneRequest("/api/phone/pair", { method: "POST" }); await readPhone({ token: pair.token }); }
        catch (error) { send("pulso:phone-data", { error: error instanceof Error ? error.message : "No se pudo vincular el teléfono." }); }
      }
      if (message?.type === "pulso:phone-revoke" && typeof message.id === "string") {
        try { await phoneRequest("/api/phone/pair?id=" + encodeURIComponent(message.id), { method: "DELETE" }); await readPhone({ clearToken: true }); }
        catch { send("pulso:phone-data", { error: "No se pudo desvincular el teléfono." }); }
      }
      if (message?.type === "pulso:ready") { frameReady = true; initFrame(); }
      if (message?.type === "pulso:save" && initialized && message.state?.S && message.state?.D) {
        try { localStorage.setItem(key(), JSON.stringify(message.state)); }
        catch { announce("No se pudo guardar en el navegador. Exportá una copia."); return; }
        pending = message.state; void saveCloud();
      }
      if (message?.type === "pulso:login") {
        setAuthError(""); setAuthOpen(true);
      }
      if (message?.type === "pulso:logout") {
        await db?.auth.signOut({ scope: "local" }); window.location.reload();
      }
      if (message?.type === "pulso:restore" && db && userId) {
        const result = await db.from("personal_snapshots").select("data, updated_at").eq("user_id", userId).maybeSingle();
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
  return <><iframe ref={frame} src="/pulso/index.html" onLoad={() => frame.current?.contentWindow?.postMessage({ type: "pulso:request-ready" }, window.location.origin)} title="Pulso · Tu espacio personal" style={{ position: "fixed", inset: 0, width: "100%", height: "100dvh", border: 0, zIndex: 200, background: "#f7f8f5" }} />
    {authOpen && <div className="account-overlay"><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <button className="account-close" onClick={() => setAuthOpen(false)} aria-label="Cerrar inicio de sesión">×</button>
      <p className="account-kicker">MI CUENTA</p><h1 id="account-title">Tu espacio, en todos tus dispositivos.</h1>
      <p>Entrá con el correo y la contraseña que usás en Traka. Tus registros personales se guardan de forma privada en tu cuenta.</p>
      <form onSubmit={login}><label htmlFor="account-email">Correo electrónico</label><input autoFocus id="account-email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="account-password">Contraseña</label><input id="account-password" name="password" type="password" autoComplete="current-password" required />
      {authError && <p className="account-error" role="alert">{authError}</p>}
      <button className="account-submit" disabled={authBusy} type="submit">{authBusy ? "Conectando…" : "Entrar en Mi espacio"}</button></form>
      <p className="account-footnote">Los datos que ya registraste en este dispositivo se conservan.</p>
    </section></div>}
  </>;
}
