"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Download,
  Dumbbell,
  Edit3,
  Flame,
  FolderKanban,
  Footprints,
  Globe2,
  Gift,
  Heart,
  HardDrive,
  Home,
  ListTodo,
  Leaf,
  LayoutDashboard,
  MapPin,
  Menu,
  Network,
  Moon,
  MoreHorizontal,
  Pause,
  PenLine,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  Save,
  Scale,
  Smartphone,
  Settings,
  Sparkles,
  Star,
  StickyNote,
  Sun,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type View = "today" | "focus" | "habits" | "metrics" | "journal" | "gratitude" | "mindmap" | "programs" | "projects" | "bucket" | "more";
type Resource = "habit" | "habitLog" | "metric" | "journal" | "bullet" | "gratitude" | "mindNode" | "program" | "programLog" | "project" | "projectTask" | "planGoal" | "planTask" | "focusSession" | "note" | "bucketItem";
type Modal =
  | { kind: "quick" }
  | { kind: "quickFocus" }
  | { kind: "habit"; record?: Habit }
  | { kind: "metric"; record?: Metric }
  | { kind: "bullet"; record?: BulletItem; date?: string }
  | { kind: "program"; record?: Program; programKind?: "experiment" | "challenge" }
  | { kind: "programLog"; program: Program; record?: ProgramLog }
  | { kind: "project"; record?: Project }
  | { kind: "projectTask"; projects: Project[]; project?: Project; record?: ProjectTask; defaultDate?: string; defaultSprintWeek?: string; defaultItemType?: ProjectTask["itemType"] }
  | { kind: "planGoal"; projects: Project[]; record?: PlanGoal; defaultScope?: PlanGoal["scope"]; defaultPeriod?: string }
  | { kind: "planTask"; goal?: PlanGoal; goals: PlanGoal[]; projects: Project[]; record?: PlanTask; defaultPeriod?: string }
  | { kind: "note"; projects: Project[]; record?: NoteItem; projectId?: string; sprintWeek?: string }
  | { kind: "bucketItem"; record?: BucketItem }
  | { kind: "gratitude"; record?: Gratitude }
  | { kind: "mindNode"; nodes: MindNode[]; projects: Project[]; record?: MindNode; parentId?: string }
  | null;

type Habit = {
  id: string; name: string; detail: string; category: string; color: string; active: boolean; createdAt?: string;
};
type HabitLog = { id: string; habitId: string; date: string; done: boolean; notes: string };
type Metric = {
  id: string; date: string; weight: number | null; mood: number | null; energy: number | null;
  sleepHours: number | null; sleepQuality: number | null; stress: number | null;
  exerciseMinutes: number | null; activeCalories: number | null; screenTimeHours: number | null; notes: string;
};
type Journal = {
  id: string; date: string; title: string; content: string; win: string; learning: string; tomorrow: string;
};
type BulletItem = { id: string; date: string; type: string; text: string; done: boolean };
type Program = {
  id: string; kind: "experiment" | "challenge"; title: string; description: string;
  startDate: string; durationDays: number; status: string;
};
type ProgramLog = {
  id: string; programId: string; date: string; completed: boolean; rating: number | null; notes: string;
};
type Project = {
  id: string; title: string; description: string; area: string; status: string;
  priority: string; startDate: string; dueDate: string | null; color: string;
};
type ProjectTask = {
  id: string; projectId: string; title: string; description: string; status: "todo" | "doing" | "done";
  priority: string; dueDate: string | null; scheduledDate: string | null; sprintWeek: string | null;
  endDate?: string | null; estimatedMinutes: number | null; energy: "low" | "medium" | "high";
  goalId?: string | null; scheduledTime?: string | null; completedAt?: string | null;
  itemType?: "task" | "reminder" | "event";
};
type PlanGoal = {
  id: string; title: string; description: string; scope: "week" | "month" | "quarter" | "semester" | "year"; period: string;
  projectId: string | null; parentGoalId?: string | null; priority: string; status: "todo" | "doing" | "done"; targetDate: string | null;
};
type PlanTask = {
  id: string; goalId: string | null; projectId: string | null; title: string; period: string; priority: string;
  status: "todo" | "doing" | "done"; dueDate: string | null;
};
type FocusSession = {
  id: string; date: string; startedAt: string; minutes: number; category: string;
  projectId: string | null; task: string; completed: boolean; source?: "timer" | "manual";
};
type NoteItem = {
  id: string; projectId: string | null; title: string; content: string; category: string; pinned: boolean;
  sprintWeek?: string | null;
};
type BucketItem = {
  id: string; title: string; description: string; category: string; status: "pending" | "inProgress" | "completed";
  targetDate: string | null; location: string; completedAt: string | null;
};
type Gratitude = {
  id: string; date: string; text: string; person: string; why: string; shared: boolean;
};
type MindNode = {
  id: string; label: string; detail: string; area: string; parentId: string | null; color: string;
  projectId: string | null; x: number; y: number;
};
type LifeData = {
  habits: Habit[]; habitLogs: HabitLog[]; metrics: Metric[]; journals: Journal[];
  bullets: BulletItem[]; programs: Program[]; programLogs: ProgramLog[];
  projects: Project[]; projectTasks: ProjectTask[]; planGoals: PlanGoal[]; planTasks: PlanTask[];
  focusSessions: FocusSession[]; notes: NoteItem[]; bucketItems: BucketItem[];
  gratitudes: Gratitude[]; mindNodes: MindNode[];
};

const emptyData: LifeData = {
  habits: [], habitLogs: [], metrics: [], journals: [], bullets: [], programs: [], programLogs: [],
  projects: [], projectTasks: [], planGoals: [], planTasks: [], focusSessions: [], notes: [], bucketItems: [],
  gratitudes: [], mindNodes: [],
};

const storageKey = "lifeos-private-v2";
const missingValue = "—";
const focusVolumeKey = "lifeos-focus-volume";
const mindMapSeed: MindNode[] = [
  { id: "mind-self", label: "Yo", detail: "Mi vida hoy", area: "Centro", parentId: null, color: "center", projectId: null, x: 500, y: 300 },
  { id: "mind-health", label: "Salud", detail: "Cuerpo y mente", area: "Salud", parentId: "mind-self", color: "mint", projectId: null, x: 190, y: 135 },
  { id: "mind-relations", label: "Relaciones", detail: "Familia y vínculos", area: "Relaciones", parentId: "mind-self", color: "rose", projectId: null, x: 810, y: 135 },
  { id: "mind-work", label: "Trabajo y negocios", detail: "Proyectos que construyo", area: "Trabajo", parentId: "mind-self", color: "lilac", projectId: null, x: 175, y: 455 },
  { id: "mind-finance", label: "Finanzas", detail: "Seguridad y libertad", area: "Finanzas", parentId: "mind-self", color: "sand", projectId: null, x: 825, y: 455 },
  { id: "mind-learning", label: "Aprendizaje", detail: "Lo que estoy desarrollando", area: "Aprendizaje", parentId: "mind-self", color: "blue", projectId: null, x: 500, y: 80 },
  { id: "mind-experience", label: "Experiencias", detail: "Lo que quiero vivir", area: "Experiencias", parentId: "mind-self", color: "sand", projectId: null, x: 500, y: 545 },
];
const starterData: LifeData = {
  ...emptyData,
  habits: [
    { id: "starter-walk", name: "Caminar 30 min", detail: "Movimiento diario", category: "Salud física", color: "mint", active: true },
    { id: "starter-meditation", name: "Meditación", detail: "7 minutos", category: "Salud mental", color: "lilac", active: true },
    { id: "starter-reading", name: "Leer", detail: "20 minutos", category: "Crecimiento", color: "sand", active: true },
    { id: "starter-training", name: "Entrenamiento", detail: "Sesión completa", category: "Salud física", color: "rose", active: true },
  ],
  mindNodes: mindMapSeed,
};

const navItems = [
  { id: "today" as View, label: "Hoy", icon: Home },
  { id: "focus" as View, label: "Enfoque y tiempo", icon: Timer },
  { id: "habits" as View, label: "Hábitos", icon: Flame },
  { id: "metrics" as View, label: "Métricas", icon: BarChart3 },
  { id: "journal" as View, label: "Journal", icon: PenLine },
  { id: "gratitude" as View, label: "Agradecimientos", icon: Gift },
  { id: "mindmap" as View, label: "Mapa vital", icon: Network },
  { id: "projects" as View, label: "Plan personal", icon: FolderKanban },
  { id: "bucket" as View, label: "Bucket list", icon: Star },
  { id: "programs" as View, label: "Experimentos y retos", icon: Rocket },
];

