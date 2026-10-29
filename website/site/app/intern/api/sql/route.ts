import { NextResponse, type NextRequest } from "next/server";
import { huidigeMedewerker, isLeesQuery, logActie, pool } from "@/lib/intern";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Voert een query van het Salesbureau uit, voor een ingelogde medewerker. Antwoord: de rijen van het laatste statement (zoals de Supabase-koppeling deed). */
export async function POST(req: NextRequest) {
  const m = await huidigeMedewerker();
  if (!m) return NextResponse.json({ error: "niet_ingelogd" }, { status: 401 });
  let query = "";
  try { query = String((await req.json()).query ?? ""); } catch { /* leeg */ }
  if (!query.trim() || query.length > 2_000_000) return NextResponse.json({ error: "geen_query" }, { status: 400 });
  if (m.rol === "alleen_lezen" && !isLeesQuery(query)) return NextResponse.json({ error: "alleen_lezen" }, { status: 403 });
  const t0 = Date.now();
  try {
    const r = await pool().query(query);
    const last = Array.isArray(r) ? r[r.length - 1] : r;
    const rows = last && Array.isArray(last.rows) ? last.rows : [];
    if (m.rol !== "alleen_lezen" && !/^\s*(select|with)\b/i.test(query)) void logActie(m, query, Date.now() - t0, null);
    return NextResponse.json({ rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    void logActie(m, query, Date.now() - t0, msg);
    return NextResponse.json({ error: "query_fout", message: msg }, { status: 400 });
  }
}
