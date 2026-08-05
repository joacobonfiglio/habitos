# LifeOS Development

Clon de desarrollo de LifeOS preparado para PWA, autenticación con Google, sincronización con Supabase e importación de la copia local existente.

## Preparación

1. Copia `.env.example` a `.env.local`.
2. Añade la URL y la clave publicable de Supabase.
3. Aplica `supabase/migrations/0001_lifeos_snapshots.sql`.
4. Configura Google como proveedor OAuth y añade las URLs de retorno de desarrollo y Vercel.

La aplicación mantiene localStorage como capa offline. Supabase conserva un snapshot privado por usuario protegido mediante RLS.