export default function HomePage() {
  const [view, setView] = useState<View>("today");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<LifeData>(emptyData);
  const [storageReady, setStorageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [cloudUser, setCloudUser] = useState<string | null>(null);
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState("Solo local");
  const supabaseRef = useRef(createClient());
  const dataRef = useRef(data);
  const cloudHydratedRef = useRef(false);
  const lastSyncedDataRef = useRef("");
  const snapshotVersionRef = useRef<string | null>(null);
  const today = argentinaDateKey(new Date());

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        const savedData = stored ? parseStoredData(stored) : starterData;
        setData(savedData);
        setError("");
      } catch {
        setData(starterData);
        setError("No pudimos leer los datos guardados en este navegador.");
      } finally {
        setStorageReady(true);
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(data));
        setError((current) => current === "No pudimos guardar los últimos cambios en este navegador." ? "" : current);
      } catch {
        setError("No pudimos guardar los últimos cambios en este navegador.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [data, storageReady]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    const applySession = (session: { user: { id: string; email?: string } } | null) => {
      setCloudUser(session?.user.email ?? null);
      setCloudUserId(session?.user.id ?? null);
      if (!session) cloudHydratedRef.current = false;
    };
    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      applySession(sessionData.session);
      if (sessionError) setCloudStatus("Vuelve a conectar Google");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session);
      if (event === "TOKEN_REFRESHED") setCloudStatus("Sincronizado");
      if (event === "SIGNED_OUT") setCloudStatus("Sesión cerrada en este dispositivo");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !cloudUserId || !storageReady) return;
    let cancelled = false;
    setCloudStatus("Recuperando…");
    void supabase.from("lifeos_snapshots").select("data, updated_at").eq("user_id", cloudUserId).maybeSingle().then(async ({ data: snapshot, error: syncError }) => {
      if (cancelled) return;
      if (syncError) { setCloudStatus("Error al recuperar"); return; }
      if (snapshot?.data) {
        const cloudData = parseStoredData(JSON.stringify(snapshot.data));
        const merged = mergeLifeData(cloudData, dataRef.current, prefersDesktopMaster());
        snapshotVersionRef.current = snapshot.updated_at ?? null;
        lastSyncedDataRef.current = JSON.stringify(cloudData);
        setData(merged);
        setCloudStatus("Sincronizado");
      } else if (hasPersonalData(dataRef.current)) {
        const serialized = JSON.stringify(dataRef.current);
        const { data: uploaded, error: uploadError } = await supabase.from("lifeos_snapshots").upsert({ user_id: cloudUserId, data: dataRef.current, schema_version: 3, updated_at: new Date().toISOString() }).select("updated_at").maybeSingle();
        if (cancelled) return;
        if (!uploadError) {
          lastSyncedDataRef.current = serialized;
          snapshotVersionRef.current = uploaded?.updated_at ?? null;
        }
        setCloudStatus(uploadError ? "Error al sincronizar" : "Sincronizado");
      } else {
        setCloudStatus("Sin datos en la nube");
      }
      cloudHydratedRef.current = true;
    });
    return () => { cancelled = true; };
  }, [cloudUserId, storageReady]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !cloudUserId || !storageReady || !cloudHydratedRef.current) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastSyncedDataRef.current || !hasPersonalData(data)) return;
    setCloudStatus("Sincronizando…");
    const timer = window.setTimeout(() => {
      let request = supabase.from("lifeos_snapshots").update({ data, schema_version: 3, updated_at: new Date().toISOString() }).eq("user_id", cloudUserId);
      if (snapshotVersionRef.current) request = request.eq("updated_at", snapshotVersionRef.current);
      void request.select("updated_at").maybeSingle().then(async ({ data: saved, error: syncError }) => {
        if (syncError) { setCloudStatus("Error al sincronizar"); return; }
        if (saved) {
          snapshotVersionRef.current = saved.updated_at;
          lastSyncedDataRef.current = serialized;
          setCloudStatus("Sincronizado");
          return;
        }
        const { data: fresh, error: refreshError } = await supabase.from("lifeos_snapshots").select("data, updated_at").eq("user_id", cloudUserId).maybeSingle();
        if (refreshError || !fresh?.data) { setCloudStatus("Conflicto de sincronización"); return; }
        const cloudData = parseStoredData(JSON.stringify(fresh.data));
        const merged = mergeLifeData(cloudData, data, prefersDesktopMaster());
        snapshotVersionRef.current = fresh.updated_at ?? null;
        lastSyncedDataRef.current = JSON.stringify(cloudData);
        setData(merged);
        setCloudStatus("Cambios de otro dispositivo recuperados");
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [cloudUserId, data, storageReady]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase || !cloudUserId) return;
    const channel = supabase.channel(`lifeos-${cloudUserId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "lifeos_snapshots", filter: `user_id=eq.${cloudUserId}` }, (payload) => {
      const incoming = (payload.new as { data?: unknown }).data;
      if (!incoming) return;
      const parsed = parseStoredData(JSON.stringify(incoming));
      const serialized = JSON.stringify(parsed);
      if (serialized === lastSyncedDataRef.current) return;
      snapshotVersionRef.current = (payload.new as { updated_at?: string }).updated_at ?? snapshotVersionRef.current;
      lastSyncedDataRef.current = serialized;
      setData(parsed);
      setCloudStatus("Sincronizado");
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [cloudUserId]);

  const save = useCallback(async (resource: Resource, payload: Record<string, unknown>, message = "Registro guardado") => {
    setData((current) => saveLocalRecord(current, resource, payload));
    setModal(null);
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const remove = useCallback(async (resource: Resource, id: string) => {
    if (!window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    setData((current) => removeLocalRecord(current, resource, id));
    setToast("Registro eliminado");
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const downloadData = useCallback(() => {
    const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lifeos-copia-${today}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setToast("Copia descargada");
    window.setTimeout(() => setToast(""), 2200);
  }, [data, today]);

  const loginWithGoogle = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) { setToast("Falta conectar el entorno de Supabase"); return; }
    const { error: loginError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (loginError) setToast("No se pudo iniciar sesión con Google");
  }, []);

  const logoutCloud = useCallback(async () => {
    await supabaseRef.current?.auth.signOut({ scope: "local" });
    setCloudUserId(null);
    setCloudStatus("Solo local");
  }, []);

  const pushCloud = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setCloudStatus("Sincronizando…");
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setCloudStatus("Inicia sesión"); return; }
    lastSyncedDataRef.current = "";
    setData({ ...data });
    setCloudStatus("Sincronizando…");
    setToast("Sincronización iniciada");
    window.setTimeout(() => setToast(""), 2400);
  }, [data]);

  const pullCloud = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setCloudStatus("Recuperando…");
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setCloudStatus("Inicia sesión"); return; }
    const { data: snapshot, error: syncError } = await supabase.from("lifeos_snapshots").select("data, updated_at").eq("user_id", authData.user.id).maybeSingle();
    if (syncError) { setCloudStatus("Error al recuperar"); return; }
    if (!snapshot?.data) { setCloudStatus("Sin copia en la nube"); return; }
    const cloudData = parseStoredData(JSON.stringify(snapshot.data));
    const merged = mergeLifeData(cloudData, dataRef.current, prefersDesktopMaster());
    snapshotVersionRef.current = snapshot.updated_at ?? null;
    lastSyncedDataRef.current = JSON.stringify(cloudData);
    setData(merged);
    setCloudStatus("Copia recuperada");
    setToast("Datos recuperados de la nube");
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const importBackup = useCallback(async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { data?: unknown };
      setData(parseStoredData(JSON.stringify(parsed.data ?? parsed)));
      setToast(cloudUserId ? "Copia importada · sincronización automática activa" : "Copia importada");
      window.setTimeout(() => setToast(""), 2600);
    } catch { setToast("La copia no tiene un formato válido"); }
  }, [cloudUserId]);

  const toggleHabit = useCallback(async (habit: Habit, date = today) => {
    const log = data.habitLogs.find((item) => item.habitId === habit.id && item.date === date);
    await save("habitLog", { id: log?.id, habitId: habit.id, date, done: !log?.done, notes: log?.notes ?? "" }, !log?.done ? "Hábito completado" : "Hábito desmarcado");
  }, [data.habitLogs, save, today]);

  const toggleBullet = useCallback(async (item: BulletItem) => {
    await save("bullet", { ...item, done: !item.done }, !item.done ? "Tarea completada" : "Tarea reabierta");
  }, [save]);

  const titles: Record<View, string> = {
    today: "Tu centro de mando", habits: "Tus hábitos",
    focus: "Tu tiempo de enfoque",
    metrics: "Tu salud en datos", journal: "Un espacio para pensar",
    gratitude: "Lo bueno que te rodea", mindmap: "Tu mapa vital",
    programs: "Laboratorio personal", projects: "Plan personal",
    bucket: "Cosas que quiero vivir", more: "Tu LifeOS",
  };

  function navigate(viewId: View) {
    setView(viewId);
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><div><strong>LifeOS</strong><span>Espacio personal</span></div></div>
        <nav className="side-nav" aria-label="Navegación principal">
          <p className="nav-eyebrow">Mi espacio</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
          <p className="nav-eyebrow nav-eyebrow-spaced">Sistema</p>
          <button onClick={() => setView("more")} className={view === "more" ? "active" : ""}><Settings size={19} /><span>Ajustes y datos</span></button>
        </nav>
        <div className="sidebar-bottom"><div className="profile"><div className="avatar">YO</div><div><strong>Mi LifeOS</strong><span>Espacio privado</span></div><MoreHorizontal size={18} /></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir todos los módulos" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="topbar-title"><span>{formatLongDate(today)}</span><h1>{titles[view]}</h1></div>
          <div className="top-actions">
            <button className="sync-state cloud-sync-button" onClick={cloudUser ? pushCloud : loginWithGoogle}>{cloudUser ? <Globe2 size={14} /> : <HardDrive size={14} />}{cloudUser ? cloudStatus : "Local · conectar Google"}</button>
            <button className="primary-button" onClick={() => setModal({ kind: "quick" })}><Plus size={18} /> Registrar</button>
            <div className="avatar avatar-top">YO</div>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}
        {loading ? <LoadingState /> : (
          <>
            {view === "today" && <TodayView data={data} today={today} onToggleHabit={toggleHabit} onToggleBullet={toggleBullet} onNavigate={navigate} onOpen={setModal} />}
            {view === "focus" && <FocusView data={data} today={today} onSave={save} onDelete={(id) => remove("focusSession", id)} />}
            {view === "habits" && <HabitsView data={data} today={today} onToggle={toggleHabit} onOpen={setModal} onDelete={(id) => remove("habit", id)} />}
            {view === "metrics" && <MetricsView data={data} onOpen={setModal} onDelete={(id) => remove("metric", id)} />}
            {view === "journal" && <JournalView data={data} today={today} onSave={save} onOpen={setModal} onToggleBullet={toggleBullet} onDelete={remove} />}
            {view === "gratitude" && <GratitudeView data={data} today={today} onOpen={setModal} onDelete={(id) => remove("gratitude", id)} />}
            {view === "mindmap" && <MindMapView data={data} onOpen={setModal} onDelete={(id) => remove("mindNode", id)} />}
            {view === "programs" && <ProgramsView data={data} today={today} onOpen={setModal} onDelete={(id) => remove("program", id)} />}
            {view === "projects" && <ProjectsView data={data} today={today} onOpen={setModal} onSave={save} onDelete={remove} />}
            {view === "bucket" && <BucketListView items={data.bucketItems} today={today} onOpen={setModal} onSave={save} onDelete={(id) => remove("bucketItem", id)} />}
            {view === "more" && <MoreView data={data} onNavigate={navigate} onDownload={downloadData} onImport={importBackup} cloudUser={cloudUser} cloudStatus={cloudStatus} onLogin={loginWithGoogle} onLogout={logoutCloud} onPush={pushCloud} onPull={pullCloud} />}
          </>
        )}
      </main>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {[
          { id: "today" as View, label: "Hoy", icon: Home },
          { id: "focus" as View, label: "Enfoque", icon: Timer },
          { id: "projects" as View, label: "Trabajo", icon: FolderKanban },
          { id: "more" as View, label: "Más", icon: MoreHorizontal },
        ].map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={20} /><span>{label}</span></button>)}
      </nav>
      {mobileMenuOpen && <div className="mobile-drawer-backdrop" onMouseDown={() => setMobileMenuOpen(false)}>
        <aside className="mobile-drawer" onMouseDown={(event) => event.stopPropagation()}>
          <div className="mobile-drawer-heading">
            <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><div><strong>LifeOS</strong><span>Todos tus módulos</span></div></div>
            <button className="icon-button" aria-label="Cerrar menú" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
          </div>
          <nav aria-label="Todos los módulos">
            {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)}><span className="mobile-drawer-icon"><Icon size={19} /></span><span>{label}</span><ArrowRight size={15} /></button>)}
            <button className={view === "more" ? "active" : ""} onClick={() => navigate("more")}><span className="mobile-drawer-icon"><Settings size={19} /></span><span>Ajustes y datos</span><ArrowRight size={15} /></button>
          </nav>
        </aside>
      </div>}
      <button className="mobile-fab" onClick={() => setModal({ kind: "quick" })} aria-label="Registrar"><Plus size={24} /></button>
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      {modal && <RecordModal modal={modal} data={data} today={today} close={() => setModal(null)} save={save} navigate={setView} open={setModal} />}
    </div>
  );
}

function TodayView({ data, today, onToggleHabit, onToggleBullet, onNavigate, onOpen }: {
  data: LifeData; today: string;
  onToggleHabit: (habit: Habit, date?: string) => Promise<void>; onToggleBullet: (item: BulletItem) => Promise<void>;
  onNavigate: (view: View) => void; onOpen: (modal: Modal) => void;
}) {
  const todayLogs = data.habitLogs.filter((log) => log.date === today && log.done);
  const todayMetric = data.metrics.find((item) => item.date === today);
  const todayBullets = data.bullets.filter((item) => item.date === today);
  const activeProjects = data.projects.filter((project) => project.status === "active");
  const activeHabits = data.habits.filter((habit) => habit.active);
  const focusToday = data.focusSessions.filter((session) => session.date === today).reduce((sum, session) => sum + session.minutes, 0);
  const weekEnd = addDays(today, 7);
  const upcomingProjectTasks = data.projectTasks.filter((task) => task.status !== "done" && task.scheduledDate && task.scheduledDate >= today && task.scheduledDate <= weekEnd);
  const upcomingGoals = data.planGoals.filter((goal) => !goalCompletion(goal, data.planTasks, data.projectTasks).complete && goal.targetDate && goal.targetDate >= today && goal.targetDate <= weekEnd);
  const upcomingPlan = [
    ...upcomingProjectTasks.map((task) => ({ id: task.id, title: task.title, date: task.scheduledDate as string, type: "Sprint", projectId: task.projectId })),
    ...upcomingGoals.map((goal) => ({ id: goal.id, title: goal.title, date: goal.targetDate as string, type: "Objetivo", projectId: goal.projectId })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  const percent = activeHabits.length ? Math.round(todayLogs.filter((log) => activeHabits.some((habit) => habit.id === log.habitId)).length / activeHabits.length * 100) : 0;
  const weekDays = lastDays(today, 7);
  const weekMetrics = data.metrics.filter((metric) => weekDays.includes(metric.date));
  const weekWeight = weekMetrics.find((metric) => metric.weight != null)?.weight;
  const weekMood = average(weekMetrics.map((metric) => metric.mood));
  const weekHabitLogs = data.habitLogs.filter((log) => log.done && weekDays.includes(log.date) && activeHabits.some((habit) => habit.id === log.habitId));
  const weekFocus = data.focusSessions.filter((session) => weekDays.includes(session.date)).reduce((sum, session) => sum + session.minutes, 0);
  const journalStreak = streakStats(data.journals.map((item) => item.date), today);
  const checkinStreak = streakStats(data.metrics.map((item) => item.date), today);
  const habitStreaks = activeHabits.map((habit) => ({ habit, ...streakStats(data.habitLogs.filter((log) => log.habitId === habit.id && log.done).map((log) => log.date), today) })).sort((a, b) => b.current - a.current || b.best - a.best);
  return (
    <div className="page-content today-page">
      <section className="welcome-card">
        <div className="welcome-copy">
          <span className="section-label"><Sun size={15} /> REGISTRO DE HOY</span>
          <h2>Haz que hoy cuente.</h2>
          <p>Registra lo que haces, cómo te sientes y qué estás aprendiendo. Tus datos se guardan al momento.</p>
          <div className="welcome-stats"><div><strong>{activeProjects.length}</strong><span>proyectos</span></div><div><strong>{todayBullets.filter((item) => !item.done).length}</strong><span>pendientes</span></div><div><strong>{percent}%</strong><span>hábitos</span></div></div>
        </div>
        <div className="orbit-wrap" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="planet"><Moon size={30} /></div><span className="tiny-star star-one">✦</span><span className="tiny-star star-two">·</span><span className="tiny-star star-three">✧</span></div>
      </section>
      <section className="card weekly-life-card">
        <div className="card-heading"><div><span className="section-label dark"><Sparkles size={14} /> TU SEMANA EN LIFEOS</span><h3>Una mirada a los últimos 7 días</h3></div><small>{formatTinyDate(weekDays[0])} — {formatTinyDate(today)}</small></div>
        <div className="weekly-life-grid"><div><Scale size={16} /><span>Peso</span><strong>{metricValue(weekWeight, "kg")}</strong></div><div><Heart size={16} /><span>Ánimo medio</span><strong>{weekMood == null ? missingValue : `${formatDecimal(weekMood)}/5`}</strong></div><div><CheckCircle2 size={16} /><span>Hábitos hechos</span><strong>{weekHabitLogs.length}</strong></div><div><Timer size={16} /><span>Tiempo de foco</span><strong>{formatMinutes(weekFocus)}</strong></div><div><PenLine size={16} /><span>Racha journal</span><strong>{journalStreak.current} días</strong></div></div>
        <div className="dashboard-streaks"><span><Flame size={14} /> Mejor hábito actual: <strong>{habitStreaks[0]?.current ? `${habitStreaks[0].habit.name} · ${habitStreaks[0].current} días` : missingValue}</strong></span><span><BookOpen size={14} /> Journal: <strong>{journalStreak.current} actual · {journalStreak.best} mejor</strong></span><span><BarChart3 size={14} /> Check-in: <strong>{checkinStreak.current} actual · {checkinStreak.best} mejor</strong></span></div>
      </section>
      <div className="dashboard-grid">
        <div className="left-column">
          <section className="card">
            <div className="card-heading"><div><span className="section-label dark"><Flame size={14} /> RITUALES</span><h3>Hábitos de hoy</h3></div><button className="text-button" onClick={() => onNavigate("habits")}>Gestionar <ArrowRight size={15} /></button></div>
            <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
            {activeHabits.length ? <div className="habit-grid">{activeHabits.slice(0, 6).map((habit) => {
              const done = todayLogs.some((log) => log.habitId === habit.id);
              return <button key={habit.id} className={`habit ${habit.color} ${done ? "completed" : ""}`} onClick={() => onToggleHabit(habit)}><span className="habit-icon">{habitCategoryIcon(habit.category, 18)}</span><span><strong>{habit.name}</strong><small>{habit.detail || habit.category}</small></span><span className="habit-check">{done && <Check size={14} />}</span></button>;
            })}</div> : <EmptyState text="Aún no tienes hábitos. Crea el primero para empezar." action="Crear hábito" onClick={() => onOpen({ kind: "habit" })} />}
          </section>
          <section className="card">
            <div className="card-heading"><div><span className="section-label dark"><ListTodo size={14} /> BULLET LIST</span><h3>Lo importante de hoy</h3></div><button className="add-inline top" onClick={() => onOpen({ kind: "bullet" })}><Plus size={15} /> Añadir</button></div>
            <div className="task-list">{todayBullets.slice(0, 6).map((item, index) => <button className={`task ${item.done ? "task-done" : ""}`} key={item.id} onClick={() => onToggleBullet(item)}><span className="task-number">{item.done ? <Check size={15} /> : `0${index + 1}`}</span><span>{item.text}</span>{item.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button>)}</div>
            {!todayBullets.length && <EmptyState text="Tu lista está vacía. Añade una tarea, nota o evento." />}
          </section>
          <section className="card upcoming-plan-card">
            <div className="card-heading"><div><span className="section-label dark"><CalendarDays size={14} /> PRÓXIMOS 7 DÍAS</span><h3>Lo que viene esta semana</h3></div><button className="add-inline top" onClick={() => onNavigate("projects")}><Plus size={15} /> Tarea</button></div>
            <div className="upcoming-plan-list">{upcomingPlan.map((item) => {
              const project = data.projects.find((entry) => entry.id === item.projectId);
              return <button key={`${item.type}-${item.id}`} onClick={() => onNavigate("projects")}><span className={`upcoming-date ${item.date === today ? "today" : ""}`}><strong>{item.date === today ? "HOY" : shortDay(item.date)}</strong><small>{item.date.slice(-2)}</small></span><span><strong>{item.title}</strong><small>{item.type}{project ? ` · ${project.title}` : ""}</small></span><ArrowRight size={15} /></button>;
            })}</div>
            {!upcomingPlan.length && <EmptyState text="No hay tareas de sprint ni objetivos durante los próximos siete días." action="Abrir sprint" onClick={() => onNavigate("projects")} />}
            {!!upcomingPlan.length && <button className="text-button upcoming-all" onClick={() => onNavigate("projects")}>Abrir espacio de trabajo <ArrowRight size={14} /></button>}
          </section>
        </div>
        <div className="right-column">
          <section className="card focus-preview-card">
            <div className="card-heading"><div><span className="section-label dark"><Timer size={14} /> ENFOQUE</span><h3>Trabajo de hoy</h3></div><button className="icon-button small" onClick={() => onNavigate("focus")}><ArrowRight size={17} /></button></div>
            <button className="focus-preview-main" onClick={() => onNavigate("focus")}><span><Timer size={22} /></span><div><strong>{formatMinutes(focusToday)}</strong><small>{data.focusSessions.filter((session) => session.date === today).length} sesiones registradas</small></div><Play size={18} /></button>
          </section>
          <section className="card checkin-card">
            <div className="card-heading compact"><div><span className="section-label dark"><Heart size={14} /> CHECK-IN</span><h3>¿Cómo estás?</h3></div><button className="icon-button small" onClick={() => onOpen({ kind: "metric", record: todayMetric })}><Edit3 size={15} /></button></div>
            {todayMetric ? <>
              <div className="mood-display"><span>{moodEmoji(todayMetric.mood) || missingValue}</span><div><strong>{todayMetric.mood == null ? `Ánimo ${missingValue}` : `Ánimo ${todayMetric.mood}/5`}</strong><small>{todayMetric.energy == null ? `Energía ${missingValue}` : `Energía ${todayMetric.energy}/10`} · {todayMetric.stress == null ? `Estrés ${missingValue}` : `Estrés ${todayMetric.stress}/10`}</small></div></div>
              <div className="metric-row"><div className="metric-icon"><Scale size={18} /></div><div><span>Peso actual</span><strong>{metricValue(todayMetric.weight, "kg")}</strong></div><span className="metric-change">{todayMetric.sleepHours == null ? missingValue : `${formatNumber(todayMetric.sleepHours)} h sueño`}</span></div>
            </> : <EmptyState text="Todavía no has registrado tus métricas de hoy." action="Registrar ahora" onClick={() => onOpen({ kind: "metric" })} />}
          </section>
          <section className="card project-preview-card">
            <div className="card-heading"><div><span className="section-label dark"><FolderKanban size={14} /> PROYECTOS</span><h3>En marcha</h3></div><button className="icon-button small" onClick={() => onNavigate("projects")}><ArrowRight size={17} /></button></div>
            {activeProjects.slice(0, 3).map((project) => {
              const tasks = data.projectTasks.filter((task) => task.projectId === project.id);
              const done = tasks.filter((task) => task.status === "done").length;
              const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
              return <button className="project-preview-row" key={project.id} onClick={() => onNavigate("projects")}><span className={`module-icon ${project.color}`}><FolderKanban size={17} /></span><span><strong>{project.title}</strong><small>{done}/{tasks.length} tareas · {progress}%</small></span><ArrowRight size={15} /></button>;
            })}
            {!activeProjects.length && <EmptyState text="Crea un proyecto para organizar tus negocios e ideas." action="Nuevo proyecto" onClick={() => onOpen({ kind: "project" })} />}
          </section>
          <ActiveProgram data={data} today={today} onOpen={onOpen} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

function FocusView({ data, today, onSave, onDelete }: {
  data: LifeData; today: string;
  onSave: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const modes = { focus: 45, break: 10 } as const;
  const [mode, setMode] = useState<keyof typeof modes>("focus");
  const [remaining, setRemaining] = useState(modes.focus * 60);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [task, setTask] = useState("");
  const [category, setCategory] = useState("Trabajo profundo");
  const [projectId, setProjectId] = useState("");
  const [volume, setVolume] = useState(50);
  const [manualDate, setManualDate] = useState(today);
  const [manualTask, setManualTask] = useState("");
  const [manualMinutes, setManualMinutes] = useState("45");
  const [manualCategory, setManualCategory] = useState("Trabajo profundo");
  const [manualProjectId, setManualProjectId] = useState("");
  const startedAtRef = useRef<string | null>(null);
  const savedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeHydratedRef = useRef(false);
  const fiveMinuteAlertedRef = useRef(false);
  const lastRemainingRef = useRef(modes.focus * 60);
  const durationSeconds = modes[mode] * 60;
  const elapsedSeconds = Math.max(0, durationSeconds - remaining);
  const progress = Math.min(100, elapsedSeconds / durationSeconds * 100);
  const weekDays = lastDays(today, 7);
  const weekSessions = data.focusSessions.filter((session) => session.date >= weekDays[0] && session.date <= today);
  const todaySessions = data.focusSessions.filter((session) => session.date === today);
  const weekMinutes = weekSessions.reduce((sum, session) => sum + session.minutes, 0);
  const todayMinutes = todaySessions.reduce((sum, session) => sum + session.minutes, 0);
  const categoryNames = focusCategoryNames(data.focusSessions);
  const categoryTotals = categoryNames.map((name) => ({ name, minutes: weekSessions.filter((session) => session.category === name).reduce((sum, session) => sum + session.minutes, 0) })).filter((item) => item.minutes > 0).sort((a, b) => b.minutes - a.minutes);
  const projectTotals = data.projects.map((project) => ({ project, minutes: weekSessions.filter((session) => session.projectId === project.id).reduce((sum, session) => sum + session.minutes, 0) })).filter((item) => item.minutes > 0).sort((a, b) => b.minutes - a.minutes);
  const maxDayMinutes = Math.max(25, ...weekDays.map((date) => weekSessions.filter((session) => session.date === date).reduce((sum, session) => sum + session.minutes, 0)));
  const focusAxisMax = Math.max(30, Math.ceil(maxDayMinutes / 30) * 30);

  useEffect(() => {
    const rawVolume = window.localStorage.getItem(focusVolumeKey);
    if (rawVolume === null) return;
    const storedVolume = Number(rawVolume);
    if (!Number.isFinite(storedVolume) || storedVolume < 0 || storedVolume > 100) return;
    const timer = window.setTimeout(() => setVolume(storedVolume), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!volumeHydratedRef.current) {
      volumeHydratedRef.current = true;
      return;
    }
    window.localStorage.setItem(focusVolumeKey, String(volume));
  }, [volume]);

  const playTimerSound = useCallback((kind: "start" | "warning" | "finish") => {
    if (volume === 0) return;
    try {
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const patterns = kind === "start"
        ? [{ frequency: 520, delay: 0, duration: .13 }, { frequency: 700, delay: .16, duration: .18 }]
        : kind === "warning"
          ? [{ frequency: 760, delay: 0, duration: .16 }, { frequency: 760, delay: .25, duration: .16 }]
          : [{ frequency: 660, delay: 0, duration: .18 }, { frequency: 880, delay: .22, duration: .2 }, { frequency: 1040, delay: .48, duration: .3 }];
      patterns.forEach(({ frequency, delay, duration }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.32 * volume / 100), context.currentTime + delay + .02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + duration + .02);
      });
    } catch { /* El temporizador sigue funcionando si el navegador bloquea el audio. */ }
  }, [volume]);

  useEffect(() => {
    if (!running || !endAt) return;
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (mode === "focus" && next <= 5 * 60 && lastRemainingRef.current > 5 * 60 && !fiveMinuteAlertedRef.current) {
        fiveMinuteAlertedRef.current = true;
        playTimerSound("warning");
      }
      lastRemainingRef.current = next;
      if (next === 0) {
        window.clearInterval(timer);
        playTimerSound("finish");
        if (mode === "focus" && !savedRef.current) {
          savedRef.current = true;
          void onSave("focusSession", { date: today, startedAt: startedAtRef.current ?? new Date().toISOString(), minutes: 45, category: category.trim() || "Trabajo", projectId, task: task.trim() || "Sesión de enfoque", completed: true, source: "timer" }, "45 minutos guardados · empieza tu pausa");
          startedAtRef.current = null;
          savedRef.current = false;
          setMode("break");
          setRemaining(10 * 60);
          lastRemainingRef.current = 10 * 60;
          fiveMinuteAlertedRef.current = false;
          setEndAt(Date.now() + 10 * 60 * 1000);
          setRunning(true);
        } else {
          setRunning(false);
          setEndAt(null);
        }
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, endAt, mode, category, projectId, task, today, onSave, playTimerSound]);

  function selectMode(nextMode: keyof typeof modes) {
    setMode(nextMode); setRemaining(modes[nextMode] * 60); lastRemainingRef.current = modes[nextMode] * 60; fiveMinuteAlertedRef.current = false; setRunning(false); setEndAt(null); startedAtRef.current = null; savedRef.current = false;
  }
  function toggleTimer() {
    if (remaining === 0) { setRemaining(durationSeconds); savedRef.current = false; }
    if (running) {
      setRemaining(Math.max(0, Math.ceil(((endAt ?? Date.now()) - Date.now()) / 1000)));
      setRunning(false); setEndAt(null);
    } else {
      if (mode === "focus" && !task.trim()) return;
      if (!startedAtRef.current && remaining === durationSeconds) playTimerSound("start");
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
      setEndAt(Date.now() + (remaining || durationSeconds) * 1000); setRunning(true);
    }
  }
  function resetTimer() {
    setRunning(false); setEndAt(null); setRemaining(durationSeconds); lastRemainingRef.current = durationSeconds; fiveMinuteAlertedRef.current = false; startedAtRef.current = null; savedRef.current = false;
  }
  async function finishPartial() {
    if (mode !== "focus" || elapsedSeconds <= 0 || savedRef.current) return;
    savedRef.current = true;
    setRunning(false); setEndAt(null);
    await onSave("focusSession", { date: today, startedAt: startedAtRef.current ?? new Date().toISOString(), minutes: Math.max(1, Math.round(elapsedSeconds / 60)), category: category.trim() || "Trabajo", projectId, task: task.trim() || "Sesión de enfoque", completed: false, source: "timer" }, "Tiempo trabajado guardado");
    setRemaining(durationSeconds); startedAtRef.current = null; savedRef.current = false; setTask("");
  }

  async function saveManualSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Math.max(1, Math.round(Number(manualMinutes) || 0));
    if (!manualTask.trim() || !manualDate || minutes < 1) return;
    await onSave("focusSession", {
      date: manualDate,
      startedAt: new Date(`${manualDate}T12:00:00`).toISOString(),
      minutes,
      category: manualCategory.trim() || "Trabajo",
      projectId: manualProjectId,
      task: manualTask.trim(),
      completed: true,
      source: "manual",
    }, "Tiempo manual guardado");
    setManualTask("");
    setManualMinutes("45");
  }

  return <div className="page-content subpage focus-page">
    <section className="section-intro"><div><span className="section-label dark"><Timer size={14} /> POMODORO Y TIEMPO</span><h2>Trabaja con intención, no solo más horas</h2><p>Concentra el trabajo en bloques, registra cada sesión y descubre dónde estás invirtiendo tu tiempo.</p></div><span className="focus-week-pill"><BriefcaseBusiness size={15} /> {formatMinutes(weekMinutes)} esta semana</span></section>
    <div className="focus-layout">
      <section className={`focus-timer-card ${mode !== "focus" ? "break" : ""}`}>
        <div className="focus-mode-tabs"><button className={mode === "focus" ? "active" : ""} onClick={() => selectMode("focus")}>Trabajo · 45 min</button><button className={mode === "break" ? "active" : ""} onClick={() => selectMode("break")}>Descanso · 10 min</button></div>
        <div className="timer-ring" style={{ "--timer-progress": `${progress * 3.6}deg` } as React.CSSProperties}><div><span>{mode === "focus" ? "TIEMPO DE ENFOQUE" : "DESCANSO"}</span><strong>{formatTimer(remaining)}</strong><small>{running ? "Sesión en marcha" : remaining === 0 ? "Bloque terminado" : "Listo para empezar"}</small></div></div>
        {mode === "focus" ? <div className="focus-session-form">
          <label>¿En qué vas a trabajar?<input value={task} disabled={running} onChange={(event) => setTask(event.target.value)} placeholder="Ej. Preparar propuesta para un cliente" /></label>
          <div className="form-grid"><CategoryPicker value={category} categories={categoryNames} disabled={running} onChange={setCategory} /><label>Proyecto<select value={projectId} disabled={running} onChange={(event) => setProjectId(event.target.value)}><option value="">Sin proyecto</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></div>
        </div> : <p className="break-copy">Aléjate de la pantalla, muévete y deja que la mente descanse. Los descansos no se suman al tiempo trabajado.</p>}
        {mode === "focus" && !task.trim() && !running && <small className="timer-help">Escribe una tarea concreta antes de iniciar el temporizador.</small>}
        {mode === "focus" && task.trim() && <small className="timer-help auto-break-help">Al completar los 45 minutos, la pausa de 10 minutos comenzará automáticamente.</small>}
        <div className="timer-sound-control">
          <Volume2 size={15} />
          <label htmlFor="focus-volume">Volumen</label>
          <input id="focus-volume" type="range" min="0" max="100" step="5" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volumen de los avisos" />
          <strong>{volume}%</strong>
          <button type="button" onClick={() => playTimerSound("start")}>Probar sonido</button>
        </div>
        <small className="timer-sound-help">Avisos al iniciar, cuando queden 5 minutos y al terminar. El volumen se guarda en este navegador.</small>
        <div className="timer-actions"><button className="timer-reset" onClick={resetTimer} aria-label="Reiniciar temporizador"><RotateCcw size={18} /></button><button className="timer-primary" disabled={mode === "focus" && !task.trim()} onClick={toggleTimer}>{running ? <Pause size={19} /> : <Play size={19} />}{running ? "Pausar" : remaining === 0 ? "Reiniciar" : "Empezar"}</button>{mode === "focus" && <button className="timer-finish" disabled={elapsedSeconds <= 0} onClick={finishPartial}>Finalizar y guardar</button>}</div>
      </section>
      <aside className="focus-side">
        <div className="focus-stat-grid"><article><span>HOY</span><strong>{formatMinutes(todayMinutes)}</strong><small>{todaySessions.length} sesiones</small></article><article><span>7 DÍAS</span><strong>{formatMinutes(weekMinutes)}</strong><small>{weekSessions.length} sesiones</small></article></div>
        <section className="card focus-week-chart"><div className="card-heading"><div><span className="section-label dark"><BarChart3 size={14} /> RITMO SEMANAL</span><h3>Minutos de enfoque</h3></div></div><div className="bar-chart-with-axis"><div className="bar-y-axis"><span>{focusAxisMax}</span><span>{Math.round(focusAxisMax / 2)}</span><span>0</span></div><div className="focus-bars">{weekDays.map((date) => { const minutes = weekSessions.filter((session) => session.date === date).reduce((sum, session) => sum + session.minutes, 0); return <div key={date}><span className="focus-bar-value">{minutes || ""}</span><i><b style={{ height: `${Math.max(minutes ? 8 : 2, minutes / focusAxisMax * 100)}%` }} /></i><small>{shortDay(date).slice(0, 2)}</small></div>; })}</div></div></section>
      </aside>
    </div>
    <section className="card manual-time-card">
      <div className="card-heading"><div><span className="section-label dark"><Plus size={14} /> REGISTRO MANUAL</span><h3>Añadir tiempo trabajado</h3><p>Para sesiones realizadas cuando no tenías el ordenador contigo.</p></div></div>
      <form className="manual-time-form" onSubmit={saveManualSession}>
        <label>Tarea o actividad<input required value={manualTask} onChange={(event) => setManualTask(event.target.value)} placeholder="Ej. Reunión con proveedor" /></label>
        <label>Fecha<input required type="date" value={manualDate} max={today} onChange={(event) => setManualDate(event.target.value)} /></label>
        <label>Minutos<input required type="number" min="1" max="1440" step="1" value={manualMinutes} onChange={(event) => setManualMinutes(event.target.value)} /></label>
        <CategoryPicker value={manualCategory} categories={categoryNames} required onChange={setManualCategory} />
        <label>Proyecto<select value={manualProjectId} onChange={(event) => setManualProjectId(event.target.value)}><option value="">Sin proyecto</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        <button className="primary-button manual-time-submit" type="submit"><Save size={16} /> Guardar tiempo</button>
      </form>
    </section>
    <div className="focus-insights-grid">
      <section className="card"><div className="card-heading"><div><span className="section-label dark">POR CATEGORÍA</span><h3>A qué dedicas tu energía</h3></div></div>{categoryTotals.length ? <div className="time-breakdown">{categoryTotals.map((item) => <div key={item.name}><span><strong>{item.name}</strong><small>{formatMinutes(item.minutes)}</small></span><i><b style={{ width: `${item.minutes / categoryTotals[0].minutes * 100}%` }} /></i></div>)}</div> : <EmptyState text="Completa tu primera sesión para ver el reparto por categorías." />}</section>
      <section className="card"><div className="card-heading"><div><span className="section-label dark">POR PROYECTO</span><h3>Tiempo invertido</h3></div></div>{projectTotals.length ? <div className="time-breakdown project-time">{projectTotals.map(({ project, minutes }) => <div key={project.id}><span><strong>{project.title}</strong><small>{formatMinutes(minutes)}</small></span><i><b style={{ width: `${minutes / projectTotals[0].minutes * 100}%` }} /></i></div>)}</div> : <EmptyState text="Vincula una sesión a un proyecto para medir su dedicación." />}</section>
    </div>
    <section className="card focus-history"><div className="card-heading"><div><span className="section-label dark"><Timer size={14} /> HISTORIAL</span><h3>Últimas sesiones</h3></div></div>{data.focusSessions.length ? <div className="focus-history-list">{[...data.focusSessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 12).map((session) => { const project = data.projects.find((item) => item.id === session.projectId); return <div key={session.id}><span className="focus-history-icon"><Check size={15} /></span><div><strong>{session.task}{session.source === "manual" && <em className="manual-badge">Manual</em>}</strong><small>{formatShortDate(session.date)} · {session.category}{project ? ` · ${project.title}` : ""}</small></div><b>{formatMinutes(session.minutes)}</b><button aria-label="Eliminar sesión" onClick={() => onDelete(session.id)}><Trash2 size={14} /></button></div>; })}</div> : <EmptyState text="Todavía no hay sesiones registradas. Tu primer Pomodoro aparecerá aquí." />}</section>
  </div>;
}

function HabitsView({ data, today, onToggle, onOpen, onDelete }: {
  data: LifeData; today: string; onToggle: (habit: Habit, date?: string) => Promise<void>;
  onOpen: (modal: Modal) => void; onDelete: (id: string) => void;
}) {
  const days = lastDays(today, 7);
  return <div className="page-content subpage">
    <section className="section-intro"><div><span className="section-label dark"><Flame size={14} /> CONSTANCIA</span><h2>Hábitos diarios y mensuales</h2><p>Marca cada día, crea nuevos hábitos y ajusta los que ya no encajan contigo.</p></div><button className="primary-button" onClick={() => onOpen({ kind: "habit" })}><Plus size={17} /> Nuevo hábito</button></section>
    <section className="card tracker-card">
      <div className="tracker-head"><span>Hábito</span>{days.map((day) => <span key={day} title={formatLongDate(day)}>{shortDay(day)}</span>)}<span>Acciones</span></div>
      {data.habits.map((habit) => { const streak = streakStats(data.habitLogs.filter((log) => log.habitId === habit.id && log.done).map((log) => log.date), today); return <div className={`tracker-row ${!habit.active ? "inactive" : ""}`} key={habit.id}>
        <div className="tracker-name"><span className={`habit-icon ${habit.color}`}>{habitCategoryIcon(habit.category, 17)}</span><div><strong>{habit.name}</strong><small>{habit.detail || habit.category}{!habit.active ? " · Pausado" : ""} · 🔥 {streak.current} actual · mejor {streak.best}</small></div></div>
        {days.map((day) => {
          const done = data.habitLogs.some((log) => log.habitId === habit.id && log.date === day && log.done);
          const notApplicable = !habit.active && !done;
          return <button key={day} disabled={notApplicable} className={`day-check ${done ? "done" : notApplicable ? "not-applicable" : "empty"}`} title={`${formatLongDate(day)} · ${done ? "Completado" : notApplicable ? "No aplica" : "Pendiente"}`} onClick={() => onToggle(habit, day)} aria-label={`${habit.name}, ${formatLongDate(day)}: ${done ? "completado" : notApplicable ? "no aplica" : "pendiente"}`}>{done ? <Check size={15} /> : notApplicable ? <span aria-hidden="true">—</span> : null}</button>;
        })}
        <div className="row-actions"><button onClick={() => onOpen({ kind: "habit", record: habit })} aria-label="Editar"><Edit3 size={15} /></button><button onClick={() => onDelete(habit.id)} aria-label="Eliminar"><Trash2 size={15} /></button></div>
      </div>})}
      {!data.habits.length && <EmptyState text="Crea tu primer hábito para empezar el seguimiento." action="Crear hábito" onClick={() => onOpen({ kind: "habit" })} />}
    </section>
    <div className="summary-grid">
      <SummaryCard icon={<CheckCircle2 size={19} />} label="Completados hoy" value={`${data.habitLogs.filter((log) => log.date === today && log.done).length}/${data.habits.filter((habit) => habit.active).length}`} color="green" />
      <SummaryCard icon={<Flame size={19} />} label="Registros últimos 7 días" value={String(data.habitLogs.filter((log) => days.includes(log.date) && log.done).length)} color="lilac" />
      <SummaryCard icon={<Target size={19} />} label="Hábitos activos" value={String(data.habits.filter((habit) => habit.active).length)} color="sand" />
    </div>
  </div>;
}

function MetricsView({ data, onOpen, onDelete }: { data: LifeData; onOpen: (modal: Modal) => void; onDelete: (id: string) => void }) {
  const metrics = data.metrics;
  const latest = metrics[0];
  const previous = metrics[1];
  const weightMetrics = metrics.filter((metric) => metric.weight != null).slice(0, 30).reverse();
  const weightValues = weightMetrics.map((metric) => metric.weight as number);
  const minWeight = weightValues.length ? Math.min(...weightValues) : 0;
  const maxWeight = weightValues.length ? Math.max(...weightValues) : 0;
  const weightPadding = Math.max(1, (maxWeight - minWeight) * .18);
  const chartMin = minWeight - weightPadding;
  const chartMax = maxWeight + weightPadding;
  const chartPoints = weightMetrics.map((metric, index) => ({
    metric,
    x: weightMetrics.length === 1 ? 360 : 42 + index * (636 / (weightMetrics.length - 1)),
    y: 196 - (((metric.weight as number) - chartMin) / Math.max(1, chartMax - chartMin)) * 148,
  }));
  const moodDays = lastDays(argentinaDateKey(new Date()), 35);
  const moodAverage = metrics.filter((metric) => metric.mood != null).length
    ? metrics.filter((metric) => metric.mood != null).reduce((sum, metric) => sum + (metric.mood ?? 0), 0) / metrics.filter((metric) => metric.mood != null).length
    : null;
  const screenMetrics = metrics.filter((metric) => metric.screenTimeHours != null).slice(0, 14).reverse();
  const screenValues = screenMetrics.map((metric) => Number(metric.screenTimeHours));
  const screenMax = screenValues.length ? Math.max(...screenValues, 1) : 1;
  const screenAxisMax = Math.max(1, Math.ceil(screenMax * 2) / 2);
  const screenAverage = screenValues.length ? screenValues.reduce((sum, value) => sum + value, 0) / screenValues.length : null;
  const lowestScreenMetric = screenMetrics.length
    ? screenMetrics.reduce((lowest, metric) => Number(metric.screenTimeHours) < Number(lowest.screenTimeHours) ? metric : lowest)
    : null;
  const currentDate = argentinaDateKey(new Date());
  const checkinStreak = streakStats(metrics.map((metric) => metric.date), currentDate);
  const weightStreak = streakStats(metrics.filter((metric) => metric.weight != null).map((metric) => metric.date), currentDate);
  const metricInsights = buildMetricInsights(data);
  return <div className="page-content subpage">
    <section className="section-intro"><div><span className="section-label dark"><BarChart3 size={14} /> KPIs DE BIENESTAR</span><h2>Mide para entenderte, no para juzgarte</h2><p>Peso, ánimo, energía, sueño, estrés, movimiento, calorías activas y tiempo de pantalla en un registro diario.</p></div><button className="primary-button" onClick={() => onOpen({ kind: "metric" })}><Plus size={17} /> Registrar hoy</button></section>
    <div className="metrics-grid metrics-live">
      <MetricCard icon={<Scale size={19} />} label="Peso" value={metricValue(latest?.weight, "kg")} note={weightChange(latest, previous)} color="lilac" />
      <MetricCard icon={<Heart size={19} />} label="Ánimo" value={latest?.mood == null ? missingValue : `${moodEmoji(latest.mood)} ${latest.mood}/5`} note={latest ? formatShortDate(latest.date) : missingValue} color="rose" />
      <MetricCard icon={<Zap size={19} />} label="Energía" value={latest?.energy == null ? missingValue : `${latest.energy}/10`} note={latest?.stress == null ? missingValue : `Estrés ${latest.stress}/10`} color="sand" />
      <MetricCard icon={<Moon size={19} />} label="Sueño" value={metricValue(latest?.sleepHours, "h")} note={latest?.sleepQuality == null ? missingValue : `Calidad ${latest.sleepQuality}%`} color="green" />
      <MetricCard icon={<Flame size={19} />} label="Calorías activas" value={metricValue(latest?.activeCalories, "kcal")} note={latest?.exerciseMinutes == null ? missingValue : `${formatNumber(latest.exerciseMinutes)} min de ejercicio`} color="sand" />
      <MetricCard icon={<Smartphone size={19} />} label="Tiempo de pantalla" value={latest?.screenTimeHours == null ? missingValue : formatDuration(latest.screenTimeHours)} note={screenAverage == null ? missingValue : `Media ${formatDuration(screenAverage)}`} color="lilac" />
    </div>
    <div className="visual-metrics-grid">
      <section className="card weight-chart-card">
        <div className="card-heading"><div><span className="section-label dark"><TrendingUp size={14} /> EVOLUCIÓN DEL PESO</span><h3>Variación en el tiempo</h3></div><div className="chart-summary"><strong>{latest?.weight == null ? "—" : `${formatNumber(latest.weight)} kg`}</strong><span>{weightChange(latest, previous)}</span></div></div>
        {chartPoints.length ? <div className="weight-chart-wrap">
          <svg className="weight-chart" viewBox="0 0 720 230" role="img" aria-label="Gráfico de línea de la evolución del peso">
            {[48, 97, 146, 195].map((y) => <line key={y} x1="42" x2="690" y1={y} y2={y} className="chart-grid-line" />)}
            <path className="weight-area" d={`${chartPoints.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ")} L ${chartPoints.at(-1)?.x ?? 42} 196 L ${chartPoints[0]?.x ?? 42} 196 Z`} />
            <polyline className="weight-line" points={chartPoints.map((point) => `${point.x},${point.y}`).join(" ")} />
            {chartPoints.map(({ metric, x, y }) => <g key={metric.id}><circle className="weight-point" cx={x} cy={y} r="5"><title>{formatShortDate(metric.date)}: {formatNumber(metric.weight)} kg</title></circle></g>)}
            <text x="5" y="53" className="chart-axis-label">{formatNumber(chartMax)} kg</text>
            <text x="5" y="199" className="chart-axis-label">{formatNumber(chartMin)} kg</text>
            <text x="42" y="220" className="chart-axis-label">{formatTinyDate(weightMetrics[0]?.date ?? "")}</text>
            <text x="690" y="220" textAnchor="end" className="chart-axis-label">{formatTinyDate(weightMetrics.at(-1)?.date ?? "")}</text>
          </svg>
        </div> : <EmptyState text="Registra tu peso para comenzar a ver la línea de evolución." action="Registrar peso" onClick={() => onOpen({ kind: "metric" })} />}
      </section>
      <section className="card mood-grid-card">
        <div className="card-heading"><div><span className="section-label dark"><Heart size={14} /> MAPA DE ÁNIMO</span><h3>Últimos 35 días</h3></div><div className="mood-average"><strong>{moodAverage == null ? "—" : moodAverage.toFixed(1)}</strong><span>media / 5</span></div></div>
        <div className="mood-weekdays">{moodDays.slice(0, 7).map((day) => <span key={day}>{shortDay(day).slice(0, 1)}</span>)}</div>
        <div className="mood-calendar">{moodDays.map((day) => {
          const metric = metrics.find((item) => item.date === day);
          return <div key={day} className={`mood-cell mood-${metric?.mood ?? 0}`} title={`${formatShortDate(day)} · ${metric?.mood ? `Ánimo ${metric.mood}/5` : "Sin registro"}`}><span>{day.slice(-2)}</span>{metric?.mood && <b>{moodEmoji(metric.mood)}</b>}</div>;
        })}</div>
        <div className="mood-legend"><span>Más bajo</span>{[1, 2, 3, 4, 5].map((value) => <i className={`mood-${value}`} key={value} />)}<span>Más alto</span></div>
      </section>
    </div>
    <section className="card screen-chart-card">
      <div className="card-heading"><div><span className="section-label dark"><Smartphone size={14} /> TIEMPO DE PANTALLA</span><h3>Tu consumo digital</h3></div><div className="screen-summary"><div><strong>{screenAverage == null ? "—" : formatDuration(screenAverage)}</strong><span>promedio</span></div><div><strong>{lowestScreenMetric?.screenTimeHours == null ? "—" : formatDuration(lowestScreenMetric.screenTimeHours)}</strong><span>{lowestScreenMetric ? `mejor día · ${formatTinyDate(lowestScreenMetric.date)}` : "mejor día"}</span></div></div></div>
      {screenMetrics.length ? <div className="bar-chart-with-axis screen-axis-wrap" role="img" aria-label="Gráfico del tiempo de pantalla de los últimos 14 registros"><div className="bar-y-axis"><span>{formatNumber(screenAxisMax)} h</span><span>{formatNumber(screenAxisMax / 2)} h</span><span>0</span></div><div className="screen-bars">
        {screenMetrics.map((metric) => <div className="screen-bar-column" key={metric.id} title={`${formatShortDate(metric.date)}: ${formatDuration(metric.screenTimeHours)}`}>
          <div><span style={{ height: `${Math.max(8, (Number(metric.screenTimeHours) / screenAxisMax) * 100)}%` }} /></div>
          <strong>{formatDurationCompact(metric.screenTimeHours)}</strong>
          <small>{formatTinyDate(metric.date)}</small>
        </div>)}
      </div></div> : <EmptyState text="Registra el tiempo de pantalla que muestra tu móvil para empezar a ver la tendencia." action="Registrar tiempo" onClick={() => onOpen({ kind: "metric" })} />}
    </section>
    <section className="card history-card">
      <div className="card-heading"><div><span className="section-label dark"><TrendingUp size={14} /> HISTORIAL</span><h3>Tus registros</h3></div><span className="date-pill">{metrics.length} días</span></div>
      <div className="history-table">
        <div className="history-head"><span>Fecha</span><span>Peso</span><span>Ánimo</span><span>Energía</span><span>Sueño</span><span>Calorías</span><span>Pantalla</span><span></span></div>
        {metrics.map((metric) => <div className="history-row" key={metric.id}><span><strong>{formatShortDate(metric.date)}</strong></span><span>{metricValue(metric.weight, "kg")}</span><span>{metric.mood == null ? missingValue : `${moodEmoji(metric.mood)} ${metric.mood}/5`}</span><span>{metric.energy == null ? missingValue : `${metric.energy}/10`}</span><span>{metric.sleepHours == null ? missingValue : `${formatNumber(metric.sleepHours)} h${metric.sleepQuality == null ? "" : ` · ${metric.sleepQuality}%`}`}</span><span>{metricValue(metric.activeCalories, "kcal")}</span><span>{formatDuration(metric.screenTimeHours)}</span><span className="row-actions"><button onClick={() => onOpen({ kind: "metric", record: metric })}><Edit3 size={15} /></button><button onClick={() => onDelete(metric.id)}><Trash2 size={15} /></button></span></div>)}
      </div>
      {!metrics.length && <EmptyState text="Aún no hay métricas. Tu primer registro solo lleva un minuto." action="Crear registro" onClick={() => onOpen({ kind: "metric" })} />}
    </section>
    <div className="metrics-insight-grid">
      <section className="card streak-card"><div className="card-heading"><div><span className="section-label dark"><Flame size={14} /> CONSTANCIA</span><h3>Rachas de registro</h3></div></div><div className="streak-stat-grid"><div><strong>{checkinStreak.current}</strong><span>check-in actual</span><small>Mejor: {checkinStreak.best} días</small></div><div><strong>{weightStreak.current}</strong><span>peso actual</span><small>Mejor: {weightStreak.best} días</small></div></div></section>
      <section className="card correlation-card"><div className="card-heading"><div><span className="section-label dark"><Sparkles size={14} /> INSIGHTS</span><h3>Patrones en tus datos</h3><p>Asociaciones descriptivas; no implican causalidad.</p></div></div><div className="insight-list">{metricInsights.map((insight) => <article key={insight.title}><span className={`insight-icon ${insight.color}`}>{insight.icon}</span><div><strong>{insight.title}</strong><p>{insight.text}</p><small>{insight.sample}</small></div></article>)}</div></section>
    </div>
  </div>;
}

function JournalView({ data, today, onSave, onOpen, onToggleBullet, onDelete }: {
  data: LifeData; today: string; onSave: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  onOpen: (modal: Modal) => void; onToggleBullet: (item: BulletItem) => Promise<void>;
  onDelete: (resource: Resource, id: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(today);
  const entry = data.journals.find((item) => item.date === selectedDate);
  const [draft, setDraft] = useState({ title: "", content: "", win: "", learning: "", tomorrow: "" });
  const [saving, setSaving] = useState(false);
  // The editor intentionally mirrors the selected dated entry.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDraft({
    title: entry?.title ?? "", content: entry?.content ?? "", win: entry?.win ?? "",
    learning: entry?.learning ?? "", tomorrow: entry?.tomorrow ?? "",
  }), [entry, selectedDate]);
  async function submit() {
    setSaving(true);
    try { await onSave("journal", { ...draft, id: entry?.id, date: selectedDate }, "Entrada guardada"); }
    finally { setSaving(false); }
  }
  const dayBullets = data.bullets.filter((item) => item.date === selectedDate);
  const journalStreak = streakStats(data.journals.map((item) => item.date), today);
  return <div className="page-content subpage journal-page">
    <div className="journal-layout">
      <section className="card writing-card">
        <div className="journal-date"><div><span className="section-label dark"><PenLine size={14} /> ENTRADA DIARIA</span><h2>{formatLongDate(selectedDate)}</h2></div><input className="date-input" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
        <input className="journal-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Título del día (opcional)" />
        <div className="prompt-box"><Sparkles size={18} /><div><strong>Pregunta para hoy</strong><p>¿Qué pequeño avance de hoy agradecerá tu yo de dentro de un mes?</p></div></div>
        <textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="Empieza a escribir aquí… No hace falta que sea perfecto, solo sincero." />
        <div className="guided-grid"><label>Victoria del día<textarea value={draft.win} onChange={(event) => setDraft({ ...draft, win: event.target.value })} placeholder="¿Qué salió bien?" /></label><label>Aprendizaje<textarea value={draft.learning} onChange={(event) => setDraft({ ...draft, learning: event.target.value })} placeholder="¿Qué aprendiste?" /></label><label>Mañana<textarea value={draft.tomorrow} onChange={(event) => setDraft({ ...draft, tomorrow: event.target.value })} placeholder="¿Qué mejorarás mañana?" /></label></div>
        <div className="writing-footer"><span>{draft.content.length} caracteres · {entry ? "Editando entrada existente" : "Nueva entrada"}</span><div>{entry && <button className="danger-text" onClick={() => onDelete("journal", entry.id)}><Trash2 size={15} /> Eliminar</button>}<button className="primary-button" onClick={submit} disabled={saving}><Save size={16} /> {saving ? "Guardando…" : "Guardar entrada"}</button></div></div>
      </section>
      <aside>
        <section className="card bullet-card">
          <div className="card-heading"><div><span className="section-label dark"><ListTodo size={14} /> BULLET LIST</span><h3>Registro del día</h3></div><button className="icon-button small" onClick={() => onOpen({ kind: "bullet", date: selectedDate })}><Plus size={16} /></button></div>
          <div className="bullet-list">{dayBullets.map((item) => <div className={`bullet-item ${item.done ? "done" : ""}`} key={item.id}><button className="bullet-toggle" onClick={() => onToggleBullet(item)}>{item.type === "task" ? (item.done ? <CheckCircle2 size={17} /> : <Circle size={17} />) : item.type === "event" ? "○" : "•"}</button><button className="bullet-copy" onClick={() => onOpen({ kind: "bullet", record: item })}><span>{item.text}</span><small>{bulletLabel(item.type)}</small></button></div>)}</div>
          {!dayBullets.length && <EmptyState text="Sin tareas, notas ni eventos para este día." action="Añadir" onClick={() => onOpen({ kind: "bullet", date: selectedDate })} />}
        </section>
        <section className="card past-notes">
          <div className="card-heading"><div><span className="section-label dark"><BookOpen size={14} /> RECUERDOS</span><h3>Entradas recientes</h3></div><span className="streak-pill"><Flame size={13} /> {journalStreak.current} días · mejor {journalStreak.best}</span></div>
          {data.journals.slice(0, 8).map((item) => <button key={item.id} onClick={() => setSelectedDate(item.date)}><span>{formatTinyDate(item.date)}</span><div><strong>{item.title || "Entrada del día"}</strong><small>{truncateAtWord(item.content, 65) || "Reflexión guiada"}</small></div></button>)}
        </section>
      </aside>
    </div>
  </div>;
}

function GratitudeView({ data, today, onOpen, onDelete }: {
  data: LifeData; today: string; onOpen: (modal: Modal) => void; onDelete: (id: string) => void;
}) {
  const recentDays = lastDays(today, 28);
  const todayItems = data.gratitudes.filter((item) => item.date === today);
  const people = data.gratitudes.filter((item) => item.person.trim()).reduce<Record<string, number>>((acc, item) => { acc[item.person.trim()] = (acc[item.person.trim()] || 0) + 1; return acc; }, {});
  const topPerson = Object.entries(people).sort((a, b) => b[1] - a[1])[0];
  return <div className="page-content subpage gratitude-page">
    <section className="gratitude-hero"><div><span className="section-label light"><Gift size={14} /> PRÁCTICA DE GRATITUD</span><h2>Presta atención a lo bueno</h2><p>No se trata de ignorar lo difícil, sino de entrenar la mirada para reconocer también lo que sí está funcionando.</p><button className="gratitude-primary" onClick={() => onOpen({ kind: "gratitude" })}><Plus size={16} /> Añadir agradecimiento</button></div><div className="gratitude-quote"><Sparkles size={24} /><strong>{todayItems.length ? `${todayItems.length} momentos guardados hoy` : "Un minuto puede cambiar la forma de recordar el día"}</strong><span>{data.gratitudes.length} agradecimientos en total</span></div></section>
    <div className="gratitude-summary">
      <article><span><Gift size={18} /></span><div><small>HOY</small><strong>{todayItems.length}</strong><p>momentos reconocidos</p></div></article>
      <article><span><CalendarDays size={18} /></span><div><small>ÚLTIMOS 28 DÍAS</small><strong>{new Set(data.gratitudes.filter((item) => recentDays.includes(item.date)).map((item) => item.date)).size}</strong><p>días con registro</p></div></article>
      <article><span><Heart size={18} /></span><div><small>PERSONA PRESENTE</small><strong>{topPerson?.[0] || "—"}</strong><p>{topPerson ? `${topPerson[1]} menciones` : "Añade a alguien"}</p></div></article>
    </div>
    <div className="gratitude-layout">
      <section className="card gratitude-calendar-card"><div className="card-heading"><div><span className="section-label dark"><CalendarDays size={14} /> CONSTANCIA AMABLE</span><h3>Últimos 28 días</h3></div></div><div className="gratitude-calendar">{recentDays.map((day) => { const count = data.gratitudes.filter((item) => item.date === day).length; return <div key={day} className={`gratitude-day ${count ? "active" : ""}`} title={`${formatShortDate(day)} · ${count} agradecimientos`}><span>{day.slice(-2)}</span>{count ? <Gift size={13} /> : <i />}</div>; })}</div></section>
      <section className="card gratitude-today-card"><div className="card-heading"><div><span className="section-label dark"><Sun size={14} /> HOY</span><h3>¿Qué merece ser recordado?</h3></div><button className="add-inline" onClick={() => onOpen({ kind: "gratitude" })}><Plus size={14} /> Añadir</button></div>{todayItems.length ? <div className="gratitude-mini-list">{todayItems.map((item) => <button key={item.id} onClick={() => onOpen({ kind: "gratitude", record: item })}><Gift size={14} /><span><strong>{item.text}</strong><small>{item.person || item.why || "Un momento del día"}</small></span><ArrowRight size={14} /></button>)}</div> : <EmptyState text="Todavía no has guardado ningún agradecimiento hoy." action="Guardar el primero" onClick={() => onOpen({ kind: "gratitude" })} />}</section>
    </div>
    <section className="card gratitude-history"><div className="card-heading"><div><span className="section-label dark"><BookOpen size={14} /> MEMORIA POSITIVA</span><h3>Agradecimientos recientes</h3></div></div>{data.gratitudes.length ? <div className="gratitude-list">{data.gratitudes.slice(0, 18).map((item) => <article key={item.id}><div><span>{formatShortDate(item.date)}</span>{item.shared && <small>AGRADECIDO</small>}</div><h4>{item.text}</h4>{item.why && <p>{item.why}</p>}<footer><strong>{item.person ? `Con ${item.person}` : "Momento personal"}</strong><div className="row-actions"><button onClick={() => onOpen({ kind: "gratitude", record: item })}><Edit3 size={14} /></button><button onClick={() => onDelete(item.id)}><Trash2 size={14} /></button></div></footer></article>)}</div> : <EmptyState text="Este espacio irá reuniendo las cosas buenas que quieras conservar." action="Añadir agradecimiento" onClick={() => onOpen({ kind: "gratitude" })} />}</section>
  </div>;
}

function MindMapView({ data, onOpen, onDelete }: { data: LifeData; onOpen: (modal: Modal) => void; onDelete: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState(data.mindNodes[0]?.id ?? "mind-self");
  const selected = data.mindNodes.find((item) => item.id === selectedId) ?? data.mindNodes[0];
  return <div className="page-content subpage mindmap-page">
    <section className="section-intro"><div><span className="section-label dark"><Network size={14} /> VISIÓN DE CONJUNTO</span><h2>Tu vida, conectada</h2><p>Observa qué ocupa tu atención, cómo se relacionan tus áreas y qué proyectos forman parte de cada una.</p></div><button className="primary-button" onClick={() => onOpen({ kind: "mindNode", nodes: data.mindNodes, projects: data.projects, parentId: selected?.id })}><Plus size={17} /> Añadir conexión</button></section>
    <div className="mindmap-layout">
      <section className="mindmap-canvas-card"><div className="mindmap-toolbar"><span><Sparkles size={13} /> Selecciona un nodo para ver su contexto</span><button onClick={() => setSelectedId("mind-self")}>Centrar mapa</button></div><div className="mindmap-canvas">
        <svg viewBox="0 0 1000 620" aria-hidden="true">{data.mindNodes.filter((node) => node.parentId).map((node) => { const parent = data.mindNodes.find((item) => item.id === node.parentId); return parent ? <path key={node.id} d={`M ${parent.x} ${parent.y} C ${(parent.x + node.x) / 2} ${parent.y}, ${(parent.x + node.x) / 2} ${node.y}, ${node.x} ${node.y}`} /> : null; })}</svg>
        {data.mindNodes.map((node) => { const project = data.projects.find((item) => item.id === node.projectId); return <button key={node.id} className={`mind-node ${node.color} ${selected?.id === node.id ? "selected" : ""}`} style={{ left: `${node.x / 10}%`, top: `${node.y / 6.2}%` }} onClick={() => setSelectedId(node.id)}><strong>{node.label}</strong><small>{project ? project.title : node.detail}</small></button>; })}
      </div></section>
      <aside className="card mindmap-detail">{selected ? <><span className={`mind-detail-icon ${selected.color}`}><Network size={21} /></span><small>{selected.area.toUpperCase()}</small><h3>{selected.label}</h3><p>{selected.detail || "Añade una explicación sobre qué representa este elemento en tu vida."}</p>{selected.projectId && <div className="mind-linked-project"><FolderKanban size={15} /><div><small>PROYECTO VINCULADO</small><strong>{data.projects.find((item) => item.id === selected.projectId)?.title}</strong></div></div>}<div className="mind-children"><span>CONEXIONES</span><strong>{data.mindNodes.filter((item) => item.parentId === selected.id).length}</strong></div><button className="primary-button full" onClick={() => onOpen({ kind: "mindNode", nodes: data.mindNodes, projects: data.projects, parentId: selected.id })}><Plus size={15} /> Conectar algo</button><button className="outline-button" onClick={() => onOpen({ kind: "mindNode", nodes: data.mindNodes, projects: data.projects, record: selected })}><Edit3 size={14} /> Editar nodo</button>{selected.id !== "mind-self" && <button className="danger-text mind-delete" onClick={() => onDelete(selected.id)}><Trash2 size={14} /> Eliminar nodo</button>}</> : <EmptyState text="Selecciona un elemento del mapa." />}</aside>
    </div>
  </div>;
}

function ProgramsView({ data, today, onOpen, onDelete }: {
  data: LifeData; today: string; onOpen: (modal: Modal) => void; onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<"experiment" | "challenge">("experiment");
  const programs = data.programs.filter((program) => program.kind === tab);
  return <div className="page-content subpage">
    <section className="section-intro"><div><span className="section-label dark"><Rocket size={14} /> LABORATORIO DE EVOLUCIÓN</span><h2>Prueba, mide y aprende</h2><p>Los experimentos descubren qué te funciona. Los retos convierten una intención en constancia.</p></div><button className="primary-button" onClick={() => onOpen({ kind: "program", programKind: tab })}><Plus size={17} /> Nuevo {tab === "experiment" ? "experimento" : "reto"}</button></section>
    <div className="segmented program-tabs"><button className={tab === "experiment" ? "active" : ""} onClick={() => setTab("experiment")}>Experimentos</button><button className={tab === "challenge" ? "active" : ""} onClick={() => setTab("challenge")}>Retos</button></div>
    <div className="program-grid">{programs.map((program) => {
      const logs = data.programLogs.filter((log) => log.programId === program.id);
      const done = logs.filter((log) => log.completed).length;
      const elapsed = daysBetween(program.startDate, today) + 1;
      const progress = Math.min(100, Math.round(done / program.durationDays * 100));
      const todayLog = logs.find((log) => log.date === today);
      return <article className="card program-card" key={program.id}>
        <div className="program-heading"><span className={`program-kind ${program.kind}`}>{program.kind === "experiment" ? <Brain size={14} /> : <Trophy size={14} />}{program.kind === "experiment" ? "Experimento" : "Reto"}</span><div className="row-actions"><button onClick={() => onOpen({ kind: "program", record: program })}><Edit3 size={15} /></button><button onClick={() => onDelete(program.id)}><Trash2 size={15} /></button></div></div>
        <h3>{program.title}</h3><p>{program.description || "Sin descripción."}</p>
        <div className="program-stats"><span><strong>{done}</strong> completados</span><span><strong>{Math.min(elapsed, program.durationDays)}</strong> de {program.durationDays} días</span><span><strong>{progress}%</strong> progreso</span></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        {todayLog && <div className="today-log"><CheckCircle2 size={16} /><div><strong>{todayLog.completed ? "Registrado hoy" : "Registro de hoy"}</strong><small>{todayLog.notes || `Valoración ${todayLog.rating ?? "—"}/5`}</small></div></div>}
        <button className={todayLog ? "outline-button" : "primary-button full"} onClick={() => onOpen({ kind: "programLog", program, record: todayLog })}>{todayLog ? <Edit3 size={15} /> : <Plus size={15} />}{todayLog ? "Editar registro de hoy" : "Registrar cómo fue hoy"}</button>
        {!!logs.length && <details className="log-history"><summary>Ver historial ({logs.length})</summary>{logs.slice(0, 10).map((log) => <div key={log.id}><span>{formatShortDate(log.date)}</span><strong>{log.completed ? "Completado" : "No completado"} · {log.rating ?? "—"}/5</strong><small>{log.notes}</small></div>)}</details>}
      </article>;
    })}</div>
    {!programs.length && <section className="card"><EmptyState text={`Todavía no tienes ${tab === "experiment" ? "experimentos" : "retos"}.`} action={`Crear ${tab === "experiment" ? "experimento" : "reto"}`} onClick={() => onOpen({ kind: "program", programKind: tab })} /></section>}
  </div>;
}

function PlanningView({ data, today, onOpen, onSave, onDelete, embedded = false }: {
  data: LifeData; today: string; onOpen: (modal: Modal) => void;
  onSave: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  onDelete: (resource: Resource, id: string) => void; embedded?: boolean;
}) {
  const [scope, setScope] = useState<PlanGoal["scope"]>("month");
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const period = scope === "month" ? selectedMonth : quarterKey(selectedMonth);
  const visibleGoals = data.planGoals.filter((goal) => goal.scope === scope && goal.period === period);
  const visibleGoalIds = new Set(visibleGoals.map((goal) => goal.id));
  const quarterMonths = monthsForQuarter(quarterKey(selectedMonth));
  const standaloneTasks = data.planTasks.filter((task) => !task.goalId && (scope === "month" ? (task.period || task.dueDate?.slice(0, 7)) === selectedMonth : quarterMonths.includes(task.period || task.dueDate?.slice(0, 7) || "")));
  const visibleTasks = data.planTasks.filter((task) => !!task.goalId && visibleGoalIds.has(task.goalId)).concat(standaloneTasks);
  const visibleAgendaTasks = data.projectTasks.filter((task) => !!task.goalId && visibleGoalIds.has(task.goalId) && (scope === "month" ? !task.scheduledDate || task.scheduledDate.slice(0, 7) === selectedMonth : !task.scheduledDate || quarterMonths.includes(task.scheduledDate.slice(0, 7))));
  const completedTasks = [...visibleTasks, ...visibleAgendaTasks].filter((task) => task.status === "done").length;
  const linkedProjects = new Set([...visibleGoals.map((goal) => goal.projectId), ...visibleTasks.map((task) => task.projectId), ...visibleAgendaTasks.map((task) => task.projectId)].filter(Boolean)).size;
  const completedGoals = visibleGoals.filter((goal) => goalCompletion(goal, data.planTasks, data.projectTasks).complete).length;
  const totalTaskCount = visibleTasks.length + visibleAgendaTasks.length;
  const totalProgress = totalTaskCount ? Math.round(completedTasks / totalTaskCount * 100) : visibleGoals.length ? Math.round(completedGoals / visibleGoals.length * 100) : 0;

  function movePeriod(direction: number) {
    setSelectedMonth((current) => shiftMonth(current, direction * (scope === "month" ? 1 : 3)));
  }

  async function advanceTask(task: PlanTask) {
    const status: PlanTask["status"] = task.status === "todo" ? "doing" : task.status === "doing" ? "done" : "todo";
    await onSave("planTask", { ...task, status }, status === "done" ? "Tarea completada" : "Tarea actualizada");
  }

  async function toggleGoal(goal: PlanGoal) {
    const status: PlanGoal["status"] = goal.status === "done" ? "doing" : "done";
    await onSave("planGoal", { ...goal, status }, status === "done" ? "Objetivo completado" : "Objetivo reabierto");
  }

  return <div className={embedded ? "planning-page integrated-planning" : "page-content subpage planning-page"}>
    <section className={embedded ? "workspace-subheader" : "section-intro"}><div><span className="section-label dark"><CalendarDays size={14} /> PLANIFICACIÓN PERSONAL</span>{embedded ? <h3>Del objetivo trimestral a la acción concreta</h3> : <h2>Decide qué importa antes de empezar</h2>}<p>Define objetivos y acciones del mes o del trimestre, relaciónalos con tus proyectos y mantén todo bajo control.</p></div><div className="intro-actions"><button className="outline-compact" onClick={() => onOpen({ kind: "planTask", goals: data.planGoals, projects: data.projects, defaultPeriod: selectedMonth })}><ListTodo size={16} /> Nueva tarea</button><button className="primary-button" onClick={() => onOpen({ kind: "planGoal", projects: data.projects, defaultScope: scope, defaultPeriod: period })}><Plus size={17} /> Nuevo objetivo</button></div></section>
    <section className="planning-toolbar">
      <div className="segmented planning-tabs"><button className={scope === "month" ? "active" : ""} onClick={() => setScope("month")}>Mes</button><button className={scope === "quarter" ? "active" : ""} onClick={() => setScope("quarter")}>Trimestre</button></div>
      <div className="period-switcher"><button aria-label="Periodo anterior" onClick={() => movePeriod(-1)}>←</button><div><span>{scope === "month" ? "PLAN DEL MES" : "PLAN DEL TRIMESTRE"}</span><strong>{scope === "month" ? monthLabel(selectedMonth) : quarterLabel(period)}</strong></div><button aria-label="Periodo siguiente" onClick={() => movePeriod(1)}>→</button></div>
      <button className="today-period" onClick={() => setSelectedMonth(today.slice(0, 7))}>Volver a hoy</button>
    </section>
    <div className="planning-summary">
      <article><span className="planning-summary-icon lilac"><Target size={19} /></span><div><small>Objetivos</small><strong>{visibleGoals.length}</strong><span>{completedGoals} completados</span></div></article>
      <article><span className="planning-summary-icon mint"><CheckCircle2 size={19} /></span><div><small>Tareas</small><strong>{completedTasks}/{totalTaskCount}</strong><span>{totalProgress}% de avance</span></div></article>
      <article><span className="planning-summary-icon sand"><FolderKanban size={19} /></span><div><small>Proyectos vinculados</small><strong>{linkedProjects}</strong><span>todo conectado</span></div></article>
    </div>
    {scope === "quarter" && <section className="quarter-map"><div className="card-heading"><div><span className="section-label dark"><CalendarDays size={14} /> MESES DEL TRIMESTRE</span><h3>Del trimestre al mes</h3></div><span className="date-pill">{quarterLabel(period)}</span></div><div className="quarter-month-grid">{quarterMonths.map((month) => {
      const monthGoals = data.planGoals.filter((goal) => goal.scope === "month" && goal.period === month);
      const done = monthGoals.filter((goal) => goalCompletion(goal, data.planTasks, data.projectTasks).complete).length;
      return <button key={month} onClick={() => { setSelectedMonth(month); setScope("month"); }}><span>{monthLabel(month)}</span><strong>{monthGoals.length} {monthGoals.length === 1 ? "objetivo" : "objetivos"}</strong><small>{done} {done === 1 ? "completado" : "completados"} · Abrir mes →</small></button>;
    })}</div></section>}
    <section className="standalone-tasks-card"><div className="card-heading"><div><span className="section-label dark"><ListTodo size={14} /> ACCIONES DEL PERIODO</span><h3>Tareas independientes</h3><p>Acciones que debes realizar aunque no formen parte de un objetivo.</p></div><button className="add-inline top" onClick={() => onOpen({ kind: "planTask", goals: data.planGoals, projects: data.projects, defaultPeriod: selectedMonth })}><Plus size={15} /> Añadir tarea</button></div>
      <div className="standalone-task-list">{standaloneTasks.map((task) => {
        const project = data.projects.find((item) => item.id === task.projectId);
        return <div className={`standalone-task ${task.status}`} key={task.id}><button className="plan-task-toggle" onClick={() => advanceTask(task)} aria-label={`Cambiar estado de ${task.title}`}>{task.status === "done" ? <CheckCircle2 size={17} /> : task.status === "doing" ? <Activity size={17} /> : <Circle size={17} />}</button><div><strong>{task.title}</strong><small>{task.dueDate ? formatShortDate(task.dueDate) : monthLabel(task.period || selectedMonth)}{project ? ` · ${project.title}` : ""}</small></div><span className={`priority ${task.priority || "medium"}`}>{priorityLabel(task.priority || "medium")}</span><div className="row-actions"><button aria-label="Editar tarea" onClick={() => onOpen({ kind: "planTask", goals: data.planGoals, projects: data.projects, record: task, defaultPeriod: task.period || selectedMonth })}><Edit3 size={13} /></button><button aria-label="Eliminar tarea" onClick={() => onDelete("planTask", task.id)}><Trash2 size={13} /></button></div></div>;
      })}</div>
      {!standaloneTasks.length && <EmptyState text="No hay tareas independientes en este periodo." action="Crear una tarea" onClick={() => onOpen({ kind: "planTask", goals: data.planGoals, projects: data.projects, defaultPeriod: selectedMonth })} />}
    </section>
    <div className="goal-grid">{visibleGoals.map((goal) => {
      const tasks = data.planTasks.filter((task) => task.goalId === goal.id);
      const agendaTasks = data.projectTasks.filter((task) => task.goalId === goal.id);
      const completion = goalCompletion(goal, data.planTasks, data.projectTasks);
      const totalLinked = tasks.length + agendaTasks.length;
      const done = tasks.filter((task) => task.status === "done").length + agendaTasks.filter((task) => task.status === "done").length;
      const progress = completion.progress;
      const derivedComplete = completion.complete;
      const displayStatus = totalLinked ? (derivedComplete ? "done" : done ? "doing" : "todo") : goal.status;
      const project = data.projects.find((item) => item.id === goal.projectId);
      return <article className={`goal-card ${displayStatus}`} key={goal.id}>
        <div className="goal-card-top"><div><span className={`priority ${goal.priority}`}>{priorityLabel(goal.priority)}</span>{project && <span className="goal-project"><FolderKanban size={12} /> {project.title}</span>}</div><div className="row-actions"><button aria-label="Editar objetivo" onClick={() => onOpen({ kind: "planGoal", projects: data.projects, record: goal })}><Edit3 size={14} /></button><button aria-label="Eliminar objetivo" onClick={() => onDelete("planGoal", goal.id)}><Trash2 size={14} /></button></div></div>
        <h3>{goal.title}</h3><p>{goal.description || "Define el resultado que quieres alcanzar durante este periodo."}</p>{goal.targetDate && <small className="goal-deadline"><CalendarDays size={12} /> Fecha límite: {formatShortDate(goal.targetDate)}</small>}
        {progress == null ? <div className="goal-progress no-tasks"><div><span>Sin tareas vinculadas</span><strong>{missingValue}</strong></div></div> : <div className="goal-progress"><div><span>{done}/{totalLinked} tareas</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>}
        <div className="plan-task-list">{tasks.map((task) => {
          const taskProject = data.projects.find((item) => item.id === task.projectId);
          return <div className={`plan-task ${task.status}`} key={task.id}><button className="plan-task-toggle" onClick={() => advanceTask(task)} aria-label={`Cambiar estado de ${task.title}`}>{task.status === "done" ? <CheckCircle2 size={17} /> : task.status === "doing" ? <Activity size={17} /> : <Circle size={17} />}</button><div><strong>{task.title}</strong><small>{task.dueDate ? formatShortDate(task.dueDate) : "Sin fecha"}{taskProject ? ` · ${taskProject.title}` : ""}</small></div><div className="row-actions"><button aria-label="Editar tarea" onClick={() => onOpen({ kind: "planTask", goal, goals: data.planGoals, projects: data.projects, record: task })}><Edit3 size={13} /></button><button aria-label="Eliminar tarea" onClick={() => onDelete("planTask", task.id)}><Trash2 size={13} /></button></div></div>;
        })}</div>
        {!!agendaTasks.length && <div className="plan-task-list">{agendaTasks.map((task) => <div className={`plan-task ${task.status}`} key={task.id}><button className="plan-task-toggle" onClick={() => onSave("projectTask", { ...task, status: task.status === "todo" ? "doing" : task.status === "doing" ? "done" : "todo" })} aria-label={`Cambiar estado de ${task.title}`}>{task.status === "done" ? <CheckCircle2 size={17} /> : task.status === "doing" ? <Activity size={17} /> : <Circle size={17} />}</button><div><strong>{task.title}</strong><small>{task.scheduledDate ? formatShortDate(task.scheduledDate) : "Inbox"} · Agenda</small></div><div className="row-actions"><button aria-label="Editar tarea" onClick={() => onOpen({ kind: "projectTask", projects: data.projects, record: task })}><Edit3 size={13} /></button><button aria-label="Eliminar tarea" onClick={() => onDelete("projectTask", task.id)}><Trash2 size={13} /></button></div></div>)}</div>}
        <button className="goal-add-task" onClick={() => onOpen({ kind: "projectTask", projects: data.projects, project, defaultDate: today, defaultSprintWeek: startOfWeek(today) })}><Plus size={14} /> Añadir tarea a la agenda</button>
        {!totalLinked && <button className={`goal-complete ${goal.status === "done" ? "done" : ""}`} onClick={() => toggleGoal(goal)}>{goal.status === "done" ? <><CheckCircle2 size={15} /> Objetivo completado manualmente</> : <><Circle size={15} /> Marcar objetivo como completado</>}</button>}
        {!!totalLinked && <small className="goal-derived-note">El avance y el estado se calculan automáticamente desde todas las tareas vinculadas.</small>}
      </article>;
    })}</div>
  </div>;
}

function LegacyProjectsView({ data, today, onOpen, onSave, onDelete }: {
  data: LifeData; today: string; onOpen: (modal: Modal) => void;
  onSave: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  onDelete: (resource: Resource, id: string) => void;
}) {
  const [tab, setTab] = useState<"overview" | "planning" | "sprint" | "projects" | "notes">("overview");
  const [selectedId, setSelectedId] = useState<string | null>(data.projects[0]?.id ?? null);
  const effectiveSelectedId = data.projects.some((project) => project.id === selectedId) ? selectedId : (data.projects[0]?.id ?? null);
  const selected = data.projects.find((project) => project.id === effectiveSelectedId) ?? null;
  const projectTasks = selected ? data.projectTasks.filter((task) => task.projectId === selected.id) : [];
  const projectNotes = selected ? data.notes.filter((note) => note.projectId === selected.id) : [];

  async function moveTask(task: ProjectTask, status: ProjectTask["status"]) {
    await onSave("projectTask", { ...task, status }, "Tarea actualizada");
  }

  return <div className="page-content subpage">
    <section className="section-intro"><div><span className="section-label dark"><FolderKanban size={14} /> ESPACIO DE TRABAJO</span><h2>De la visión a lo que haces hoy</h2><p>Planifica objetivos, conviértelos en sprints y tareas, organiza tus proyectos y conserva las notas dentro del mismo sistema.</p></div><div className="intro-actions"><button className="outline-compact" onClick={() => onOpen({ kind: "note", projects: data.projects })}><StickyNote size={16} /> Nueva nota</button><button className="primary-button" onClick={() => onOpen({ kind: "project" })}><Plus size={17} /> Nuevo proyecto</button></div></section>
    <div className="segmented program-tabs project-tabs"><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><LayoutDashboard size={14} /> Vista general</button><button className={tab === "sprint" ? "active" : ""} onClick={() => setTab("sprint")}><CalendarDays size={14} /> Agenda semanal</button><button className={tab === "planning" ? "active" : ""} onClick={() => setTab("planning")}><Target size={14} /> Planificación</button><button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}><FolderKanban size={14} /> Proyectos</button><button className={tab === "notes" ? "active" : ""} onClick={() => setTab("notes")}><StickyNote size={14} /> Notas</button></div>
    {tab === "overview" ? <WorkOverview data={data} today={today} onOpen={onOpen} onTab={setTab} /> : tab === "projects" ? <>
      <div className="project-library">
        {data.projects.map((project) => {
          const tasks = data.projectTasks.filter((task) => task.projectId === project.id);
          const done = tasks.filter((task) => task.status === "done").length;
          const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
          return <article className={`project-tile ${effectiveSelectedId === project.id ? "selected" : ""}`} key={project.id}>
            <button className="project-tile-main" onClick={() => setSelectedId(project.id)}>
              <span className={`module-icon ${project.color}`}><FolderKanban size={20} /></span>
              <span><small>{project.area} · {projectStatus(project.status)}</small><strong>{project.title}</strong></span>
              <span className="project-percentage">{tasks.length ? `${progress}%` : missingValue}</span>
            </button>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <div className="project-tile-footer"><span>{done}/{tasks.length} tareas</span><span className={`priority ${project.priority}`}>{priorityLabel(project.priority)}</span><div className="row-actions"><button onClick={() => onOpen({ kind: "project", record: project })}><Edit3 size={14} /></button><button onClick={() => onDelete("project", project.id)}><Trash2 size={14} /></button></div></div>
          </article>;
        })}
        <button className="new-project-tile" onClick={() => onOpen({ kind: "project" })}><Plus size={22} /><strong>Crear proyecto</strong><small>Negocio, aprendizaje o vida personal</small></button>
      </div>
      {selected && <section className="project-workspace">
        <div className="workspace-heading"><div><span className={`module-icon ${selected.color}`}><FolderKanban size={20} /></span><div><span className="section-label dark">{selected.area.toUpperCase()}</span><h3>{selected.title}</h3><p>{selected.description || "Añade una descripción para definir el objetivo y el resultado esperado."}</p></div></div><div className="intro-actions"><button className="outline-compact" onClick={() => onOpen({ kind: "note", projects: data.projects, projectId: selected.id })}><StickyNote size={15} /> Nota</button><button className="primary-button" onClick={() => onOpen({ kind: "projectTask", projects: data.projects, project: selected })}><Plus size={15} /> Nueva tarea</button></div></div>
        <div className="kanban-board">
          {(["todo", "doing", "done"] as const).map((status) => <div className={`kanban-column ${status}`} key={status}><div className="kanban-heading"><span>{taskStatus(status)}</span><b>{projectTasks.filter((task) => task.status === status).length}</b></div>{projectTasks.filter((task) => task.status === status).map((task) => <article className="task-card" key={task.id}><div className="task-card-tags"><span className={`priority ${task.priority}`}>{priorityLabel(task.priority)}</span><span className={`energy-tag ${task.energy || "medium"}`}><Zap size={10} /> {energyLabel(task.energy)}</span></div><h4>{task.title}</h4>{task.description && <p>{task.description}</p>}<div className="task-card-meta">{task.estimatedMinutes != null && <small><Timer size={11} /> {formatMinutes(task.estimatedMinutes)}</small>}{task.scheduledDate && <small><CalendarDays size={11} /> {formatShortDate(task.scheduledDate)}</small>}{task.dueDate && <small>Objetivo {formatShortDate(task.dueDate)}</small>}</div><div className="task-actions">{status !== "todo" && <button onClick={() => moveTask(task, status === "done" ? "doing" : "todo")}>←</button>}<button onClick={() => onOpen({ kind: "projectTask", projects: data.projects, project: selected, record: task })}><Edit3 size={13} /></button><button onClick={() => onDelete("projectTask", task.id)}><Trash2 size={13} /></button>{status !== "done" && <button onClick={() => moveTask(task, status === "todo" ? "doing" : "done")}>→</button>}</div></article>)}<button className="kanban-add" onClick={() => onOpen({ kind: "projectTask", projects: data.projects, project: selected })}><Plus size={14} /> Añadir tarea</button></div>)}
        </div>
        <div className="project-notes-strip"><div className="card-heading"><div><span className="section-label dark"><StickyNote size={14} /> BITÁCORA</span><h3>Notas del proyecto</h3></div><button className="add-inline top" onClick={() => onOpen({ kind: "note", projects: data.projects, projectId: selected.id })}><Plus size={14} /> Añadir</button></div><div className="notes-mini-grid">{projectNotes.map((note) => <button key={note.id} onClick={() => onOpen({ kind: "note", projects: data.projects, record: note })}><span>{note.category}</span><strong>{note.title}</strong><small>{note.content.slice(0, 100) || "Sin contenido"}</small></button>)}</div>{!projectNotes.length && <EmptyState text="Registra decisiones, ideas y aprendizajes de este proyecto." />}</div>
      </section>}
      {!data.projects.length && <section className="card"><EmptyState text="Todavía no tienes proyectos. Crea uno para convertir una idea en tareas concretas." action="Crear proyecto" onClick={() => onOpen({ kind: "project" })} /></section>}
    </> : tab === "sprint" ? <SprintWorkspace data={data} today={today} defaultProject={selected} onOpen={onOpen} onSave={onSave} onDelete={(id) => onDelete("projectTask", id)} /> : tab === "planning" ? <PlanningView data={data} today={today} embedded onOpen={onOpen} onSave={onSave} onDelete={onDelete} /> : <NotesLibrary notes={data.notes} projects={data.projects} onOpen={onOpen} onDelete={(id) => onDelete("note", id)} />}
  </div>;
}

function ProjectsView({ data, today, onOpen, onSave, onDelete }: {
  data: LifeData; today: string; onOpen: (modal: Modal) => void;
  onSave: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  onDelete: (resource: Resource, id: string) => void;
}) {
  const [view, setView] = useState<"day" | "week" | "month" | "goals" | "projects" | "focus" | "inbox">("day");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(data.projects[0]?.id ?? null);
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const dayTasks = data.projectTasks.filter((task) => isAction(task) && task.status !== "done" && task.scheduledDate === today).sort((a, b) => (a.scheduledTime || "99:99").localeCompare(b.scheduledTime || "99:99") || compareProjectTasks(a, b));
  const dayAgenda = data.projectTasks.filter((task) => !isAction(task) && task.scheduledDate === today).sort((a, b) => (a.scheduledTime || "99:99").localeCompare(b.scheduledTime || "99:99") || a.title.localeCompare(b.title, "es"));
  const unscheduled = data.projectTasks.filter((task) => isAction(task) && task.status !== "done" && !task.scheduledDate).sort(compareProjectTasks);
  const monthTasks = data.projectTasks.filter((task) => task.scheduledDate && task.scheduledDate.slice(0, 7) === today.slice(0, 7)).sort((a,b) => a.scheduledDate!.localeCompare(b.scheduledDate!) || compareProjectTasks(a,b));
  const weekTasks = data.projectTasks.filter((task) => isAction(task) && task.status !== "done" && task.scheduledDate && task.scheduledDate >= weekStart && task.scheduledDate <= weekEnd);
  const selectedProject = data.projects.find((item) => item.id === selectedProjectId) ?? data.projects[0] ?? null;
  const nav = [{ id:"day" as const, label:"Día", icon:CalendarDays },{ id:"week" as const, label:"Semana", icon:LayoutDashboard },{ id:"month" as const, label:"Mes", icon:CalendarDays },{ id:"goals" as const, label:"Objetivos", icon:Target },{ id:"projects" as const, label:"Proyectos", icon:FolderKanban },{ id:"focus" as const, label:"Foco", icon:Timer },{ id:"inbox" as const, label:"Inbox", icon:ListTodo }];
  const taskButton = (task: ProjectTask) => <button className={`planner-task-row ${task.itemType || "task"}`} key={task.id} onClick={() => onOpen({ kind:"projectTask", projects:data.projects, record:task })}><span className={`priority-dot ${task.itemType === "event" ? "high" : task.itemType === "reminder" ? "medium" : task.priority || "medium"}`} /><div><strong>{task.scheduledTime ? `${task.scheduledTime} · ` : ""}{task.title}</strong><small>{itemTypeLabel(task)}{task.itemType === "task" || !task.itemType ? ` · ${data.projects.find((project) => project.id === task.projectId)?.title ?? "Sin proyecto"} · ${task.estimatedMinutes != null ? formatMinutes(task.estimatedMinutes) : "Sin estimación"}` : task.description ? ` · ${task.description}` : ""}</small></div>{isAction(task) ? <span className={`energy-tag ${task.energy || "medium"}`}><Zap size={10}/>{energyLabel(task.energy)}</span> : <span className="agenda-kind">{task.itemType === "event" ? "Evento" : "Recordatorio"}</span>}</button>;
  return <div className="page-content subpage planner-product"><section className="planner-product-hero"><div><span className="section-label dark"><LayoutDashboard size={14}/> PLANNER</span><h2>Tu sistema para decidir<br/>y ejecutar con claridad.</h2><p>Una misma tarea se ve en tu día, tu semana, tu mes y el objetivo que ayuda a construir.</p></div><div className="planner-create-actions"><button className="primary-button" onClick={() => onOpen({ kind:"projectTask", projects:data.projects, defaultDate:today, defaultSprintWeek:weekStart })}><Plus size={16}/> Añadir tarea</button><button className="outline-compact" onClick={() => onOpen({ kind:"projectTask", projects:data.projects, defaultDate:today, defaultSprintWeek:weekStart, defaultItemType:"event" })}><CalendarDays size={15}/> Evento</button><button className="outline-compact" onClick={() => onOpen({ kind:"projectTask", projects:data.projects, defaultDate:today, defaultSprintWeek:weekStart, defaultItemType:"reminder" })}><Bell size={15}/> Recordatorio</button></div></section><div className="planner-nav" role="tablist">{nav.map(({id,label,icon:Icon}) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon size={15}/>{label}{id === "inbox" && unscheduled.length > 0 && <b>{unscheduled.length}</b>}</button>)}</div>
  {view === "day" && <section className="planner-day"><div className="planner-day-heading"><div><span className="section-label dark">HOY · {formatLongDate(today)}</span><h3>Tu foco tiene espacio.</h3></div><div className="planner-load"><strong>{formatMinutes(dayTasks.reduce((sum,item) => sum + (item.estimatedMinutes ?? 0),0))}</strong><small>de carga planificada</small></div></div><div className="planner-day-grid"><section className="card planner-unscheduled"><div className="card-heading"><div><span className="section-label dark"><ListTodo size={14}/> TAREAS</span><h3>Para hacer hoy</h3></div><button className="add-inline top" onClick={() => onOpen({kind:"projectTask",projects:data.projects,defaultDate:today,defaultSprintWeek:weekStart})}>+ Tarea</button></div>{dayTasks.map(taskButton)}{!dayTasks.length && <EmptyState text="No tienes tareas para hoy. Elige una del Inbox o crea una nueva." action="Planificar tarea" onClick={() => onOpen({kind:"projectTask",projects:data.projects,defaultDate:today,defaultSprintWeek:weekStart})}/>}</section><section className="card planner-timeline"><div className="card-heading"><div><span className="section-label dark"><CalendarDays size={14}/> AGENDA FIJA</span><h3>Eventos y recordatorios</h3></div><button className="add-inline top" onClick={() => onOpen({kind:"projectTask",projects:data.projects,defaultDate:today,defaultSprintWeek:weekStart})}>+ Añadir</button></div>{dayAgenda.map(taskButton)}{!dayAgenda.length && <p className="agenda-empty">No hay compromisos fijos. Añade un evento o recordatorio cuando no sea una tarea.</p>}</section></div><section className="planner-checkout"><div><span>CIERRE DEL DÍA</span><strong>Al terminar, revisa lo pendiente y decide: mañana, Inbox o eliminar.</strong></div><button onClick={() => setView("inbox")}>Abrir pendientes →</button></section></section>}
  {view === "week" && <SprintWorkspace data={data} today={today} defaultProject={selectedProject} onOpen={onOpen} onSave={onSave} onDelete={(id) => onDelete("projectTask", id)} />}
  {view === "month" && <section className="planner-month"><div className="planner-month-header"><div><span className="section-label dark"><CalendarDays size={14}/> MES · {monthLabel(today.slice(0,7))}</span><h3>Ritmo, carga y dirección.</h3></div><div><strong>{monthTasks.length}</strong><small>tareas programadas</small></div></div><div className="planner-month-layout"><section className="card planner-month-list"><div className="card-heading"><div><span className="section-label dark">CALENDARIO DE ACCIÓN</span><h3>Próximas tareas</h3></div></div>{monthTasks.slice(0,14).map(taskButton)}{!monthTasks.length && <EmptyState text="No hay tareas programadas este mes." action="Abrir semana" onClick={() => setView("week")}/>}</section><aside className="card planner-month-goals"><span className="section-label dark"><Target size={14}/> OBJETIVOS DEL MES</span>{data.planGoals.filter((goal) => goal.scope === "month" && goal.period === today.slice(0,7)).map((goal) => { const p = goalCompletion(goal,data.planTasks,data.projectTasks).progress; return <button key={goal.id} onClick={() => onOpen({kind:"planGoal",projects:data.projects,record:goal})}><strong>{goal.title}</strong><span>{p == null ? "Sin tareas asociadas" : `${p}% de avance`}</span><i><b style={{width:`${p ?? 0}%`}}/></i></button>; })}<button className="month-goal-add" onClick={() => onOpen({kind:"planGoal",projects:data.projects,defaultScope:"month",defaultPeriod:today.slice(0,7)})}>+ Definir objetivo mensual</button></aside></div></section>}
  {view === "goals" && <PlanningView data={data} today={today} embedded onOpen={onOpen} onSave={onSave} onDelete={onDelete}/>} 
  {view === "projects" && <section className="planner-projects"><div className="planner-section-top"><div><span className="section-label dark"><FolderKanban size={14}/> ÁREAS Y PROYECTOS</span><h3>El contexto detrás de tus tareas.</h3></div><button className="primary-button" onClick={() => onOpen({kind:"project"})}><Plus size={15}/> Nuevo proyecto</button></div><div className="planner-project-grid">{data.projects.map((project) => {const tasks=data.projectTasks.filter((task)=>task.projectId===project.id);const done=tasks.filter((task)=>task.status==="done").length;const progress=tasks.length?Math.round(done/tasks.length*100):0;return <button key={project.id} className={`planner-project-card ${selectedProjectId===project.id?"selected":""}`} onClick={()=>setSelectedProjectId(project.id)}><span className={`module-icon ${project.color}`}><FolderKanban size={18}/></span><small>{project.area} · {projectStatus(project.status)}</small><strong>{project.title}</strong><p>{done}/{tasks.length} tareas completadas</p><i><b style={{width:`${progress}%`}}/></i><em>{progress}%</em></button>; })}<button className="planner-new-project" onClick={() => onOpen({kind:"project"})}>＋<strong>Crear proyecto</strong><small>Conecta trabajo, salud, finanzas o aprendizaje</small></button></div>{selectedProject && <section className="card planner-project-detail"><div><span className="section-label dark">PROYECTO SELECCIONADO</span><h3>{selectedProject.title}</h3><p>{selectedProject.description || "Añade un resultado esperado para dar contexto a este proyecto."}</p></div><div>{data.projectTasks.filter((task)=>task.projectId===selectedProject.id && task.status!=="done").slice(0,4).map(taskButton)}<button className="add-inline" onClick={() => onOpen({kind:"projectTask",projects:data.projects,project:selectedProject,defaultDate:today})}>+ Añadir tarea al proyecto</button></div></section>}</section>}
  {view === "focus" && <section className="planner-focus"><div className="planner-section-top"><div><span className="section-label dark"><Timer size={14}/> FOCO Y ENERGÍA</span><h3>Entiende dónde se va tu semana.</h3></div></div><div className="planner-focus-grid"><section className="card"><span className="section-label dark">CARGA SEMANAL</span><h3>{formatMinutes(weekTasks.reduce((sum,item)=>sum+(item.estimatedMinutes??0),0))}</h3><p>planificados entre {weekTasks.length} tareas pendientes.</p><div className="area-bars">{data.projects.slice(0,5).map(project=>{const minutes=weekTasks.filter(task=>task.projectId===project.id).reduce((sum,item)=>sum+(item.estimatedMinutes??0),0);return <div key={project.id}><span>{project.title}</span><i><b style={{width:`${Math.min(100,minutes/360*100)}%`}}/></i><small>{formatMinutes(minutes)}</small></div>; })}</div></section><section className="card"><span className="section-label dark">ENERGÍA REQUERIDA</span><h3>Distribución del foco</h3>{(["high","medium","low"] as const).map(level=>{const tasks=weekTasks.filter(task=>task.energy===level);return <div className="energy-summary" key={level}><span className={level}>{level==="high"?"⚡⚡⚡":level==="medium"?"⚡⚡":"⚡"}</span><div><strong>{energyLabel(level)}</strong><small>{tasks.length} tareas · {formatMinutes(tasks.reduce((sum,item)=>sum+(item.estimatedMinutes??0),0))}</small></div></div>; })}</section></div></section>}
  {view === "inbox" && <section className="planner-inbox"><div className="planner-section-top"><div><span className="section-label dark"><ListTodo size={14}/> INBOX</span><h3>Captura primero. Decide después.</h3><p>Todo lo que aún no tiene fecha vive aquí, sin perderse entre notas o tareas.</p></div><button className="primary-button" onClick={() => onOpen({kind:"projectTask",projects:data.projects})}><Plus size={15}/> Capturar tarea</button></div><section className="card planner-inbox-list">{unscheduled.map(taskButton)}{!unscheduled.length && <EmptyState text="Inbox vacío. Tus próximas ideas aparecerán aquí hasta que las programes." action="Capturar tarea" onClick={() => onOpen({kind:"projectTask",projects:data.projects})}/>}</section></section>}
  </div>;
}

function WorkOverview({ data, today, onOpen, onTab }: { data: LifeData; today: string; onOpen: (modal: Modal) => void; onTab: (tab: "overview" | "planning" | "sprint" | "projects" | "notes") => void }) {
  const weekEnd = addDays(today, 6);
  const todayTasks = data.projectTasks.filter((task) => task.status !== "done" && task.scheduledDate === today).sort(compareProjectTasks);
  const upcoming = data.projectTasks.filter((task) => task.status !== "done" && task.scheduledDate && task.scheduledDate >= today && task.scheduledDate <= weekEnd).sort(compareProjectTasks).slice(0, 5);
  const activeProjects = data.projects.filter((project) => project.status === "active");
  const activeGoals = data.planGoals.filter((goal) => goal.status !== "done").slice(0, 3);
  return <section className="work-overview"><div className="work-overview-hero"><div><span className="section-label dark"><LayoutDashboard size={14} /> TU CENTRO DE EJECUCIÓN</span><h3>De la dirección a la acción de hoy.</h3><p>Todo lo que ya registras en LifeOS, ordenado para decidir qué hacer ahora sin perder el contexto.</p></div><button className="primary-button" onClick={() => onOpen({ kind: "projectTask", projects: data.projects, defaultDate: today, defaultSprintWeek: startOfWeek(today) })}><Plus size={16} /> Planificar tarea</button></div><div className="work-overview-stats"><article><small>HOY</small><strong>{todayTasks.length}</strong><span>tareas programadas</span></article><article><small>ESTA SEMANA</small><strong>{upcoming.length}</strong><span>acciones pendientes</span></article><article><small>PROYECTOS ACTIVOS</small><strong>{activeProjects.length}</strong><span>en movimiento</span></article><article><small>OBJETIVOS ABIERTOS</small><strong>{activeGoals.length}</strong><span>con dirección</span></article></div><div className="work-overview-grid"><section className="card overview-today"><div className="card-heading"><div><span className="section-label dark"><CalendarDays size={14} /> HOY</span><h3>Tus próximos pasos</h3></div><button className="add-inline top" onClick={() => onTab("sprint")}>Abrir agenda →</button></div>{todayTasks.map((task) => <button key={task.id} onClick={() => onOpen({ kind: "projectTask", projects: data.projects, record: task })}><span className={`priority-dot ${task.priority || "medium"}`} /><div><strong>{task.title}</strong><small>{data.projects.find((project) => project.id === task.projectId)?.title ?? "Sin proyecto"} · {task.estimatedMinutes != null ? formatMinutes(task.estimatedMinutes) : "Sin estimación"}</small></div><Edit3 size={14} /></button>)}{!todayTasks.length && <EmptyState text="No tienes tareas programadas para hoy." action="Planificar ahora" onClick={() => onOpen({ kind: "projectTask", projects: data.projects, defaultDate: today, defaultSprintWeek: startOfWeek(today) })} />}</section><section className="card overview-direction"><div className="card-heading"><div><span className="section-label dark"><Target size={14} /> DIRECCIÓN</span><h3>Lo que estás construyendo</h3></div><button className="add-inline top" onClick={() => onTab("planning")}>Ver objetivos →</button></div>{activeGoals.map((goal) => { const completion = goalCompletion(goal, data.planTasks, data.projectTasks); return <button key={goal.id} onClick={() => onOpen({ kind: "planGoal", projects: data.projects, record: goal })}><div><strong>{goal.title}</strong><small>{goal.scope === "year" ? "Anual" : goal.scope === "quarter" ? "Trimestral" : goal.scope === "month" ? "Mensual" : "Semanal"}</small></div>{completion.progress != null ? <span>{completion.progress}%</span> : <span>—</span>}</button>; })}{!activeGoals.length && <EmptyState text="Define un objetivo para orientar tus proyectos." action="Crear objetivo" onClick={() => onOpen({ kind: "planGoal", projects: data.projects, defaultScope: "month", defaultPeriod: today.slice(0, 7) })} />}</section></div></section>;
}

function SprintWorkspace({ data, today, defaultProject, onOpen, onSave, onDelete }: {
  data: LifeData; today: string; defaultProject: Project | null; onOpen: (modal: Modal) => void;
  onSave: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekEnd = days[6];
  const allWeekTasks = data.projectTasks.filter((task) => isAction(task) && task.scheduledDate != null && task.scheduledDate <= weekEnd && taskEndDate(task) >= weekStart);
  const agendaItems = data.projectTasks.filter((task) => !isAction(task) && task.scheduledDate != null && task.scheduledDate <= weekEnd && taskEndDate(task) >= weekStart);
  const weekTasks = allWeekTasks.filter((task) => task.status !== "done");
  const completedTasks = allWeekTasks.filter((task) => task.status === "done");
  const completed = completedTasks.length;
  const estimated = weekTasks.reduce((sum, task) => sum + taskMinutesInRange(task, weekStart, weekEnd), 0);
  const taskLanes = sprintTaskLanes(weekTasks, weekStart, weekEnd);
  const weeklyNotes = data.notes.filter((note) => note.sprintWeek === weekStart);
  const activeGoals = data.planGoals.filter((goal) => goal.status !== "done" && (goal.scope === "week" ? goal.period === weekStart : goal.scope === "month" ? goal.period === weekStart.slice(0, 7) : true)).sort((a, b) => ({ year: 0, semester: 1, quarter: 2, month: 3, week: 4 }[a.scope] ?? 5) - ({ year: 0, semester: 1, quarter: 2, month: 3, week: 4 }[b.scope] ?? 5)).slice(0, 4);
  const openTask = (record?: ProjectTask, defaultDate = weekStart) => onOpen({ kind: "projectTask", projects: data.projects, project: data.projects.find((project) => project.id === record?.projectId) ?? defaultProject ?? undefined, record, defaultDate, defaultSprintWeek: weekStart });
  async function advance(task: ProjectTask) {
    const status: ProjectTask["status"] = task.status === "todo" ? "doing" : task.status === "doing" ? "done" : "todo";
    await onSave("projectTask", { ...task, status }, status === "done" ? "Tarea completada" : "Estado actualizado");
  }
  function taskCard(task: ProjectTask, compact = false) {
    const project = data.projects.find((item) => item.id === task.projectId);
    return <article className={`sprint-task-card ${task.status} ${task.itemType || "task"} ${task.priority === "high" ? "high-priority" : ""} ${compact ? "compact" : ""}`} key={task.id}>
      {isAction(task) ? <button className="sprint-task-toggle" onClick={() => advance(task)} aria-label={`Cambiar estado de ${task.title}`}>{task.status === "done" ? <CheckCircle2 size={16} /> : task.status === "doing" ? <Activity size={16} /> : <Circle size={16} />}</button> : <span className="sprint-item-icon">{task.itemType === "event" ? "●" : "◦"}</span>}
      <button className="sprint-task-body" onClick={() => openTask(task)}><span>{isAction(task) ? project?.title ?? "Sin proyecto" : itemTypeLabel(task)}</span><strong>{task.title}</strong><small>{isAction(task) ? <>{task.estimatedMinutes != null ? formatMinutes(task.estimatedMinutes) : "Sin estimación"} · <Zap size={10} /> {energyLabel(task.energy)}</> : <>{task.scheduledTime || "Sin hora fija"}{task.description ? ` · ${task.description}` : ""}</>}</small></button>
      <div className="sprint-task-side"><span className={`priority-dot ${task.priority || "medium"}`} title={`Prioridad ${priorityLabel(task.priority || "medium")}`} />{!compact && <button onClick={() => onDelete(task.id)} aria-label={`Eliminar ${task.title}`}><Trash2 size={12} /></button>}</div>
    </article>;
  }
  return <section className="sprint-workspace">
    <div className="sprint-toolbar"><div><span className="section-label dark"><CalendarDays size={14} /> SPRINT SEMANAL</span><h3>{formatShortDate(weekStart)} — {formatShortDate(weekEnd)}</h3><p>Cada tarea requiere día, tiempo estimado, energía y prioridad. El proyecto es opcional.</p></div><div className="sprint-actions"><button className="icon-button" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Semana anterior">←</button><button className="outline-compact" onClick={() => setWeekStart(startOfWeek(today))}>Esta semana</button><button className="icon-button" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Semana siguiente">→</button><button className="primary-button" onClick={() => openTask()}><Plus size={15} /> Nueva tarea</button></div></div>
    <div className="sprint-summary"><article><small>PENDIENTES DEL SPRINT</small><strong>{weekTasks.length}</strong><span>{completed} completadas en el registro</span></article><article><small>TIEMPO PENDIENTE</small><strong>{formatMinutes(estimated)}</strong><span>{weekTasks.filter((task) => task.estimatedMinutes == null).length} sin estimar</span></article><article><small>CAPACIDAD SEMANAL</small><strong>{formatMinutes(7 * 360 - estimated)}</strong><span>de 42 h efectivas disponibles</span></article><article><small>AGENDA FIJA</small><strong>{agendaItems.length}</strong><span>eventos y recordatorios</span></article></div>
    <section className="sprint-direction"><div><span className="section-label dark"><Target size={14} /> DIRECCIÓN Y CONTEXTO</span><h3>Lo que esta semana está construyendo</h3><div className="sprint-goal-list">{activeGoals.map((goal) => { const parent = data.planGoals.find((item) => item.id === goal.parentGoalId); const progress = goalCompletion(goal, data.planTasks, data.projectTasks).progress; return <button key={goal.id} onClick={() => onOpen({ kind: "planGoal", projects: data.projects, record: goal })}><span>{goal.scope === "year" ? "Año" : goal.scope === "semester" ? "Semestre" : goal.scope === "quarter" ? "Trimestre" : goal.scope === "month" ? "Mes" : "Semana"}</span><strong>{goal.title}</strong><small>{parent ? `Parte de: ${parent.title}` : goal.description || "Define el siguiente hito"}</small>{progress != null && <i><b style={{ width: `${progress}%` }} /></i>}</button>; })}{!activeGoals.length && <button className="sprint-direction-empty" onClick={() => onOpen({ kind: "planGoal", projects: data.projects, defaultScope: "year", defaultPeriod: today.slice(0, 4) })}>+ Define tu primer objetivo anual</button>}</div></div><div className="sprint-notes"><div className="card-heading"><div><span className="section-label dark"><StickyNote size={14} /> NOTAS DE LA SEMANA</span><h3>Decisiones e ideas</h3></div><button className="add-inline top" onClick={() => onOpen({ kind: "note", projects: data.projects, sprintWeek: weekStart })}><Plus size={14} /> Nota</button></div>{weeklyNotes.map((note) => <button key={note.id} onClick={() => onOpen({ kind: "note", projects: data.projects, record: note })}><strong>{note.title}</strong><small>{note.content || "Sin contenido"}</small></button>)}{!weeklyNotes.length && <p>Deja aquí el contexto que necesitas recuperar al revisar el sprint.</p>}</div></section>
    <div className="sprint-calendar"><div className="sprint-days">{days.map((date) => { const planned = weekTasks.reduce((sum, task) => sum + taskMinutesOnDate(task, date), 0); const remaining = 360 - planned; const isToday = date === today; return <section className={`sprint-day ${isToday ? "today" : ""} ${remaining < 0 ? "over-capacity" : ""}`} key={date}><header><div><small>{shortDay(date)}</small><strong>{new Date(`${date}T12:00:00Z`).getUTCDate()}</strong></div><span className="day-capacity"><b>{formatMinutes(planned)}</b> / 6 h<br/><em>{remaining >= 0 ? `${formatMinutes(remaining)} libres` : `${formatMinutes(Math.abs(remaining))} de más`}</em></span></header><button className="sprint-add" onClick={() => openTask(undefined, date)}><Plus size={13} /> Añadir</button></section>; })}</div><div className="sprint-timeline" style={{ gridTemplateRows: `repeat(${Math.max(1, taskLanes.length ? Math.max(...taskLanes.map((item) => item.lane)) + 1 : 1)}, minmax(54px, auto))` }}>{taskLanes.map(({ task, start, end, lane }) => <div className="sprint-task-span" style={{ gridColumn: `${start} / ${end + 1}`, gridRow: lane + 1 }} key={task.id}>{taskCard(task, true)}</div>)}</div>{agendaItems.length > 0 && <div className="sprint-agenda-items">{agendaItems.sort((a,b) => (a.scheduledTime || "99:99").localeCompare(b.scheduledTime || "99:99")).map((task) => taskCard(task))}</div>}</div>
    <details className="sprint-history"><summary><CheckCircle2 size={15} /> Completadas esta semana ({completedTasks.length})</summary><div>{completedTasks.sort(compareProjectTasks).map((task) => taskCard(task))}</div>{!completedTasks.length && <p>Aún no hay tareas completadas en este sprint.</p>}</details>
  </section>;
}

function NotesLibrary({ notes, projects, onOpen, onDelete }: { notes: NoteItem[]; projects: Project[]; onOpen: (modal: Modal) => void; onDelete: (id: string) => void }) {
  const [filter, setFilter] = useState("Todas");
  const categories = ["Todas", ...Array.from(new Set(notes.map((note) => note.category)))];
  const visible = filter === "Todas" ? notes : notes.filter((note) => note.category === filter);
  return <section><div className="notes-toolbar"><div className="filter-chips">{categories.map((category) => <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>)}</div><button className="primary-button" onClick={() => onOpen({ kind: "note", projects })}><Plus size={16} /> Nueva nota</button></div><div className="notes-grid">{visible.map((note) => { const project = projects.find((item) => item.id === note.projectId); return <article className={`note-card ${note.pinned ? "pinned" : ""}`} key={note.id}><div className="note-top"><span>{note.pinned ? "★ " : ""}{note.category}</span><div className="row-actions"><button onClick={() => onOpen({ kind: "note", projects, record: note })}><Edit3 size={14} /></button><button onClick={() => onDelete(note.id)}><Trash2 size={14} /></button></div></div><h3>{note.title}</h3><p>{note.content || "Sin contenido."}</p><small>{project ? `Proyecto: ${project.title}` : "Nota general"}</small></article>; })}</div>{!visible.length && <section className="card"><EmptyState text="No hay notas en esta categoría." action="Crear nota" onClick={() => onOpen({ kind: "note", projects })} /></section>}</section>;
}

function BucketListView({ items, today, onOpen, onSave, onDelete }: {
  items: BucketItem[]; today: string; onOpen: (modal: Modal) => void;
  onSave: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [category, setCategory] = useState("Todas");
  const [status, setStatus] = useState<"all" | BucketItem["status"]>("all");
  const categories = ["Todas", ...Array.from(new Set(items.map((item) => item.category)))];
  const visible = items.filter((item) => (category === "Todas" || item.category === category) && (status === "all" || item.status === status));
  const completed = items.filter((item) => item.status === "completed").length;
  const inProgress = items.filter((item) => item.status === "inProgress").length;
  const progress = items.length ? Math.round(completed / items.length * 100) : 0;
  async function toggle(item: BucketItem) {
    const next = item.status === "completed" ? "pending" : "completed";
    await onSave("bucketItem", { ...item, status: next, completedAt: next === "completed" ? today : null }, next === "completed" ? "Sueño cumplido" : "Vuelve a tu lista");
  }
  return <div className="page-content subpage">
    <section className="bucket-hero"><div><span className="section-label light"><Globe2 size={14} /> MI BUCKET LIST</span><h2>Una vida que merezca<br />ser recordada.</h2><p>Guarda experiencias, lugares, aprendizajes y sueños que quieras vivir antes de morir.</p><button className="bucket-primary" onClick={() => onOpen({ kind: "bucketItem" })}><Plus size={17} /> Añadir un sueño</button></div><div className="bucket-progress"><div className="bucket-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong><span>vivido</span></div><div><strong>{completed}</strong><span>cumplidos</span><strong>{inProgress}</strong><span>en progreso</span><strong>{items.length - completed - inProgress}</strong><span>pendientes</span></div></div></section>
    <div className="bucket-toolbar"><div className="filter-chips">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="segmented"><button className={status === "all" ? "active" : ""} onClick={() => setStatus("all")}>Todos</button><button className={status === "pending" ? "active" : ""} onClick={() => setStatus("pending")}>Pendientes</button><button className={status === "inProgress" ? "active" : ""} onClick={() => setStatus("inProgress")}>En progreso</button><button className={status === "completed" ? "active" : ""} onClick={() => setStatus("completed")}>Cumplidos</button></div></div>
    <div className="bucket-grid">{visible.map((item, index) => <article className={`bucket-card ${item.status}`} key={item.id}><div className="bucket-card-number">{String(index + 1).padStart(2, "0")}</div><div className="bucket-card-top"><span>{item.category} · {bucketStatus(item.status)}</span><div className="row-actions"><button onClick={() => onOpen({ kind: "bucketItem", record: item })}><Edit3 size={14} /></button><button onClick={() => onDelete(item.id)}><Trash2 size={14} /></button></div></div><h3>{item.title}</h3><p>{item.description || "Un sueño pendiente de escribir con más detalle."}</p>{item.location && <small><MapPin size={12} /> {item.location}</small>}{item.targetDate && <small>Objetivo: {formatShortDate(item.targetDate)}</small>}<button className="bucket-toggle" onClick={() => toggle(item)}>{item.status === "completed" ? <><CheckCircle2 size={16} /> Cumplido {item.completedAt ? formatShortDate(item.completedAt) : ""}</> : <><Circle size={16} /> Marcar como cumplido</>}</button></article>)}</div>
    {!visible.length && <section className="card"><EmptyState text={items.length ? "No hay elementos con estos filtros." : "Tu bucket list está esperando su primer sueño."} action={!items.length ? "Añadir el primero" : undefined} onClick={!items.length ? () => onOpen({ kind: "bucketItem" }) : undefined} /></section>}
  </div>;
}

function MoreView({ data, onNavigate, onDownload, onImport, cloudUser, cloudStatus, onLogin, onLogout, onPush, onPull }: { data: LifeData; onNavigate: (view: View) => void; onDownload: () => void; onImport: (file: File) => void; cloudUser: string | null; cloudStatus: string; onLogin: () => void; onLogout: () => void; onPush: () => void; onPull: () => void }) {
  const modules = [
    { title: "Enfoque y tiempo", text: `${data.focusSessions.length} sesiones registradas`, icon: Timer, color: "lilac", view: "focus" as View },
    { title: "Hábitos", text: `${data.habits.length} configurados`, icon: Flame, color: "lilac", view: "habits" as View },
    { title: "Métricas", text: `${data.metrics.length} registros`, icon: BarChart3, color: "mint", view: "metrics" as View },
    { title: "Experimentos y retos", text: `${data.programs.length} activos o guardados`, icon: Rocket, color: "sand", view: "programs" as View },
    { title: "Bullet journal", text: `${data.bullets.length} elementos`, icon: ListTodo, color: "rose", view: "journal" as View },
    { title: "Proyectos, plan y notas", text: `${data.projects.length} proyectos · ${data.planGoals.length} objetivos · ${data.notes.length} notas`, icon: FolderKanban, color: "blue", view: "projects" as View },
    { title: "Bucket list", text: `${data.bucketItems.filter((item) => item.status === "completed").length}/${data.bucketItems.length} sueños cumplidos`, icon: Star, color: "rose", view: "bucket" as View },
    { title: "Journal", text: `${data.journals.length} entradas`, icon: BookOpen, color: "gray", view: "journal" as View },
    { title: "Agradecimientos", text: `${data.gratitudes.length} momentos guardados`, icon: Gift, color: "sand", view: "gratitude" as View },
    { title: "Mapa vital", text: `${data.mindNodes.length} elementos conectados`, icon: Network, color: "mint", view: "mindmap" as View },
  ];
  return <div className="page-content subpage">
    <section className="more-hero"><span className="section-label light"><Sparkles size={14} /> TU UNIVERSO PERSONAL</span><h2>Todo lo que importa,<br />registrado en un lugar.</h2><p>LifeOS guarda los datos en este navegador para funcionar sin conexión y, cuando accedes con Google, los sincroniza automáticamente entre tus dispositivos.</p></section>
    <section className="local-storage-card">
      <div className="local-storage-icon"><HardDrive size={24} /></div>
      <div><span className="section-label dark">DATOS LOCALES</span><h3>Tu información vive en este ordenador</h3><p>Descarga una copia completa para conservarla antes de borrar los datos del navegador o cambiar de equipo.</p></div>
      <button className="primary-button" onClick={onDownload}><Download size={16} /> Descargar copia</button>
    </section>
    <section className="cloud-migration-card">
      <div className="cloud-migration-heading"><span className="local-storage-icon"><Globe2 size={23} /></span><div><span className="section-label dark">SINCRONIZACIÓN PERSONAL</span><h3>{cloudUser ? `Conectado como ${cloudUser}` : "Lleva LifeOS contigo"}</h3><p>{cloudUser ? `${cloudStatus}. Los cambios se guardan automáticamente; los controles manuales quedan disponibles como respaldo.` : "Accede con Google para sincronizar tu copia privada entre ordenador y móvil."}</p></div></div>
      <div className="cloud-migration-actions">{cloudUser ? <><button className="primary-button" onClick={onPush}><Globe2 size={15} /> Guardar en la nube</button><button className="outline-compact" onClick={onPull}>Recuperar copia</button><button className="danger-text" onClick={onLogout}>Cerrar sesión</button></> : <button className="primary-button" onClick={onLogin}><Globe2 size={15} /> Continuar con Google</button>}<label className="outline-compact import-backup">Importar copia actual<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ""; }} /></label></div>
      <small>La importación no borra el archivo original. Si has iniciado sesión, la copia importada se sincroniza automáticamente.</small>
    </section>
    <div className="module-grid">{modules.map(({ title, text, icon: Icon, color, view }) => <button key={title} className="module-card" onClick={() => onNavigate(view)}><span className={`module-icon ${color}`}><Icon size={22} /></span><div><strong>{title}</strong><small>{text}</small></div><ArrowRight size={18} /></button>)}</div>
  </div>;
}

function RecordModal({ modal, data, today, close, save, navigate, open }: {
  modal: Exclude<Modal, null>; data: LifeData; today: string; close: () => void;
  save: (resource: Resource, payload: Record<string, unknown>, message?: string) => Promise<void>;
  navigate: (view: View) => void; open: (modal: Modal) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  async function submit(resource: Resource, payload: Record<string, unknown>, message?: string) {
    setBusy(true); setFormError("");
    try { await save(resource, payload, message); } catch (error) { setFormError(error instanceof Error ? error.message : "No se pudo guardar."); setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={close}><div className="quick-modal record-modal" onMouseDown={(event) => event.stopPropagation()}>
    <div className="modal-heading"><div><span className="section-label dark"><Sparkles size={14} /> REGISTRO LIFEOS</span><h3>{modalTitle(modal)}</h3></div><button className="icon-button" onClick={close}><X size={18} /></button></div>
    {formError && <p className="form-error">{formError}</p>}
    {modal.kind === "quick" && <div className="quick-options">
      <button onClick={() => open({ kind: "metric" })}><Heart size={19} /><span><strong>Check-in rápido</strong><small>Peso, ánimo, energía, sueño y pantalla</small></span><ArrowRight size={16} /></button>
      <button onClick={() => open({ kind: "quickFocus" })}><Timer size={19} /><span><strong>Registrar tiempo</strong><small>Añade una sesión manual en pocos pasos</small></span><ArrowRight size={16} /></button>
      <button onClick={() => { navigate("focus"); close(); }}><Play size={19} /><span><strong>Iniciar Pomodoro</strong><small>Comienza un bloque de enfoque de 45 minutos</small></span><ArrowRight size={16} /></button>
      <button onClick={() => { navigate("projects"); close(); }}><CalendarDays size={19} /><span><strong>Nueva tarea del sprint</strong><small>Planifícala por día, tiempo, energía y prioridad</small></span><ArrowRight size={16} /></button>
      <button onClick={() => { navigate("journal"); close(); }}><PenLine size={19} /><span><strong>Journal y bullet list</strong><small>Escribe, anota una tarea o registra un evento</small></span><ArrowRight size={16} /></button>
      <button onClick={() => { navigate("habits"); close(); }}><CheckCircle2 size={19} /><span><strong>Completar hábito</strong><small>Actualiza tu registro diario</small></span><ArrowRight size={16} /></button>
      <button onClick={() => open({ kind: "gratitude" })}><Gift size={19} /><span><strong>Agradecimiento</strong><small>Guarda algo bueno de este día</small></span><ArrowRight size={16} /></button>
    </div>}
    {modal.kind === "quickFocus" && <QuickFocusForm data={data} today={today} busy={busy} onSubmit={(payload) => submit("focusSession", payload, "Tiempo registrado")} />}
    {modal.kind === "habit" && <HabitForm record={modal.record} busy={busy} onSubmit={(payload) => submit("habit", payload, modal.record ? "Hábito actualizado" : "Hábito creado")} />}
    {modal.kind === "metric" && <MetricForm record={modal.record} today={today} busy={busy} onSubmit={(payload) => submit("metric", payload, "Métricas guardadas")} />}
    {modal.kind === "bullet" && <BulletForm record={modal.record} today={modal.date ?? today} busy={busy} onSubmit={(payload) => submit("bullet", payload, modal.record ? "Elemento actualizado" : "Elemento añadido")} />}
    {modal.kind === "program" && <ProgramForm record={modal.record} kind={modal.record?.kind ?? modal.programKind ?? "experiment"} today={today} busy={busy} onSubmit={(payload) => submit("program", payload, modal.record ? "Actualizado" : "Creado")} />}
    {modal.kind === "programLog" && <ProgramLogForm program={modal.program} record={modal.record} today={today} busy={busy} onSubmit={(payload) => submit("programLog", payload, "Registro diario guardado")} />}
    {modal.kind === "project" && <ProjectForm record={modal.record} today={today} busy={busy} onSubmit={(payload) => submit("project", payload, modal.record ? "Proyecto actualizado" : "Proyecto creado")} />}
    {modal.kind === "projectTask" && <ProjectTaskForm projects={modal.projects} goals={data.planGoals} project={modal.project} record={modal.record} defaultDate={modal.defaultDate} defaultSprintWeek={modal.defaultSprintWeek} defaultItemType={modal.defaultItemType} busy={busy} onSubmit={(payload) => submit("projectTask", payload, modal.record ? "Elemento actualizado" : "Elemento creado")} />}
    {modal.kind === "planGoal" && <PlanGoalForm projects={modal.projects} goals={data.planGoals} record={modal.record} defaultScope={modal.defaultScope} defaultPeriod={modal.defaultPeriod} today={today} busy={busy} onSubmit={(payload) => submit("planGoal", payload, modal.record ? "Objetivo actualizado" : "Objetivo creado")} />}
    {modal.kind === "planTask" && <PlanTaskForm goal={modal.goal} goals={modal.goals} projects={modal.projects} record={modal.record} defaultPeriod={modal.defaultPeriod} today={today} busy={busy} onSubmit={(payload) => submit("planTask", payload, modal.record ? "Tarea actualizada" : "Tarea creada")} />}
    {modal.kind === "note" && <NoteForm projects={modal.projects} projectId={modal.projectId} sprintWeek={modal.sprintWeek} record={modal.record} busy={busy} onSubmit={(payload) => submit("note", payload, modal.record ? "Nota actualizada" : "Nota creada")} />}
    {modal.kind === "bucketItem" && <BucketItemForm record={modal.record} busy={busy} onSubmit={(payload) => submit("bucketItem", payload, modal.record ? "Sueño actualizado" : "Añadido a tu bucket list")} />}
    {modal.kind === "gratitude" && <GratitudeForm record={modal.record} today={today} busy={busy} onSubmit={(payload) => submit("gratitude", payload, modal.record ? "Agradecimiento actualizado" : "Agradecimiento guardado")} />}
    {modal.kind === "mindNode" && <MindNodeForm nodes={modal.nodes} projects={modal.projects} record={modal.record} parentId={modal.parentId} busy={busy} onSubmit={(payload) => submit("mindNode", payload, modal.record ? "Nodo actualizado" : "Nodo añadido al mapa")} />}
  </div></div>;
}

function HabitForm({ record, busy, onSubmit }: { record?: Habit; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, name: record?.name ?? "", detail: record?.detail ?? "", category: record?.category ?? "Bienestar", color: record?.color ?? "mint", active: record?.active ?? true });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Caminar 30 minutos" /></label><label>Objetivo o detalle<input value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} placeholder="Ej. Todos los días" /></label><div className="form-grid"><label>Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Salud física</option><option>Salud mental</option><option>Crecimiento</option><option>Relaciones</option><option>Bienestar</option></select></label><label>Color<select value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })}><option value="mint">Verde</option><option value="lilac">Violeta</option><option value="sand">Arena</option><option value="rose">Rosa</option></select></label></div><label className="toggle-label"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Hábito activo</label><SubmitButton busy={busy} label={record ? "Guardar cambios" : "Crear hábito"} /></form>;
}

function MetricForm({ record, today, busy, onSubmit }: { record?: Metric; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, date: record?.date ?? today, weight: record?.weight ?? "", mood: record?.mood ?? 3, energy: record?.energy ?? 5, sleepHours: record?.sleepHours ?? "", sleepQuality: record?.sleepQuality ?? "", stress: record?.stress ?? 5, exerciseMinutes: record?.exerciseMinutes ?? "", activeCalories: record?.activeCalories ?? "", screenTimeHours: record?.screenTimeHours ?? "", notes: record?.notes ?? "" });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><label>Fecha<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><div className="form-grid"><label>Peso (kg)<input type="number" step="0.1" min="20" max="350" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} placeholder="95,4" /></label><label>Sueño (horas)<input type="number" step="0.1" min="0" max="24" value={form.sleepHours} onChange={(event) => setForm({ ...form, sleepHours: event.target.value })} placeholder="7,5" /></label><label>Calidad del sueño (%)<input type="number" min="1" max="100" step="1" value={form.sleepQuality} onChange={(event) => setForm({ ...form, sleepQuality: event.target.value })} placeholder="Ej. 82" /><small className="field-help">Usa el porcentaje que registra tu reloj.</small></label><label>Ejercicio (min)<input type="number" min="0" max="600" value={form.exerciseMinutes} onChange={(event) => setForm({ ...form, exerciseMinutes: event.target.value })} placeholder="30" /></label><label>Calorías activas (kcal)<input type="number" min="0" max="10000" value={form.activeCalories} onChange={(event) => setForm({ ...form, activeCalories: event.target.value })} placeholder="Ej. 420" /><small className="field-help">Usa las calorías activas que registra tu reloj o móvil.</small></label><label>Tiempo de pantalla (horas)<input type="number" step="0.1" min="0" max="24" value={form.screenTimeHours} onChange={(event) => setForm({ ...form, screenTimeHours: event.target.value })} placeholder="Ej. 4,5" /><small className="field-help">Puedes verlo en Bienestar digital o Tiempo de uso de tu móvil.</small></label></div><RangeField label={`Ánimo ${form.mood}/5`} min={1} max={5} value={Number(form.mood)} onChange={(value) => setForm({ ...form, mood: value })} /><RangeField label={`Energía ${form.energy}/10`} min={1} max={10} value={Number(form.energy)} onChange={(value) => setForm({ ...form, energy: value })} /><RangeField label={`Estrés ${form.stress}/10`} min={1} max={10} value={Number(form.stress)} onChange={(value) => setForm({ ...form, stress: value })} /><label>Notas<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Cómo te has sentido, contexto o algo a recordar…" /></label><SubmitButton busy={busy} label="Guardar métricas" /></form>;
}

function BulletForm({ record, today, busy, onSubmit }: { record?: BulletItem; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, date: record?.date ?? today, type: record?.type ?? "task", text: record?.text ?? "", done: record?.done ?? false });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><div className="form-grid"><label>Fecha<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Tipo<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="task">Tarea ·</option><option value="note">Nota —</option><option value="event">Evento ○</option></select></label></div><label>Contenido<textarea required value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} placeholder="¿Qué quieres dejar registrado?" /></label>{form.type === "task" && <label className="toggle-label"><input type="checkbox" checked={form.done} onChange={(event) => setForm({ ...form, done: event.target.checked })} /> Completada</label>}<SubmitButton busy={busy} label={record ? "Guardar cambios" : "Añadir al registro"} /></form>;
}

function ProgramForm({ record, kind, today, busy, onSubmit }: { record?: Program; kind: "experiment" | "challenge"; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, kind, title: record?.title ?? "", description: record?.description ?? "", startDate: record?.startDate ?? today, durationDays: record?.durationDays ?? 30, status: record?.status ?? "active" });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><label>Título<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={kind === "experiment" ? "Ej. Mañanas sin móvil" : "Ej. 30 días caminando"} /></label><label>Qué quieres probar o conseguir<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Define una regla clara y observable…" /></label><div className="form-grid"><label>Fecha de inicio<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>Duración (días)<input type="number" min="1" max="365" value={form.durationDays} onChange={(event) => setForm({ ...form, durationDays: Number(event.target.value) })} /></label></div><label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Activo</option><option value="paused">Pausado</option><option value="completed">Completado</option></select></label><SubmitButton busy={busy} label={record ? "Guardar cambios" : `Crear ${kind === "experiment" ? "experimento" : "reto"}`} /></form>;
}

