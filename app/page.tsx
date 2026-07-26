"use client";

import { useEffect, useState } from "react";

type Habit = {
  id: number;
  name: string;
  detail: string;
  category: string;
  icon: string;
  color: "sage" | "peach" | "sand";
  streak: number;
};

type Experiment = {
  id: number;
  name: string;
  hypothesis: string;
  duration: number;
  day: number;
  logs: number;
  active: boolean;
  entries?: ExperimentEntry[];
};

type ExperimentEntry = {
  id: number;
  date: string;
  input: string;
  result: string;
  rating: number;
};

type Challenge = {
  id: number;
  name: string;
  duration: number;
  currentDay: number;
  actions: string[];
  checked: string[];
};

type ModalType = "habit" | "experiment" | "experiment-log" | "challenge" | null;

const starterHabits: Habit[] = [
  { id: 1, name: "Caminar 30 min", detail: "30 min", category: "Salud", icon: "↗", color: "sage", streak: 6 },
  { id: 2, name: "Meditar 7 min", detail: "7 min", category: "Bienestar", icon: "✦", color: "sage", streak: 12 },
  { id: 3, name: "Leer 20 min", detail: "20 min", category: "Aprendizaje", icon: "⌑", color: "peach", streak: 4 },
  { id: 4, name: "Italiano 15 min", detail: "15 min", category: "Desarrollo", icon: "A", color: "peach", streak: 3 },
  { id: 5, name: "Beber 2 L de agua", detail: "2 litros", category: "Salud", icon: "◌", color: "sand", streak: 8 },
  { id: 6, name: "Escribir el día", detail: "5 min", category: "Bienestar", icon: "✎", color: "sand", streak: 2 },
];

const starterExperiments: Experiment[] = [
  {
    id: 1,
    name: "Sin móvil al despertar",
    hypothesis: "Empezar sin pantallas me dará más claridad y menos ansiedad.",
    duration: 7,
    day: 4,
    logs: 3,
    active: true,
    entries: [],
  },
  {
    id: 2,
    name: "Café solo por la mañana",
    hypothesis: "Dormiré mejor si no tomo café después de las 13:00.",
    duration: 14,
    day: 14,
    logs: 12,
    active: false,
    entries: [],
  },
];

const starterChallenges: Challenge[] = [
  {
    id: 1,
    name: "30 días en movimiento",
    duration: 30,
    currentDay: 8,
    actions: ["Caminar 30 minutos", "Estirar 5 minutos", "Beber 2 L de agua"],
    checked: ["Caminar 30 minutos"],
  },
];

const navItems = [
  { id: "today", label: "Hoy", icon: "⌂" },
  { id: "habits", label: "Hábitos", icon: "✓" },
  { id: "experiments", label: "Experimentos", icon: "◇" },
  { id: "challenges", label: "Retos", icon: "⚑" },
];

