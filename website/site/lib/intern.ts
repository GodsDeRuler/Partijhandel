import { Pool, types } from "pg";
import { db, need } from "@/lib/supabase";

/**
 * Toegang tot de medewerkersomgeving (Salesbureau).
 * Medewerkers loggen in met een inloglink (Supabase Auth). Alleen een e-mailadres dat in de tabel medewerkers staat en actief is, komt binnen.
 * De queries van het Salesbureau lopen via de server met de databasegebruiker salesbureau_app (SUPABASE_DB_URL); de browser krijgt nooit een sleutel.
 */

// Zelfde vorm als de Supabase-koppeling die het Salesbureau tot nu toe gebruikte: getallen als getal, datums als tekst.
types.setTypeParser(20, v => Number(v)); // int8
types.setTypeParser(1700, v => Number(v)); // numeric
types.setTypeParser(1082, v => v); // date: "2026-10-29"

declare global { var __internPool: Pool | undefined }
export function pool(): Pool {
  if (!globalThis.__internPool) {
    globalThis.__internPool = new Pool({
      connectionString: need("SUPABASE_DB_URL"),
      max: 4,
      ssl: { rejectUnauthorized: false },
      statement_timeout: 60_000,
      idleTimeoutMillis: 20_000,
    });
  }
  return globalThis.__internPool;
}

export type Rol = "beheer" | "verkoop" | "magazijn" | "alleen_lezen";
export type Medewerker = { id: number; naam: string; email: string; rol: Rol };

export async function medewerkerByEmail(email: string): Promise<Medewerker | null> {
  const r = await pool().query("select id, naam, email, rol from medewerkers where lower(email) = lower($1) and actief and rol is not null limit 1", [email]);
  return (r.rows[0] as Medewerker | undefined) ?? null;
}

/** De ingelogde medewerker, of null. Het e-mailadres komt uit de Supabase-sessie (door de inloglink bewezen eigen adres). */
export async function huidigeMedewerker(): Promise<Medewerker | null> {
  try {
    const sb = await db();
    const { data } = await sb.auth.getUser();
    const email = data.user?.email;
    if (!email) return null;
    return await medewerkerByEmail(email);
  } catch {
    return null;
  }
}

/** Een alleen-lezen medewerker mag geen schrijfopdrachten geven. Het is een vangnet bovenop de rol in de database, geen vervanging ervan. */
export function isLeesQuery(q: string): boolean {
  const s = q.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ").trim().toLowerCase();
  return /^(select|with|show|explain)\b/.test(s) && !/\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|copy|do|call)\b/.test(s.replace(/'(?:[^']|'')*'/g, "''"));
}

export async function logActie(m: Medewerker, query: string, ms: number, fout: string | null) {
  try {
    await pool().query("insert into intern_log (medewerker_id, query, ms, fout) values ($1, left($2, 2000), $3, $4)", [m.id, query, ms, fout]);
  } catch { /* loggen mag het werk nooit stoppen */ }
}