function ProgramLogForm({ program, record, today, busy, onSubmit }: { program: Program; record?: ProgramLog; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, programId: program.id, date: record?.date ?? today, completed: record?.completed ?? true, rating: record?.rating ?? 3, notes: record?.notes ?? "" });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><div className="program-context"><Rocket size={17} /><div><strong>{program.title}</strong><small>Registro diario</small></div></div><label>Fecha<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label className="toggle-label"><input type="checkbox" checked={form.completed} onChange={(event) => setForm({ ...form, completed: event.target.checked })} /> Cumplí la acción propuesta</label><RangeField label={`Resultado ${form.rating}/5`} min={1} max={5} value={Number(form.rating)} onChange={(value) => setForm({ ...form, rating: value })} /><label>Qué hiciste y cómo fue<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Describe qué ocurrió, qué notaste y qué cambiarías…" /></label><SubmitButton busy={busy} label="Guardar registro diario" /></form>;
}

function ProjectForm({ record, today, busy, onSubmit }: { record?: Project; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, title: record?.title ?? "", description: record?.description ?? "", area: record?.area ?? "Negocio", status: record?.status ?? "active", priority: record?.priority ?? "medium", startDate: record?.startDate ?? today, dueDate: record?.dueDate ?? "", color: record?.color ?? "lilac" });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><label>Nombre del proyecto<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Lanzamiento de un nuevo servicio" /></label><label>Objetivo y contexto<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Qué quieres conseguir, por qué importa y cómo sabrás que está terminado…" /></label><div className="form-grid"><label>Área<select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })}><option>Negocio</option><option>Personal</option><option>Aprendizaje</option><option>Salud</option><option>Finanzas</option><option>Hogar</option></select></label><label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label><label>Inicio<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>Fecha objetivo<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label><label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Activo</option><option value="paused">Pausado</option><option value="completed">Completado</option></select></label><label>Color<select value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })}><option value="lilac">Violeta</option><option value="mint">Verde</option><option value="sand">Arena</option><option value="rose">Rosa</option><option value="blue">Azul</option></select></label></div><SubmitButton busy={busy} label={record ? "Guardar cambios" : "Crear proyecto"} /></form>;
}