const storageKey = "mi-ritmo-v1";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>(starterHabits);
  const [completed, setCompleted] = useState<number[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>(starterExperiments);
  const [challenges, setChallenges] = useState<Challenge[]>(starterChallenges);
  const [active, setActive] = useState("today");
  const [showAll, setShowAll] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedExperimentId, setSelectedExperimentId] = useState<number | null>(null);
  const [expandedExperimentId, setExpandedExperimentId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [date, setDate] = useState("Hoy");
  const [greeting, setGreeting] = useState("Hola");

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const data = JSON.parse(raw);
      setHabits(data.habits ?? starterHabits);
      setExperiments(data.experiments ?? starterExperiments);
      setChallenges(data.challenges ?? starterChallenges);
      setCompleted(data.daily?.[todayKey()] ?? []);
    } else {
      setCompleted([1, 2]);
    }
    const now = new Date();
    setDate(
      new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(now),
    );
    setGreeting(now.getHours() < 13 ? "Buenos días" : now.getHours() < 20 ? "Buenas tardes" : "Buenas noches");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const current = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...current,
        habits,
        experiments,
        challenges,
        daily: { ...(current.daily ?? {}), [todayKey()]: completed },
      }),
    );
  }, [habits, completed, experiments, challenges, ready]);

  const progress = habits.length ? Math.round((completed.length / habits.length) * 100) : 0;
  const visibleHabits = showAll ? habits : habits.slice(0, 4);

  function toggleHabit(id: number) {
    setCompleted((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function addHabit(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    setHabits((items) => [
      ...items,
      {
        id: Date.now(),
        name,
        detail: String(form.get("detail") || "Diario"),
        category: String(form.get("category") || "Bienestar"),
        icon: "✦",
        color: "sage",
        streak: 0,
      },
    ]);
    setModal(null);
  }

  function addExperiment(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    setExperiments((items) => [
      {
        id: Date.now(),
        name,
        hypothesis: String(form.get("hypothesis") || "Quiero observar cómo influye en mi bienestar."),
        duration: Number(form.get("duration") || 7),
        day: 1,
        logs: 0,
        active: true,
        entries: [],
      },
      ...items,
    ]);
    setModal(null);
  }

  function addChallenge(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    const actions = String(form.get("actions") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!name || !actions.length) return;
    setChallenges((items) => [
      {
        id: Date.now(),
        name,
        duration: Number(form.get("duration") || 21),
        currentDay: 1,
        actions,
        checked: [],
      },
      ...items,
    ]);
    setModal(null);
  }

  function openExperimentLog(id: number) {
    setSelectedExperimentId(id);
    setModal("experiment-log");
  }

  function logExperiment(form: FormData) {
    if (selectedExperimentId === null) return;
    const input = String(form.get("input") ?? "").trim();
    const result = String(form.get("result") ?? "").trim();
    if (!input || !result) return;
    const entry: ExperimentEntry = {
      id: Date.now(),
      date: new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
      input,
      result,
      rating: Number(form.get("rating") || 3),
    };
    setExperiments((items) =>
      items.map((item) =>
        item.id === selectedExperimentId
          ? {
              ...item,
              entries: [entry, ...(item.entries ?? [])],
              logs: Math.min(item.logs + 1, item.duration),
              day: Math.min(item.day + 1, item.duration),
            }
          : item,
      ),
    );
    setExpandedExperimentId(selectedExperimentId);
    setSelectedExperimentId(null);
    setModal(null);
  }

  function toggleChallengeAction(id: number, action: string) {
    setChallenges((items) =>
      items.map((item) =>
        item.id !== id
          ? item
          : {
              ...item,
              checked: item.checked.includes(action)
                ? item.checked.filter((value) => value !== action)
                : [...item.checked, action],
            },
      ),
    );
  }

  function finishChallengeDay(id: number) {
    setChallenges((items) =>
      items.map((item) =>
        item.id === id && item.checked.length === item.actions.length
          ? { ...item, currentDay: Math.min(item.currentDay + 1, item.duration), checked: [] }
          : item,
      ),
    );
  }

  const titles: Record<string, { eyebrow: string; title: string; copy: string }> = {
    habits: { eyebrow: "TU SISTEMA", title: "Hábitos", copy: "Construye constancia sin buscar la perfección." },
    experiments: { eyebrow: "APRENDER DE TI", title: "Experimentos", copy: "Prueba una idea, observa y decide con evidencia." },
    challenges: { eyebrow: "PASO A PASO", title: "Retos", copy: "Un objetivo concreto dividido en días posibles." },
  };

  return (
    <main className="app-shell">
      <section className="phone-app" aria-label="Mi Ritmo">
        <header className="topbar">
          <button className="brand" onClick={() => setActive("today")} aria-label="Ir a Hoy">
            <span className="brand-mark" aria-hidden="true">⌁</span>
            <span>Mi Ritmo</span>
          </button>
          <button className="profile" aria-label="Abrir perfil">JQ</button>
        </header>

        <div className="content">
          {active === "today" ? (
            <>
              <section className="welcome">
                <p className="eyebrow">{date}</p>
                <h1>{greeting},<br />Joaquín</h1>
                <p className="welcome-copy">Un paso pequeño también cuenta.</p>
              </section>

              <section className="progress-card" aria-label={`${completed.length} de ${habits.length} hábitos completados`}>
                <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
                  <div><strong>{completed.length}</strong><span>de {habits.length}</span></div>
                </div>
                <div className="progress-copy">
                  <span>PROGRESO DE HOY</span>
                  <h2>{completed.length === habits.length ? "Día completado" : "Vas a buen ritmo"}</h2>
                  <p>{habits.length - completed.length === 0 ? "Disfruta lo conseguido." : `Te quedan ${habits.length - completed.length} acciones para hoy.`}</p>
                </div>
              </section>

              <section className="today-section">
                <div className="section-heading">
                  <div><p className="eyebrow">PARA HOY</p><h2>Mis hábitos</h2></div>
                  <button className="text-button" onClick={() => setShowAll((value) => !value)}>
                    {showAll ? "Ver menos" : "Ver todos"}
                  </button>
                </div>
                <HabitList habits={visibleHabits} completed={completed} toggleHabit={toggleHabit} />
              </section>

              <button className="primary-button wide" onClick={() => setModal("habit")}>
                <span>＋</span> Añadir hábito
              </button>
            </>
          ) : (
            <section className="page-view">
              <div className="page-intro">
                <p className="eyebrow">{titles[active].eyebrow}</p>
                <h1>{titles[active].title}</h1>
                <p>{titles[active].copy}</p>
              </div>

              {active === "habits" && (
                <>
                  <div className="mini-summary">
                    <div><strong>{habits.length}</strong><span>Activos</span></div>
                    <div><strong>{completed.length}</strong><span>Hechos hoy</span></div>
                    <div><strong>{Math.max(0, ...habits.map((item) => item.streak))}</strong><span>Mejor racha</span></div>
                  </div>
                  <div className="section-heading compact">
                    <h2>Todos mis hábitos</h2>
                    <button className="round-add" onClick={() => setModal("habit")} aria-label="Añadir hábito">＋</button>
                  </div>
                  <div className="management-list">
                    {habits.map((habit) => (
                      <article className="management-card" key={habit.id}>
                        <span className={`habit-icon ${habit.color}`} aria-hidden="true">{habit.icon}</span>
                        <div><strong>{habit.name}</strong><small>Racha actual · {habit.streak} días</small></div>
                        <button
                          className="more-button"
                          onClick={() => setHabits((items) => items.filter((item) => item.id !== habit.id))}
                          aria-label={`Eliminar ${habit.name}`}
                        >×</button>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {active === "experiments" && (
                <>
                  <button className="primary-button wide top-action" onClick={() => setModal("experiment")}>
                    <span>＋</span> Nuevo experimento
                  </button>
                  <div className="stack">
                    {experiments.map((experiment) => {
                      const experimentProgress = Math.round((experiment.day / experiment.duration) * 100);
                      return (
                        <article className={`feature-card ${experiment.active ? "" : "muted-card"}`} key={experiment.id}>
                          <div className="card-topline">
                            <span className={`status-pill ${experiment.active ? "" : "finished"}`}>
                              {experiment.active ? `Día ${experiment.day} de ${experiment.duration}` : "Finalizado"}
                            </span>
                            <span>{experiment.logs} registros</span>
                          </div>
                          <h2>{experiment.name}</h2>
                          <p>{experiment.hypothesis}</p>
                          <div className="linear-progress"><span style={{ width: `${experimentProgress}%` }} /></div>
                          {experiment.active ? (
                            <button className="soft-button" onClick={() => openExperimentLog(experiment.id)}>Registrar cómo me fue hoy</button>
                          ) : (
                            <button
                              className="soft-button"
                              onClick={() => setExperiments((items) => items.map((item) => item.id === experiment.id ? { ...item, active: true, day: 1, logs: 0 } : item))}
                            >Repetir experimento</button>
                          )}
                          {(experiment.entries?.length ?? 0) > 0 && (
                            <div className="experiment-history">
                              <button
                                className="history-toggle"
                                onClick={() => setExpandedExperimentId((current) => current === experiment.id ? null : experiment.id)}
                                aria-expanded={expandedExperimentId === experiment.id}
                              >
                                {expandedExperimentId === experiment.id ? "Ocultar historial" : `Ver historial (${experiment.entries?.length})`}
                                <span aria-hidden="true">{expandedExperimentId === experiment.id ? "⌃" : "⌄"}</span>
                              </button>
                              {expandedExperimentId === experiment.id && (
                                <div className="history-list">
                                  {experiment.entries?.map((entry) => (
                                    <article className="history-entry" key={entry.id}>
                                      <div className="history-meta">
                                        <span>{entry.date}</span>
                                        <span className="rating" aria-label={`Valoración ${entry.rating} de 5`}>
                                          {"●".repeat(entry.rating)}{"○".repeat(5 - entry.rating)}
                                        </span>
                                      </div>
                                      <div className="entry-block">
                                        <small>LO QUE HICE</small>
                                        <p>{entry.input}</p>
                                      </div>
                                      <div className="entry-block result">
                                        <small>CÓMO FUE</small>
                                        <p>{entry.result}</p>
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {active === "challenges" && (
                <>
                  <button className="primary-button wide top-action" onClick={() => setModal("challenge")}>
                    <span>＋</span> Crear un reto
                  </button>
                  <div className="stack">
                    {challenges.map((challenge) => (
                      <article className="challenge-card" key={challenge.id}>
                        <div className="challenge-hero">
                          <div>
                            <span>RETO ACTIVO</span>
                            <h2>{challenge.name}</h2>
                          </div>
                          <div className="day-badge"><strong>{challenge.currentDay}</strong><small>de {challenge.duration}</small></div>
                        </div>
                        <div className="challenge-body">
                          <p className="list-label">ACCIONES DEL DÍA {challenge.currentDay}</p>
                          {challenge.actions.map((action) => {
                            const checked = challenge.checked.includes(action);
                            return (
                              <button
                                className={`action-row ${checked ? "checked" : ""}`}
                                key={action}
                                onClick={() => toggleChallengeAction(challenge.id, action)}
                                aria-pressed={checked}
                              >
                                <span>{checked ? "✓" : ""}</span>{action}
                              </button>
                            );
                          })}
                          <button
                            className="primary-button wide finish-button"
                            disabled={challenge.checked.length !== challenge.actions.length}
                            onClick={() => finishChallengeDay(challenge.id)}
                          >Completar día</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        <nav className="bottom-nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => setActive(item.id)}
              aria-current={active === item.id ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        {modal && (
          <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}>
            <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
              <div className="sheet-handle" />
              <button className="sheet-close" onClick={() => setModal(null)} aria-label="Cerrar">×</button>
              {modal === "habit" && (
                <Form title="Nuevo hábito" copy="Hazlo pequeño y fácil de repetir." onSubmit={addHabit}>
                  <Field label="Nombre" name="name" placeholder="Ej. Preparar el día" />
                  <div className="form-grid">
                    <Field label="Duración o meta" name="detail" placeholder="10 min" />
                    <SelectField label="Categoría" name="category" options={["Bienestar", "Salud", "Aprendizaje", "Desarrollo"]} />
                  </div>
                </Form>
              )}
              {modal === "experiment" && (
                <Form title="Nuevo experimento" copy="Define qué quieres probar y durante cuánto tiempo." onSubmit={addExperiment}>
                  <Field label="¿Qué vas a probar?" name="name" placeholder="Ej. Cenar antes de las 21:00" />
                  <Field label="¿Qué esperas observar?" name="hypothesis" placeholder="Creo que dormiré mejor..." textarea />
                  <Field label="Duración en días" name="duration" placeholder="7" type="number" />
                </Form>
              )}
              {modal === "experiment-log" && (
                <Form
                  title="Registro de hoy"
                  copy={`Anota qué hiciste y qué efecto observaste en “${experiments.find((item) => item.id === selectedExperimentId)?.name ?? "tu experimento"}”.`}
                  onSubmit={logExperiment}
                  eyebrow="EXPERIMENTO"
                  submitLabel="Guardar registro"
                >
                  <Field
                    label="¿Qué hiciste hoy?"
                    name="input"
                    placeholder="Ej. Dejé el móvil fuera de la habitación hasta después de desayunar."
                    textarea
                  />
                  <Field
                    label="¿Cómo ha ido?"
                    name="result"
                    placeholder="Ej. Me levanté más tranquilo y pude empezar el día sin distracciones."
                    textarea
                  />
                  <SelectField
                    label="Valoración general"
                    name="rating"
                    options={["1 · Muy mal", "2 · Mal", "3 · Normal", "4 · Bien", "5 · Muy bien"]}
                    values={["1", "2", "3", "4", "5"]}
                    defaultValue="3"
                  />
                </Form>
              )}
              {modal === "challenge" && (
                <Form title="Nuevo reto" copy="Divide el reto en acciones claras para cada día." onSubmit={addChallenge}>
                  <Field label="Nombre del reto" name="name" placeholder="Ej. 21 días de energía" />
                  <Field label="Duración en días" name="duration" placeholder="21" type="number" />
                  <Field label="Acciones diarias, separadas por coma" name="actions" placeholder="Caminar 20 min, beber agua, estirar" textarea />
                </Form>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function HabitList({ habits, completed, toggleHabit }: { habits: Habit[]; completed: number[]; toggleHabit: (id: number) => void }) {
  return (
    <div className="habit-list">
      {habits.map((habit) => {
        const isDone = completed.includes(habit.id);
        return (
          <button className={`habit-card ${isDone ? "done" : ""}`} key={habit.id} onClick={() => toggleHabit(habit.id)} aria-pressed={isDone}>
            <span className={`habit-icon ${habit.color}`} aria-hidden="true">{habit.icon}</span>
            <span className="habit-copy">
              <strong>{habit.name}</strong>
              <small><i aria-hidden="true">♧</i> {habit.category} <b>·</b> {habit.detail}</small>
            </span>
            <span className="check" aria-hidden="true">{isDone ? "✓" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

function Form({
  title,
  copy,
  onSubmit,
  children,
  eyebrow = "AÑADIR",
  submitLabel = "Guardar",
}: {
  title: string;
  copy: string;
  onSubmit: (form: FormData) => void;
  children: React.ReactNode;
  eyebrow?: string;
  submitLabel?: string;
}) {
  return (
    <form action={onSubmit}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="modal-title">{title}</h2>
      <p className="form-copy">{copy}</p>
      <div className="form-fields">{children}</div>
      <button className="primary-button wide" type="submit">{submitLabel}</button>
    </form>
  );
}

function Field({ label, name, placeholder, type = "text", textarea = false }: { label: string; name: string; placeholder: string; type?: string; textarea?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? <textarea name={name} placeholder={placeholder} required /> : <input name={name} type={type} placeholder={placeholder} required={name === "name"} min={type === "number" ? 1 : undefined} />}
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  values,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  values?: string[];
  defaultValue?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue}>{options.map((option, index) => <option key={option} value={values?.[index] ?? option}>{option}</option>)}</select>
    </label>
  );
}
