import { NextResponse, type NextRequest } from "next/server";
import { huidigeMedewerker } from "@/lib/intern";

export const runtime = "nodejs";
export const maxDuration = 60;

/** AI-hulp voor het Salesbureau (mails, briefing, slim zoeken). Alleen voor ingelogde medewerkers; start nooit vanzelf. */
export async function POST(req: NextRequest) {
  const m = await huidigeMedewerker();
  if (!m) return NextResponse.json({ error: "niet_ingelogd" }, { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ai_niet_ingesteld" }, { status: 503 });
  let prompt = "";
  try { prompt = String((await req.json()).prompt ?? ""); } catch { /* leeg */ }
  if (!prompt.trim() || prompt.length > 120_000) return NextResponse.json({ error: "geen_prompt" }, { status: 400 });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) return NextResponse.json({ error: r.status === 429 ? "rate_limited" : "ai_fout" }, { status: 502 });
  const j = await r.json() as { content?: { type: string; text?: string }[] };
  const text = (j.content ?? []).filter(c => c.type === "text").map(c => c.text ?? "").join("");
  return NextResponse.json({ text });
}