function ProjectTaskForm({ projects, goals, project, record, defaultDate, defaultSprintWeek, defaultItemType, busy, onSubmit }: { projects: Project[]; goals: PlanGoal[]; project?: Project; record?: ProjectTask; defaultDate?: string; defaultSprintWeek?: string; defaultItemType?: ProjectTask["itemType"]; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const initialDate = record?.scheduledDate ?? defaultDate ?? "";
  const [form, setForm] = useState({ id: record?.id, itemType: record?.itemType ?? defaultItemType ?? "task" as ProjectTask["itemType"], projectId: record?.projectId ?? project?.id ?? projects[0]?.id ?? "", goalId: record?.goalId ?? "", title: record?.title ?? "", description: record?.description ?? "", status: record?.status ?? "todo", priority: record?.priority ?? "medium", energy: record?.energy ?? "medium", estimatedMinutes: record?.estimatedMinutes ?? "", scheduledDate: initialDate, scheduledTime: record?.scheduledTime ?? "", endDate: record?.endDate ?? initialDate, sprintWeek: record?.sprintWeek ?? (initialDate ? startOfWeek(initialDate) : defaultSprintWeek ?? ""), dueDate: record?.dueDate ?? "" });
  function schedule(date: string) { setForm({ ...form, scheduledDate: date, endDate: !form.endDate || form.endDate < date ? date : form.endDate, sprintWeek: date ? startOfWeek(date) : form.sprintWeek }); }
  function selectGoal(goalId: string) { const selected = goals.find((goal) => goal.id === goalId); setForm({ ...form, goalId, projectId: selected?.projectId ?? form.projectId }); }
  const isTask = form.itemType === "task";
  const typeLabel = form.itemType === "event" ? "Evento" : form.itemType === "reminder" ? "Recordatorio" : "Tarea";
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, goalId: isTask ? form.goalId || null : null, scheduledTime: form.scheduledTime || null, endDate: form.endDate || form.scheduledDate, sprintWeek: form.scheduledDate ? startOfWeek(form.scheduledDate) : null, status: isTask ? form.status : "todo", estimatedMinutes: isTask ? form.estimatedMinutes : null }); }}>
    <div className="program-context"><CalendarDays size={17} /><div><strong>Planificar {typeLabel.toLocaleLowerCase("es")}</strong><small>{isTask ? "Una acción que suma a tu carga y puede impulsar un objetivo." : "Aparece en tu agenda sin convertirse en una tarea pendiente."}</small></div></div>
    <label>Tipo<select value={form.itemType} onChange={(event) => setForm({ ...form, itemType: event.target.value as ProjectTask["itemType"] })}><option value="task">Tarea · requiere acción</option><option value="reminder">Recordatorio · no cuenta como pendiente</option><option value="event">Evento · cita, bloque o compromiso</option></select></label>
    <label>{isTask ? "Tarea" : typeLabel}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={isTask ? "Define una acción concreta" : "Ej. Reunión con Benjamin"} /></label>
    <label>Detalle<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Información necesaria, ubicación o contexto…" /></label>
    <div className="form-grid">
      <label>Área / proyecto<select required={isTask} value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Sin proyecto</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.area} · {item.title}</option>)}</select></label>
      {isTask && <label>Objetivo que impulsa (opcional)<select value={form.goalId} onChange={(event) => selectGoal(event.target.value)}><option value="">Sin objetivo vinculado</option>{goals.filter((goal) => goal.status !== "done").map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>}
      {isTask && <><label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectTask["status"] })}><option value="todo">Por hacer</option><option value="doing">En curso</option><option value="done">Hecha</option></select></label><label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta · destacar en agenda</option></select></label><label>Energía necesaria<select value={form.energy} onChange={(event) => setForm({ ...form, energy: event.target.value as ProjectTask["energy"] })}><option value="low">⚡ Baja</option><option value="medium">⚡⚡ Media</option><option value="high">⚡⚡⚡ Alta</option></select></label><label>Tiempo estimado (min)<input required type="number" min="5" max="1440" step="5" value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: event.target.value })} placeholder="Ej. 45" /></label></>}
      <label>Empieza<input required={!isTask} type="date" value={form.scheduledDate} onChange={(event) => schedule(event.target.value)} /><small className="field-help">{isTask ? "Déjala vacía para Inbox." : "Fija cuándo debe aparecer en tu agenda."}</small></label><label>Hora fija<input type="time" value={form.scheduledTime} onChange={(event) => setForm({ ...form, scheduledTime: event.target.value })} /></label><label>Termina<input type="date" min={form.scheduledDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>{isTask && <label>Fecha límite<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>}
    </div><SubmitButton busy={busy} label={record ? "Guardar cambios" : `Crear ${typeLabel.toLocaleLowerCase("es")}`} />
  </form>;
}

