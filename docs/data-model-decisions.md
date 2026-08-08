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

## Rachas e insights

Las rachas y correlaciones son datos derivados en el cliente; no se añaden campos persistidos. La racha actual admite como ancla hoy o ayer, para no romper una racha durante el día antes del registro. Los insights solo describen asociaciones y muestran el tamaño de la muestra; no hacen afirmaciones causales.

## Versión de snapshot

Las escrituras nuevas usan `schema_version = 3`. La forma general de `LifeData` no cambia y los snapshots anteriores siguen siendo legibles mediante `parseStoredData`.
