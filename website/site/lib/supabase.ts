import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Omgevingsvariabele ${name} ontbreekt. Zie .env.example.`);
  return v;
}

/** Supabase met de sessie van de bezoeker (cookie). Alleen de server praat met Supabase; de browser krijgt nooit een sleutel. */
export async function db() {
  const store = await cookies();
  return createServerClient(need("SUPABASE_URL"), need("SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => {
        try { for (const { name, value, options } of list) store.set(name, value, options); } catch { /* in een serverpagina mag dit niet; proxy.ts ververst de sessie */ }
      },
    },
  });
}

/** Supabase zonder sessie, voor formulieren van bezoekers en de cron-route. */
export function anonDb() {
  return createClient(need("SUPABASE_URL"), need("SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}

export type RpcResult<T> = { data: T | null; error: string | null };

/** Roept een site_*-functie aan. De foutcode is de tekst van de databasefout, bijvoorbeeld "te_vaak". */
export async function rpc<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<RpcResult<T>> {
  const sb = await db();
  const { data, error } = await sb.rpc(name, args);
  return { data: (data as T) ?? null, error: error ? error.message : null };
}
export async function rpcAnon<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<RpcResult<T>> {
  const { data, error } = await anonDb().rpc(name, args);
  return { data: (data as T) ?? null, error: error ? error.message : null };
}