function PlanGoalForm({ projects, goals, record, defaultScope, defaultPeriod, today, busy, onSubmit }: { projects: Project[]; goals: PlanGoal[]; record?: PlanGoal; defaultScope?: PlanGoal["scope"]; defaultPeriod?: string; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const initialScope = record?.scope ?? defaultScope ?? "month";
  const [form, setForm] = useState({ id: record?.id, title: record?.title ?? "", description: record?.description ?? "", scope: initialScope, period: record?.period ?? defaultPeriod ?? (initialScope === "year" ? today.slice(0, 4) : initialScope === "month" ? today.slice(0, 7) : initialScope === "week" ? startOfWeek(today) : quarterKey(today.slice(0, 7))), projectId: record?.projectId ?? "", parentGoalId: record?.parentGoalId ?? "", priority: record?.priority ?? "medium", status: record?.status ?? "todo", targetDate: record?.targetDate ?? "" });
  function changeScope(scope: PlanGoal["scope"]) {
    setForm({ ...form, scope, period: scope === "year" ? today.slice(0, 4) : scope === "semester" ? `${today.slice(0, 4)}-S${Number(today.slice(5, 7)) <= 6 ? 1 : 2}` : scope === "quarter" ? quarterKey(today.slice(0, 7)) : scope === "week" ? startOfWeek(today) : today.slice(0, 7) });
  }
  const periodInput = form.scope === "week" ? <label>Semana del<input required type="date" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} /><small className="field-help">Se guarda como lunes de esa semana.</small></label> : form.scope === "month" ? <label>Mes<input required type="month" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} /></label> : <label>Periodo<input value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} placeholder="2026, 2026-S2 o 2026-Q3" /></label>;
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, period: form.scope === "week" ? startOfWeek(form.period) : form.period }); }}>
    <label>Objetivo<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Consolidar una actividad profesional propia" /></label>
    <label>Resultado esperado<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe qué tiene que estar conseguido al terminar el periodo…" /></label>
    <div className="form-grid">
      <label>Horizonte<select value={form.scope} onChange={(event) => changeScope(event.target.value as PlanGoal["scope"])}><option value="year">Objetivo anual</option><option value="semester">Objetivo semestral</option><option value="quarter">Objetivo trimestral</option><option value="month">Objetivo mensual</option><option value="week">Objetivo semanal</option></select></label>
      {periodInput}
      <label>Se desglosa desde<select value={form.parentGoalId} onChange={(event) => setForm({ ...form, parentGoalId: event.target.value })}><option value="">Sin objetivo superior</option>{goals.filter((goal) => goal.id !== record?.id).map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
      <label>Proyecto relacionado<select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Objetivo general</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
      <label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label>
      <label>Fecha límite<input type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></label>
    </div><small className="field-help">Conecta cada objetivo con el horizonte superior. El avance se calcula desde las acciones vinculadas.</small><SubmitButton busy={busy} label={record ? "Guardar cambios" : "Crear objetivo"} />
  </form>;
}

