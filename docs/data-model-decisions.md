# Decisiones de modelo de datos — consistencia y métricas derivadas

Fecha: 2026-08-08

## Valores no registrados

Los campos numéricos opcionales continúan almacenándose como `null`. La interfaz usa exclusivamente `—` para representarlos y no añade unidades a ese marcador. Un cero solo representa un valor registrado de cero.

## Categorías de tiempo de enfoque

Se conserva `FocusSession.category` como texto para no romper snapshots existentes. La interfaz ya no ofrece texto libre como camino principal: muestra categorías existentes y una acción explícita `Crear nueva categoría`.

Al guardar se aplica esta normalización:

- espacios iniciales/finales eliminados;
- espacios internos consecutivos reducidos a uno;
- coincidencias sin distinción de mayúsculas reutilizan la etiqueta existente;
- el alias histórico exacto `Desa` se migra a `Desarrollo` al cargar el snapshot.

No se crea aún una tabla de categorías porque LifeOS sincroniza un único snapshot JSON por usuario. Si en el futuro las categorías necesitan color, icono, archivado o reglas propias, se recomienda introducir `FocusCategory { id, name, normalizedName, ... }` y cambiar las sesiones a `categoryId` mediante una migración versionada.

## Objetivos y avance

`PlanGoal.status` se conserva por compatibilidad y se usa como estado manual únicamente cuando el objetivo no tiene tareas vinculadas.

Cuando existen tareas, el estado y el porcentaje visibles son derivados:

`tareas completadas / tareas vinculadas × 100`

Un objetivo con cero tareas muestra `Sin tareas vinculadas` y `—`; nunca 0 % ni 100 %. No se persiste un porcentaje separado, por lo que no puede quedar desincronizado.

## Sprints y planificación diaria de tareas de proyecto

`ProjectTask` conserva su vínculo obligatorio con `projectId` y añade campos opcionales, guardados dentro del snapshot JSON:

- `sprintWeek`: lunes de la semana del sprint en formato `YYYY-MM-DD`.
- `scheduledDate`: día concreto de ejecución. Cuando existe, `sprintWeek` se deriva automáticamente de esa fecha.
- `estimatedMinutes`: estimación entera en minutos; `null` significa que aún no se estimó.
- `energy`: energía requerida (`low`, `medium` o `high`).

La migración es progresiva y no requiere modificar la tabla de Supabase: las tareas antiguas se normalizan al leer el snapshot con energía media, estimación nula y sin semana/día. Se muestran en `Sin planificar` hasta que el usuario las incorpore a un sprint. El estado kanban sigue siendo la única fuente de verdad para saber si una tarea está por hacer, en curso o completada.

## Módulo único de trabajo

Planificación, agenda semanal, proyectos y notas se presentan como vistas internas del mismo módulo `Proyectos, plan y notas`. Se elimina `planning` como destino independiente de navegación, pero no se cambia ni duplica ningún dato.

La jerarquía funcional es: objetivo mensual/trimestral (`PlanGoal`) → acciones del periodo (`PlanTask`) → sprint y día (`ProjectTask`) → contexto y aprendizaje (`NoteItem`). Los vínculos existentes mediante `projectId` y `goalId` siguen siendo la fuente de verdad, por lo que esta unificación de interfaz no requiere migración de Supabase.

## Sesiones multidispositivo

El cierre de sesión de LifeOS usa `signOut({ scope: "local" })`. Así se elimina únicamente la sesión del navegador o PWA actual; cerrar sesión en el móvil no revoca la sesión del ordenador, ni al revés. La opción global no se expone en la interfaz.

## Rachas e insights

Las rachas y correlaciones son datos derivados en el cliente; no se añaden campos persistidos. La racha actual admite como ancla hoy o ayer, para no romper una racha durante el día antes del registro. Los insights solo describen asociaciones y muestran el tamaño de la muestra; no hacen afirmaciones causales.

## Versión de snapshot

Las escrituras nuevas usan `schema_version = 3`. La forma general de `LifeData` no cambia y los snapshots anteriores siguen siendo legibles mediante `parseStoredData`.
