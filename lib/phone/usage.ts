type Json = Record<string, unknown>;
function record(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Registro inválido");
  return value as Json;
}
function integer(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > max) throw new Error("Valor fuera de rango");
  return value;
}
function text(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Texto inválido");
  return value.trim();
}
export function normalizeDays(input: unknown) {
  const body = record(input);
  if (!Array.isArray(body.days) || !body.days.length || body.days.length > 31) throw new Error("Enviá entre 1 y 31 días");
  const seen = new Set<string>();
  return body.days.map(item => {
    const row = record(item), day = text(row.day, 10);
    const timestamp = Date.parse(day + "T12:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0,10) !== day || timestamp > Date.now() + 86400000 || timestamp < Date.now() - 733 * 86400000 || seen.has(day)) throw new Error("Fecha inválida o duplicada");
    seen.add(day);
    const timezone = text(row.timezone, 80);
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { throw new Error("Zona horaria inválida"); }
    const observed = text(row.observed_until, 40), observedMs = Date.parse(observed);
    if (!Number.isFinite(observedMs) || observedMs > Date.now()+300000 || observedMs < timestamp-36*3600000 || observedMs > timestamp+36*3600000) throw new Error("Hora de captura inválida");
    const p = record(row.payload);
    if (typeof row.complete !== "boolean") throw new Error("Cobertura inválida");
    const localToday = new Intl.DateTimeFormat("en-CA", {timeZone:timezone, year:"numeric", month:"2-digit", day:"2-digit"}).format(new Date());
    if (row.complete && day >= localToday) throw new Error("Un día en curso no puede marcarse completo");
    if (!Array.isArray(p.hours) || p.hours.length !== 24 || !Array.isArray(p.apps) || p.apps.length > 500) throw new Error("Detalle inválido");
    const total = integer(p.total, 90000000);
    const hours = p.hours.map(h=>integer(h, 7200000));
    if (hours.reduce((a,b)=>a+b,0) !== total) throw new Error("Las horas no coinciden con el total");
    const ids=new Set<string>();
    const apps = p.apps.map(item=>{
      const a=record(item), id=text(a.id,200);
      if(ids.has(id)) throw new Error("Aplicación duplicada"); ids.add(id);
      return {id,name:text(a.name,200),ms:integer(a.ms,90000000)};
    }).sort((a,b)=>b.ms-a.ms);
    if(apps.reduce((n,a)=>n+a.ms,0)!==total) throw new Error("Las aplicaciones no coinciden con el total");
    return {day,timezone,complete:row.complete,observed_until:new Date(observedMs).toISOString(),payload:{total,sessions:integer(p.sessions,200000),notifications:p.notifications==null?null:integer(p.notifications,200000),hours,apps}};
  });
}