function PlanTaskForm({ goal, goals, projects, record, defaultPeriod, today, busy, onSubmit }: { goal?: PlanGoal; goals: PlanGoal[]; projects: Project[]; record?: PlanTask; defaultPeriod?: string; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, goalId: record?.goalId ?? goal?.id ?? "", projectId: record?.projectId ?? goal?.projectId ?? "", title: record?.title ?? "", period: record?.period ?? defaultPeriod ?? today.slice(0, 7), priority: record?.priority ?? "medium", status: record?.status ?? "todo", dueDate: record?.dueDate ?? "" });
  function changeGoal(goalId: string) {
    const selectedGoal = goals.find((item) => item.id === goalId);
    setForm({ ...form, goalId, projectId: selectedGoal?.projectId ?? form.projectId, period: selectedGoal?.scope === "month" ? selectedGoal.period : form.period });
  }
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
    <div className="program-context">{form.goalId ? <Target size={17} /> : <ListTodo size={17} />}<div><strong>{goals.find((item) => item.id === form.goalId)?.title ?? "Tarea independiente"}</strong><small>{form.goalId ? "Vinculada a un objetivo" : "Acción concreta del periodo"}</small></div></div>
    <label>Acción concreta<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Revisar y aprobar los textos de la home" /></label>
    <div className="form-grid">
      {!goal && <label>Objetivo (opcional)<select value={form.goalId} onChange={(event) => changeGoal(event.target.value)}><option value="">Tarea independiente</option>{goals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
      <label>Mes del plan<input required type="month" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} /></label>
      <label>Proyecto relacionado<select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Sin proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
      <label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label>
      <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PlanTask["status"] })}><option value="todo">Por hacer</option><option value="doing">En curso</option><option value="done">Hecha</option></select></label>
      <label>Fecha límite<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
    </div>
    <SubmitButton busy={busy} label={record ? "Guardar cambios" : "Crear tarea"} />
  </form>;
}

