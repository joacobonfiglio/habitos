import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // These defaults keep the personal app working if the public Vercel variables are not available.
  // They are public project identifiers; private service-role keys are never used in the browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://gohbsqarzjdwunkcrjew.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_hZqC9Yw93ZtrI-Z7s7W2gA_L7n8Zvf3";
  if (!url || !key) return null;
  return createBrowserClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}