function NoteForm({ projects, projectId, sprintWeek, record, busy, onSubmit }: { projects: Project[]; projectId?: string; sprintWeek?: string; record?: NoteItem; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, projectId: record?.projectId ?? projectId ?? "", title: record?.title ?? "", content: record?.content ?? "", category: record?.category ?? (sprintWeek ? "Semana" : "Idea"), pinned: record?.pinned ?? false, sprintWeek: record?.sprintWeek ?? sprintWeek ?? "" });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><label>Título<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Decisiones sobre el modelo de negocio" /></label><label>Contenido<textarea className="large-textarea" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Ideas, decisiones, aprendizajes, enlaces o información que quieras conservar…" /></label><div className="form-grid"><label>Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Idea</option><option>Reunión</option><option>Decisión</option><option>Aprendizaje</option><option>Investigación</option><option>Referencia</option></select></label><label>Proyecto<select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Nota general</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label></div><label className="toggle-label"><input type="checkbox" checked={form.pinned} onChange={(event) => setForm({ ...form, pinned: event.target.checked })} /> Fijar esta nota</label><SubmitButton busy={busy} label={record ? "Guardar cambios" : "Crear nota"} /></form>;
}

function BucketItemForm({ record, busy, onSubmit }: { record?: BucketItem; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, title: record?.title ?? "", description: record?.description ?? "", category: record?.category ?? "Experiencia", status: record?.status ?? "pending", targetDate: record?.targetDate ?? "", location: record?.location ?? "", completedAt: record?.completedAt ?? "" });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}><label>¿Qué quieres vivir o conseguir?<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Ver una aurora boreal" /></label><label>Por qué importa<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe la experiencia para que tu yo futuro recuerde por qué la añadió…" /></label><div className="form-grid"><label>Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Viajes</option><option>Experiencia</option><option>Naturaleza</option><option>Deporte</option><option>Crecimiento</option><option>Vida</option><option>Salud</option><option>Relaciones</option><option>Negocios</option><option>Otros</option></select></label><label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BucketItem["status"] })}><option value="pending">Pendiente</option><option value="inProgress">En progreso</option><option value="completed">Cumplido</option></select></label><label>Lugar<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="País, ciudad o lugar" /></label><label>Fecha objetivo<input type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></label></div>{form.status === "completed" && <label>Fecha en que lo cumpliste<input type="date" value={form.completedAt} onChange={(event) => setForm({ ...form, completedAt: event.target.value })} /></label>}<SubmitButton busy={busy} label={record ? "Guardar cambios" : "Añadir a mi bucket list"} /></form>;
}

function GratitudeForm({ record, today, busy, onSubmit }: { record?: Gratitude; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ id: record?.id, date: record?.date ?? today, text: record?.text ?? "", person: record?.person ?? "", why: record?.why ?? "", shared: record?.shared ?? false });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
    <label>¿Qué agradeces hoy?<textarea required value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} placeholder="Ej. La conversación tranquila que tuve con mi hermano" /></label>
    <div className="form-grid"><label>Fecha<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Persona relacionada<input value={form.person} onChange={(event) => setForm({ ...form, person: event.target.value })} placeholder="Opcional" /></label></div>
    <label>¿Por qué fue importante?<textarea value={form.why} onChange={(event) => setForm({ ...form, why: event.target.value })} placeholder="Qué te hizo sentir, aprender o valorar…" /></label>
    <label className="toggle-label"><input type="checkbox" checked={form.shared} onChange={(event) => setForm({ ...form, shared: event.target.checked })} /> Ya se lo hice saber o tuve un gesto de agradecimiento</label>
    <SubmitButton busy={busy} label={record ? "Guardar cambios" : "Guardar agradecimiento"} />
  </form>;
}

function MindNodeForm({ nodes, projects, record, parentId, busy, onSubmit }: { nodes: MindNode[]; projects: Project[]; record?: MindNode; parentId?: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const parent = nodes.find((item) => item.id === (record?.parentId ?? parentId));
  const siblingCount = nodes.filter((item) => item.parentId === (record?.parentId ?? parentId)).length;
  const suggestedX = parent ? Math.max(90, Math.min(910, parent.x + (siblingCount % 2 ? -1 : 1) * (145 + (siblingCount % 3) * 28))) : 500;
  const suggestedY = parent ? Math.max(75, Math.min(545, parent.y + (siblingCount % 3 - 1) * 120)) : 300;
  const [form, setForm] = useState({ id: record?.id, label: record?.label ?? "", detail: record?.detail ?? "", area: record?.area ?? parent?.area ?? "Personal", parentId: record?.parentId ?? parentId ?? "", color: record?.color ?? parent?.color ?? "lilac", projectId: record?.projectId ?? "", x: record?.x ?? suggestedX, y: record?.y ?? suggestedY });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
    {parent && <div className="program-context"><Network size={17} /><div><strong>Conectado con {parent.label}</strong><small>Puedes cambiar el nodo principal debajo</small></div></div>}
    <label>Nombre del nodo<input required value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Ej. Mejorar mi descanso" /></label>
    <label>Qué representa<textarea value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} placeholder="Describe por qué forma parte de tu vida actual…" /></label>
    <div className="form-grid"><label>Área<input value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} placeholder="Salud, relaciones…" /></label><label>Color<select value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })}><option value="lilac">Violeta</option><option value="mint">Verde</option><option value="sand">Arena</option><option value="rose">Rosa</option><option value="blue">Azul</option></select></label><label>Conectar con<select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}><option value="">Nodo principal</option>{nodes.filter((item) => item.id !== record?.id).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Proyecto vinculado<select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Sin proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></div>
    <SubmitButton busy={busy} label={record ? "Guardar cambios" : "Añadir al mapa"} />
  </form>;
}

function ActiveProgram({ data, today, onOpen, onNavigate }: { data: LifeData; today: string; onOpen: (modal: Modal) => void; onNavigate: (view: View) => void }) {
  const program = data.programs.find((item) => item.status === "active");
  if (!program) return <section className="experiment-card"><div className="experiment-top"><span><Rocket size={14} /> LABORATORIO</span></div><h3>Prueba algo nuevo</h3><p>Crea un experimento o reto y registra cómo evoluciona.</p><button className="outline-button" onClick={() => onNavigate("programs")}><Plus size={15} /> Crear el primero</button></section>;
  const logs = data.programLogs.filter((log) => log.programId === program.id && log.completed);
  const todayLog = data.programLogs.find((log) => log.programId === program.id && log.date === today);
  return <section className="experiment-card"><div className="experiment-top"><span><Rocket size={14} /> {program.kind === "experiment" ? "EXPERIMENTO ACTIVO" : "RETO ACTIVO"}</span><button onClick={() => onNavigate("programs")}><MoreHorizontal size={17} /></button></div><h3>{program.title}</h3><p>{program.description}</p><div className="experiment-progress"><div className="days-orbit"><strong>{logs.length}</strong><span>de {program.durationDays} días</span></div><div><strong>{Math.round(logs.length / program.durationDays * 100)}% completado</strong><div className="mini-track"><span style={{ width: `${Math.min(100, logs.length / program.durationDays * 100)}%` }} /></div><button className="text-button" onClick={() => onOpen({ kind: "programLog", program, record: todayLog })}>{todayLog ? "Editar registro de hoy" : "Registrar cómo fue hoy"}</button></div></div></section>;
}

function LoadingState() { return <div className="page-content"><div className="loading-card"><span className="loading-orbit"><Sparkles size={22} /></span><strong>Preparando tu LifeOS…</strong><small>Recuperando los datos de este navegador</small></div></div>; }
function EmptyState({ text, action, onClick }: { text: string; action?: string; onClick?: () => void }) { return <div className="empty-state"><Sparkles size={19} /><p>{text}</p>{action && onClick && <button onClick={onClick}>{action} <ArrowRight size={14} /></button>}</div>; }
function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) { return <article className="metric-card"><span className={`metric-symbol ${color}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong><span className="positive">Actualizado</span></div></article>; }
function MetricCard({ icon, label, value, note, color }: { icon: React.ReactNode; label: string; value: string; note: string; color: string }) { return <article className="metric-card"><span className={`metric-symbol ${color}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong><span className="positive">{note}</span></div></article>; }
function RangeField({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (value: number) => void }) { return <label className="range-field">{label}<input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span><small>{min}</small><small>{max}</small></span></label>; }
function SubmitButton({ busy, label }: { busy: boolean; label: string }) { return <button className="primary-button form-submit" type="submit" disabled={busy}>{busy ? "Guardando…" : <><Save size={16} /> {label}</>}</button>; }

function modalTitle(modal: Exclude<Modal, null>) {
  if (modal.kind === "quick") return "¿Qué quieres registrar?";
  if (modal.kind === "quickFocus") return "Registrar tiempo";
  if (modal.kind === "habit") return modal.record ? "Editar hábito" : "Nuevo hábito";
  if (modal.kind === "metric") return modal.record ? "Editar métricas" : "Métricas del día";
  if (modal.kind === "bullet") return modal.record ? "Editar elemento" : "Añadir al bullet list";
  if (modal.kind === "program") return modal.record ? "Editar" : `Nuevo ${modal.programKind === "challenge" ? "reto" : "experimento"}`;
  if (modal.kind === "project") return modal.record ? "Editar proyecto" : "Nuevo proyecto";
  if (modal.kind === "projectTask") return modal.record ? "Editar tarea" : "Nueva tarea";
  if (modal.kind === "planGoal") return modal.record ? "Editar objetivo" : "Nuevo objetivo";
  if (modal.kind === "planTask") return modal.record ? "Editar tarea del plan" : "Nueva tarea del plan";
  if (modal.kind === "note") return modal.record ? "Editar nota" : "Nueva nota";
  if (modal.kind === "bucketItem") return modal.record ? "Editar sueño" : "Añadir a mi bucket list";
  if (modal.kind === "gratitude") return modal.record ? "Editar agradecimiento" : "Nuevo agradecimiento";
  if (modal.kind === "mindNode") return modal.record ? "Editar nodo" : "Añadir al mapa vital";
  return "¿Cómo fue hoy?";
}

function QuickFocusForm({ data, today, busy, onSubmit }: { data: LifeData; today: string; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const categories = focusCategoryNames(data.focusSessions);
  const [form, setForm] = useState({ date: today, task: "", minutes: "45", category: categories[0] ?? "Trabajo profundo", projectId: "" });
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, startedAt: `${form.date}T12:00:00.000Z`, completed: true, source: "manual" }); }}><label>Actividad<input required value={form.task} onChange={(event) => setForm({ ...form, task: event.target.value })} placeholder="Ej. Preparar propuesta" /></label><div className="form-grid"><label>Fecha<input required type="date" max={today} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Minutos<input required type="number" min="1" max="1440" step="1" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: event.target.value })} /></label><CategoryPicker value={form.category} categories={categories} required onChange={(category) => setForm({ ...form, category })} /><label>Proyecto<select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Sin proyecto</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></div><SubmitButton busy={busy} label="Guardar tiempo" /></form>;
}

function CategoryPicker({ value, categories, onChange, disabled, required }: { value: string; categories: string[]; onChange: (value: string) => void; disabled?: boolean; required?: boolean }) {
  const canonical = categories.find((item) => item.toLocaleLowerCase("es") === value.trim().toLocaleLowerCase("es"));
  const creating = !canonical;
  return <label>Categoría<select disabled={disabled} value={creating ? "__new__" : canonical} onChange={(event) => onChange(event.target.value === "__new__" ? "" : event.target.value)}>{categories.map((name) => <option key={name} value={name}>{name}</option>)}<option value="__new__">＋ Crear nueva categoría</option></select>{creating && <input disabled={disabled} required={required} autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Nombre de la nueva categoría" />}<small className="field-help">Reutiliza una categoría o elige “Crear nueva”.</small></label>;
}

function parseStoredData(raw: string): LifeData {
  const parsed = JSON.parse(raw) as Partial<LifeData>;
  return {
    habits: Array.isArray(parsed.habits) ? parsed.habits : starterData.habits,
    habitLogs: Array.isArray(parsed.habitLogs) ? parsed.habitLogs : [],
    metrics: Array.isArray(parsed.metrics) ? parsed.metrics.map(normalizeMetric).sort((a, b) => b.date.localeCompare(a.date)) : [],
    journals: Array.isArray(parsed.journals) ? parsed.journals : [],
    bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
    programs: Array.isArray(parsed.programs) ? parsed.programs : [],
    programLogs: Array.isArray(parsed.programLogs) ? parsed.programLogs : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    projectTasks: Array.isArray(parsed.projectTasks) ? parsed.projectTasks.map(normalizeProjectTask) : [],
    planGoals: Array.isArray(parsed.planGoals) ? parsed.planGoals : [],
    planTasks: Array.isArray(parsed.planTasks) ? parsed.planTasks : [],
    focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions.map((session) => ({ ...session, category: normalizeFocusCategory(session.category), minutes: Math.max(1, Math.round(Number(session.minutes) || 1)) })) : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    bucketItems: Array.isArray(parsed.bucketItems) ? parsed.bucketItems : [],
    gratitudes: Array.isArray(parsed.gratitudes) ? parsed.gratitudes : [],
    mindNodes: Array.isArray(parsed.mindNodes) && parsed.mindNodes.length ? parsed.mindNodes : mindMapSeed,
  };
}

function normalizeMetric(metric: Metric | (Partial<Metric> & { id: string; date: string })) : Metric {
  const { waterLiters: _removedWaterMetric, ...rest } = metric as Metric & { waterLiters?: unknown };
  return { ...rest, weight: nullableNumber(rest.weight), mood: nullableNumber(rest.mood), energy: nullableNumber(rest.energy), sleepHours: nullableNumber(rest.sleepHours), sleepQuality: nullableNumber(rest.sleepQuality), stress: nullableNumber(rest.stress), exerciseMinutes: nullableNumber(rest.exerciseMinutes), activeCalories: nullableNumber(rest.activeCalories), screenTimeHours: nullableNumber(rest.screenTimeHours), notes: typeof rest.notes === "string" ? rest.notes : "" } as Metric;
}

function localId(payload: Record<string, unknown>) {
  if (typeof payload.id === "string" && payload.id) return payload.id;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `lifeos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function upsertLocal<T extends { id: string }>(items: T[], record: T, sameRecord?: (item: T) => boolean) {
  const index = items.findIndex((item) => item.id === record.id || sameRecord?.(item));
  if (index < 0) return [record, ...items];
  return items.map((item, itemIndex) => itemIndex === index ? record : item);
}

function saveLocalRecord(current: LifeData, resource: Resource, payload: Record<string, unknown>): LifeData {
  const id = localId(payload);
  if (resource === "habit") {
    const existing = current.habits.find((habit) => habit.id === id);
    const record = { ...payload, id, createdAt: payload.createdAt || existing?.createdAt || argentinaDateKey(new Date()) } as unknown as Habit;
    return { ...current, habits: upsertLocal(current.habits, record) };
  }
  if (resource === "habitLog") {
    const record = { ...payload, id } as unknown as HabitLog;
    return { ...current, habitLogs: upsertLocal(current.habitLogs, record, (item) => item.habitId === record.habitId && item.date === record.date) };
  }
  if (resource === "metric") {
    const numericFields = ["weight", "mood", "energy", "sleepHours", "sleepQuality", "stress", "exerciseMinutes", "activeCalories", "screenTimeHours"] as const;
    const normalized = { ...payload };
    numericFields.forEach((field) => { normalized[field] = nullableNumber(payload[field]); });
    delete normalized.waterLiters;
    const record = normalizeMetric({ ...normalized, id } as unknown as Metric);
    return { ...current, metrics: upsertLocal(current.metrics, record, (item) => item.date === record.date).sort((a, b) => b.date.localeCompare(a.date)) };
  }
  if (resource === "journal") {
    const record = { ...payload, id } as unknown as Journal;
    return { ...current, journals: upsertLocal(current.journals, record, (item) => item.date === record.date).sort((a, b) => b.date.localeCompare(a.date)) };
  }
  if (resource === "bullet") {
    const record = { ...payload, id } as unknown as BulletItem;
    return { ...current, bullets: upsertLocal(current.bullets, record) };
  }
  if (resource === "program") {
    const record = { ...payload, id } as unknown as Program;
    return { ...current, programs: upsertLocal(current.programs, record) };
  }
  if (resource === "programLog") {
    const record = { ...payload, id } as unknown as ProgramLog;
    return { ...current, programLogs: upsertLocal(current.programLogs, record, (item) => item.programId === record.programId && item.date === record.date) };
  }
  if (resource === "project") {
    const record = { ...payload, id } as unknown as Project;
    return { ...current, projects: upsertLocal(current.projects, record) };
  }
  if (resource === "projectTask") {
    const scheduledDate = typeof payload.scheduledDate === "string" && payload.scheduledDate ? payload.scheduledDate : null;
    const itemType = payload.itemType === "event" || payload.itemType === "reminder" ? payload.itemType : "task";
    const status = itemType === "task" && payload.status === "done" ? "done" : itemType === "task" && payload.status === "doing" ? "doing" : "todo";
    const record = normalizeProjectTask({ ...payload, id, itemType, status, scheduledDate, endDate: payload.endDate || scheduledDate, sprintWeek: scheduledDate ? startOfWeek(scheduledDate) : payload.sprintWeek || null, dueDate: itemType === "task" ? payload.dueDate || null : null, goalId: itemType === "task" ? payload.goalId || null : null, scheduledTime: payload.scheduledTime || null, completedAt: status === "done" ? payload.completedAt || argentinaDateKey(new Date()) : null, estimatedMinutes: itemType === "task" ? nullableNumber(payload.estimatedMinutes) : null } as unknown as ProjectTask);
    return { ...current, projectTasks: upsertLocal(current.projectTasks, record) };
  }
  if (resource === "planGoal") {
    const record = { ...payload, id, projectId: payload.projectId || null, parentGoalId: payload.parentGoalId || null, targetDate: payload.targetDate || null } as unknown as PlanGoal;
    return { ...current, planGoals: upsertLocal(current.planGoals, record) };
  }
  if (resource === "planTask") {
    const record = { ...payload, id, goalId: payload.goalId || null, projectId: payload.projectId || null, period: payload.period || (typeof payload.dueDate === "string" ? payload.dueDate.slice(0, 7) : argentinaDateKey(new Date()).slice(0, 7)), priority: payload.priority || "medium", dueDate: payload.dueDate || null } as unknown as PlanTask;
    return { ...current, planTasks: upsertLocal(current.planTasks, record) };
  }
  if (resource === "focusSession") {
    const categories = focusCategoryNames(current.focusSessions);
    const requestedCategory = normalizeFocusCategory(String(payload.category ?? ""));
    const category = categories.find((item) => item.toLocaleLowerCase("es") === requestedCategory.toLocaleLowerCase("es")) ?? requestedCategory;
    const record = { ...payload, id, category, projectId: payload.projectId || null, minutes: Math.max(1, Math.round(Number(payload.minutes) || 1)) } as unknown as FocusSession;
    return { ...current, focusSessions: upsertLocal(current.focusSessions, record).sort((a, b) => b.startedAt.localeCompare(a.startedAt)) };
  }
  if (resource === "note") {
    const record = { ...payload, id, projectId: payload.projectId || null, sprintWeek: payload.sprintWeek || null } as unknown as NoteItem;
    return { ...current, notes: upsertLocal(current.notes, record) };
  }
  if (resource === "gratitude") {
    const record = { ...payload, id } as unknown as Gratitude;
    return { ...current, gratitudes: upsertLocal(current.gratitudes, record).sort((a, b) => b.date.localeCompare(a.date)) };
  }
  if (resource === "mindNode") {
    const siblings = current.mindNodes.filter((item) => item.parentId === (payload.parentId || null));
    const record = { ...payload, id, parentId: payload.parentId || null, projectId: payload.projectId || null, x: Number(payload.x) || 500 + (siblings.length % 3 - 1) * 170, y: Number(payload.y) || 300 + Math.floor(siblings.length / 3) * 105 } as unknown as MindNode;
    return { ...current, mindNodes: upsertLocal(current.mindNodes, record) };
  }
  const record = { ...payload, id, targetDate: payload.targetDate || null, completedAt: payload.completedAt || null } as unknown as BucketItem;
  return { ...current, bucketItems: upsertLocal(current.bucketItems, record) };
}

function removeLocalRecord(current: LifeData, resource: Resource, id: string): LifeData {
  if (resource === "habit") return { ...current, habits: current.habits.filter((item) => item.id !== id), habitLogs: current.habitLogs.filter((item) => item.habitId !== id) };
  if (resource === "metric") return { ...current, metrics: current.metrics.filter((item) => item.id !== id) };
  if (resource === "journal") return { ...current, journals: current.journals.filter((item) => item.id !== id) };
  if (resource === "bullet") return { ...current, bullets: current.bullets.filter((item) => item.id !== id) };
  if (resource === "program") return { ...current, programs: current.programs.filter((item) => item.id !== id), programLogs: current.programLogs.filter((item) => item.programId !== id) };
  if (resource === "project") return {
    ...current,
    projects: current.projects.filter((item) => item.id !== id),
    projectTasks: current.projectTasks.filter((item) => item.projectId !== id),
    planGoals: current.planGoals.map((item) => item.projectId === id ? { ...item, projectId: null } : item),
    planTasks: current.planTasks.map((item) => item.projectId === id ? { ...item, projectId: null } : item),
    focusSessions: current.focusSessions.map((item) => item.projectId === id ? { ...item, projectId: null } : item),
    notes: current.notes.filter((item) => item.projectId !== id),
  };
  if (resource === "projectTask") return { ...current, projectTasks: current.projectTasks.filter((item) => item.id !== id) };
  if (resource === "planGoal") return { ...current, planGoals: current.planGoals.filter((item) => item.id !== id), planTasks: current.planTasks.filter((item) => item.goalId !== id) };
  if (resource === "planTask") return { ...current, planTasks: current.planTasks.filter((item) => item.id !== id) };
  if (resource === "focusSession") return { ...current, focusSessions: current.focusSessions.filter((item) => item.id !== id) };
  if (resource === "note") return { ...current, notes: current.notes.filter((item) => item.id !== id) };
  if (resource === "bucketItem") return { ...current, bucketItems: current.bucketItems.filter((item) => item.id !== id) };
  if (resource === "gratitude") return { ...current, gratitudes: current.gratitudes.filter((item) => item.id !== id) };
  if (resource === "mindNode") return { ...current, mindNodes: current.mindNodes.filter((item) => item.id !== id && item.parentId !== id) };
  return current;
}

function prefersDesktopMaster() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 900px) and (pointer: fine)").matches;
}

function mergeRecords<T extends { id: string }>(cloud: T[], local: T[], preferLocal = false) {
  const primary = preferLocal ? local : cloud;
  const secondary = preferLocal ? cloud : local;
  const primaryIds = new Set(primary.map((item) => item.id));
  return [...primary, ...secondary.filter((item) => !primaryIds.has(item.id))];
}

function mergeLifeData(cloud: LifeData, local: LifeData, preferLocal = false): LifeData {
  return {
    habits: mergeRecords(cloud.habits, local.habits, preferLocal),
    habitLogs: mergeRecords(cloud.habitLogs, local.habitLogs, preferLocal),
    metrics: mergeRecords(cloud.metrics, local.metrics, preferLocal),
    journals: mergeRecords(cloud.journals, local.journals, preferLocal),
    bullets: mergeRecords(cloud.bullets, local.bullets, preferLocal),
    programs: mergeRecords(cloud.programs, local.programs, preferLocal),
    programLogs: mergeRecords(cloud.programLogs, local.programLogs, preferLocal),
    projects: mergeRecords(cloud.projects, local.projects, preferLocal),
    projectTasks: mergeRecords(cloud.projectTasks, local.projectTasks, preferLocal),
    planGoals: mergeRecords(cloud.planGoals, local.planGoals, preferLocal),
    planTasks: mergeRecords(cloud.planTasks, local.planTasks, preferLocal),
    focusSessions: mergeRecords(cloud.focusSessions, local.focusSessions, preferLocal),
    notes: mergeRecords(cloud.notes, local.notes, preferLocal),
    bucketItems: mergeRecords(cloud.bucketItems, local.bucketItems, preferLocal),
    gratitudes: mergeRecords(cloud.gratitudes, local.gratitudes, preferLocal),
    mindNodes: mergeRecords(cloud.mindNodes, local.mindNodes, preferLocal),
  };
}

function hasPersonalData(data: LifeData) {
  return [data.habitLogs, data.metrics, data.journals, data.bullets, data.programs, data.projects, data.planGoals, data.planTasks, data.focusSessions, data.notes, data.bucketItems, data.gratitudes].some((items) => items.length > 0);
}

function normalizeFocusCategory(value: string) {
  const clean = String(value ?? "").trim().replace(/\s+/g, " ");
  if (clean.toLocaleLowerCase("es") === "desa") return "Desarrollo";
  return clean || "Trabajo profundo";
}

function normalizeProjectTask(task: ProjectTask): ProjectTask {
  const scheduledDate = task.scheduledDate || null;
  const endDate = task.endDate && scheduledDate && task.endDate >= scheduledDate ? task.endDate : scheduledDate;
  const itemType = task.itemType === "event" || task.itemType === "reminder" ? task.itemType : "task";
  return {
    ...task,
    itemType,
    priority: task.priority || "medium",
    energy: task.energy === "low" || task.energy === "high" ? task.energy : "medium",
    status: itemType === "task" ? task.status === "done" ? "done" : task.status === "doing" ? "doing" : "todo" : "todo",
    estimatedMinutes: itemType !== "task" || task.estimatedMinutes == null || !Number.isFinite(Number(task.estimatedMinutes)) ? null : Math.max(5, Math.round(Number(task.estimatedMinutes))),
    scheduledDate,
    endDate,
    sprintWeek: scheduledDate ? startOfWeek(scheduledDate) : task.sprintWeek || null,
    dueDate: itemType === "task" ? task.dueDate || null : null,
    goalId: itemType === "task" ? task.goalId || null : null,
    scheduledTime: /^\d{2}:\d{2}$/.test(task.scheduledTime || "") ? task.scheduledTime : null,
    completedAt: task.completedAt || null,
  };
}

function taskEndDate(task: ProjectTask) { return task.endDate && task.scheduledDate && task.endDate >= task.scheduledDate ? task.endDate : task.scheduledDate || ""; }
function isAction(task: ProjectTask) { return !task.itemType || task.itemType === "task"; }
function itemTypeLabel(task: ProjectTask) { return task.itemType === "event" ? "Evento" : task.itemType === "reminder" ? "Recordatorio" : "Tarea"; }
function taskOccursOnDate(task: ProjectTask, date: string) { return !!task.scheduledDate && task.scheduledDate <= date && taskEndDate(task) >= date; }
function taskDurationDays(task: ProjectTask) { return task.scheduledDate ? Math.max(1, Math.round((new Date(`${taskEndDate(task)}T12:00:00Z`).getTime() - new Date(`${task.scheduledDate}T12:00:00Z`).getTime()) / 86400000) + 1) : 1; }
function taskMinutesOnDate(task: ProjectTask, date: string) { return taskOccursOnDate(task, date) ? Math.round((task.estimatedMinutes ?? 0) / taskDurationDays(task)) : 0; }
function taskMinutesInRange(task: ProjectTask, start: string, end: string) { return Array.from({ length: Math.max(0, Math.round((new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 86400000) + 1) }, (_, index) => addDays(start, index)).reduce((total, date) => total + taskMinutesOnDate(task, date), 0); }
function sprintTaskLanes(tasks: ProjectTask[], weekStart: string, weekEnd: string) {
  const laneEnds: number[] = [];
  return [...tasks].sort((a, b) => a.scheduledDate!.localeCompare(b.scheduledDate!) || compareProjectTasks(a, b)).map((task) => {
    const start = Math.max(1, Math.round((new Date(`${task.scheduledDate!}T12:00:00Z`).getTime() - new Date(`${weekStart}T12:00:00Z`).getTime()) / 86400000) + 1);
    const end = Math.min(7, Math.round((new Date(`${taskEndDate(task)}T12:00:00Z`).getTime() - new Date(`${weekStart}T12:00:00Z`).getTime()) / 86400000) + 1);
    let lane = laneEnds.findIndex((lastEnd) => lastEnd < start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = end;
    return { task, start, end, lane };
  });
}

function compareProjectTasks(a: ProjectTask, b: ProjectTask) {
  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const energyRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) || (energyRank[a.energy] ?? 1) - (energyRank[b.energy] ?? 1) || a.title.localeCompare(b.title, "es");
}

function focusCategoryNames(sessions: FocusSession[]) {
  const defaults = ["Trabajo profundo", "Gestión", "Reuniones", "Aprendizaje", "Administración", "Creatividad"];
  const labels = new Map<string, string>();
  [...defaults, ...sessions.map((session) => normalizeFocusCategory(session.category))].forEach((name) => {
    const clean = normalizeFocusCategory(name);
    const key = clean.toLocaleLowerCase("es");
    if (!labels.has(key)) labels.set(key, clean);
  });
  return Array.from(labels.values());
}

function goalCompletion(goal: PlanGoal, tasks: PlanTask[], projectTasks: ProjectTask[] = []) {
  const linked = [...tasks.filter((task) => task.goalId === goal.id), ...projectTasks.filter((task) => isAction(task) && task.goalId === goal.id)];
  if (!linked.length) return { complete: goal.status === "done", progress: null as number | null };
  const done = linked.filter((task) => task.status === "done").length;
  return { complete: done === linked.length, progress: Math.round(done / linked.length * 100) };
}

function streakStats(dateValues: string[], today: string) {
  const dates = Array.from(new Set(dateValues.filter(Boolean))).sort();
  if (!dates.length) return { current: 0, best: 0 };
  let best = 1;
  let run = 1;
  for (let index = 1; index < dates.length; index += 1) {
    if (dates[index] === addDays(dates[index - 1], 1)) run += 1;
    else run = 1;
    best = Math.max(best, run);
  }
  const set = new Set(dates);
  let anchor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(anchor)) { current += 1; anchor = addDays(anchor, -1); }
  return { current, best };
}

function average(values: Array<number | null | undefined>) {
  const present = values.filter((value): value is number => value != null && Number.isFinite(value));
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : null;
}

function buildMetricInsights(data: LifeData) {
  const metrics = [...data.metrics].sort((a, b) => b.date.localeCompare(a.date));
  const completeMetrics = metrics.filter((metric) => metric.sleepHours != null || metric.sleepQuality != null || metric.exerciseMinutes != null || metric.activeCalories != null || metric.screenTimeHours != null);
  const recentWeek = completeMetrics.slice(0, 7);
  const previousWeek = completeMetrics.slice(7, 14);
  const metricAverage = (items: Metric[], field: keyof Metric) => average(items.map((metric) => {
    const value = metric[field];
    return typeof value === "number" ? value : null;
  }));
  const weekAverage = (field: keyof Metric) => metricAverage(recentWeek, field);
  const previousWeekAverage = (field: keyof Metric) => metricAverage(previousWeek, field);
  const baseline = (field: keyof Metric) => metricAverage(completeMetrics, field);
  const latestDate = recentWeek[0]?.date;
  const screenCoverage = completeMetrics.filter((metric) => metric.screenTimeHours != null);
  const recoveryDays = completeMetrics.filter((metric) => (metric.sleepHours ?? 0) >= 7 && (metric.sleepQuality ?? 0) >= 80);
  const bestActiveDay = completeMetrics.filter((metric) => metric.activeCalories != null).sort((a, b) => (b.activeCalories ?? 0) - (a.activeCalories ?? 0))[0];
  const weekSleep = weekAverage("sleepHours");
  const weekQuality = weekAverage("sleepQuality");
  const weekCalories = weekAverage("activeCalories");
  const weekExercise = weekAverage("exerciseMinutes");
  const weekScreen = weekAverage("screenTimeHours");
  const previousCalories = previousWeekAverage("activeCalories");
  const previousScreen = previousWeekAverage("screenTimeHours");
  const qualityBaseline = baseline("sleepQuality");
  const sleepBaseline = baseline("sleepHours");
  const caloriesBaseline = baseline("activeCalories");
  const recoveryRate = completeMetrics.length ? Math.round(recoveryDays.length / completeMetrics.length * 100) : null;
  const screenChange = weekScreen != null && previousScreen != null ? weekScreen - previousScreen : null;
  const calorieChange = weekCalories != null && previousCalories != null ? weekCalories - previousCalories : null;

  return [
    {
      title: "Tu semana en una mirada",
      color: "lilac",
      icon: <CalendarDays size={16} />,
      text: recentWeek.length >= 5
        ? `En los últimos ${recentWeek.length} días dormiste ${formatDecimal(weekSleep)} h de media, con ${formatNumber(weekQuality)}% de calidad, ${formatNumber(weekCalories)} kcal activas y ${formatNumber(weekExercise)} min de ejercicio al día.`
        : "Registra al menos 5 días para recibir un resumen semanal completo.",
      sample: latestDate ? `Semana terminada el ${formatShortDate(latestDate)}` : "Sin datos todavía",
    },
    {
      title: "Cambio frente a la semana anterior",
      color: "rose",
      icon: <TrendingUp size={16} />,
      text: screenChange != null && calorieChange != null
        ? `Tu pantalla cambió ${formatSigned(screenChange)} h/día y tus calorías activas ${formatSigned(calorieChange)} kcal/día frente a los 7 días previos. Úsalo como señal para ajustar tu próximo bloque semanal.`
        : "Cuando completes dos semanas de registros, verás qué ha cambiado de una a otra.",
      sample: previousWeek.length >= 5 ? `${recentWeek.length} días actuales · ${previousWeek.length} anteriores` : "Falta completar la semana anterior",
    },
    {
      title: "Tu base personal",
      color: "mint",
      icon: <Activity size={16} />,
      text: completeMetrics.length
        ? `Tu referencia de ${completeMetrics.length} días es ${formatDecimal(sleepBaseline)} h de sueño, ${formatNumber(qualityBaseline)}% de calidad y ${formatNumber(caloriesBaseline)} kcal activas al día. Compárate con esta base, no con un ideal ajeno.`
        : "Aquí aparecerá tu línea base personal a medida que sumes registros.",
      sample: `${completeMetrics.length} días con datos de actividad y descanso`,
    },
    {
      title: "Noches de recuperación",
      color: "sand",
      icon: <Moon size={16} />,
      text: recoveryRate != null
        ? `En ${recoveryDays.length} de ${completeMetrics.length} noches (${recoveryRate}%) reuniste al menos 7 h de sueño y 80% de calidad. Esta es una referencia simple para observar tu descanso sostenido.`
        : "Registra horas y calidad de sueño para seguir tu recuperación.",
      sample: "Umbral: 7 h + calidad del 80%",
    },
    {
      title: "Pico de movimiento",
      color: "mint",
      icon: <Flame size={16} />,
      text: bestActiveDay
        ? `Tu día más activo fue el ${formatShortDate(bestActiveDay.date)}: ${formatNumber(bestActiveDay.activeCalories)} kcal activas${bestActiveDay.exerciseMinutes != null ? ` y ${formatNumber(bestActiveDay.exerciseMinutes)} min de ejercicio` : ""}. Úsalo como referencia para entender qué tipo de día quieres repetir.`
        : "Registra calorías activas para identificar tus días de mayor movimiento.",
      sample: screenCoverage.length ? `Pantalla registrada en ${screenCoverage.length} días` : "Sin registros de pantalla todavía",
    },
  ];
}

function habitCategoryIcon(category: string, size: number) {
  if (/física|movimiento|deporte|ejercicio/i.test(category)) return <Dumbbell size={size} />;
  if (/mental|bienestar/i.test(category)) return <Leaf size={size} />;
  if (/crecimiento|aprendizaje/i.test(category)) return <BookOpen size={size} />;
  if (/relaciones|familia|social/i.test(category)) return <Users size={size} />;
  return <Sparkles size={size} />;
}

function truncateAtWord(value: string, limit: number) {
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length <= limit) return clean;
  const candidate = clean.slice(0, limit + 1);
  const boundary = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, boundary > limit * .55 ? boundary : limit).trimEnd()}…`;
}

function argentinaDateKey(date: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function addDays(date: string, amount: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }
function startOfWeek(date: string) { const value = new Date(`${date}T12:00:00Z`); const day = value.getUTCDay(); value.setUTCDate(value.getUTCDate() - (day === 0 ? 6 : day - 1)); return value.toISOString().slice(0, 10); }
function formatLongDate(date: string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }); }
function formatShortDate(date: string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", ""); }
function formatTinyDate(date: string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" }).replace(".", "").toUpperCase(); }
function shortDay(date: string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" }).replace(".", "").toUpperCase(); }
function lastDays(today: string, count: number) { const base = new Date(`${today}T12:00:00Z`); return Array.from({ length: count }, (_, index) => { const date = new Date(base); date.setUTCDate(base.getUTCDate() - (count - 1 - index)); return date.toISOString().slice(0, 10); }); }
function moodEmoji(value: number | null | undefined) { return value == null ? "" : ["😞", "😕", "😐", "🙂", "😊"][Math.max(1, Math.min(5, value)) - 1]; }
function formatNumber(value: number | null | undefined) { return value == null ? missingValue : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value); }
function formatDecimal(value: number | null | undefined) { return value == null ? missingValue : new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value); }
function formatSigned(value: number) { return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)}`; }
function metricValue(value: number | null | undefined, unit: string) { return value == null ? missingValue : `${formatNumber(value)} ${unit}`; }
function nullableNumber(value: unknown) { return value === "" || value == null ? null : Number(value); }
function formatDuration(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const totalMinutes = Math.round(Number(value) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}
function formatDurationCompact(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(Number(value))}h`;
}
function formatTimer(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function formatMinutes(minutes: number) { const rounded = Math.max(0, Math.round(minutes)); const hours = Math.floor(rounded / 60); const rest = rounded % 60; return hours ? `${hours} h${rest ? ` ${rest} min` : ""}` : `${rest} min`; }
function bulletLabel(type: string) { return type === "task" ? "Tarea" : type === "event" ? "Evento" : "Nota"; }
function weightChange(latest?: Metric, previous?: Metric) { if (latest?.weight == null || previous?.weight == null) return latest?.weight != null ? formatShortDate(latest.date) : missingValue; const change = latest.weight - previous.weight; return `${change > 0 ? "+" : ""}${formatNumber(change)} kg desde el anterior`; }
function daysBetween(start: string, end: string) { return Math.max(0, Math.floor((new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 86_400_000)); }
function monthLabel(month: string) { return new Date(`${month}-15T12:00:00Z`).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).replace(/^./, (letter) => letter.toUpperCase()); }
function quarterKey(month: string) { const [year, monthNumber] = month.split("-").map(Number); return `${year}-Q${Math.floor((monthNumber - 1) / 3) + 1}`; }
function quarterLabel(quarter: string) { const [year, number] = quarter.split("-Q"); return `${number}.º trimestre de ${year}`; }
function shiftMonth(month: string, amount: number) { const [year, monthNumber] = month.split("-").map(Number); const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function monthsForQuarter(quarter: string) { const [year, number] = quarter.split("-Q").map(Number); const firstMonth = (number - 1) * 3 + 1; return [0, 1, 2].map((offset) => `${year}-${String(firstMonth + offset).padStart(2, "0")}`); }
function quarterOptions(today: string) { const year = Number(today.slice(0, 4)); return [year - 1, year, year + 1, year + 2].flatMap((item) => [1, 2, 3, 4].map((quarter) => `${item}-Q${quarter}`)); }
function priorityLabel(value: string) { return value === "high" ? "Alta" : value === "low" ? "Baja" : "Media"; }
function energyLabel(value: string | null | undefined) { return value === "high" ? "Alta" : value === "low" ? "Baja" : "Media"; }
function projectStatus(value: string) { return value === "completed" ? "Completado" : value === "paused" ? "Pausado" : "Activo"; }
function taskStatus(value: ProjectTask["status"]) { return value === "done" ? "Hechas" : value === "doing" ? "En curso" : "Por hacer"; }
function bucketStatus(value: BucketItem["status"]) { return value === "completed" ? "Cumplido" : value === "inProgress" ? "En progreso" : "Pendiente"; }
