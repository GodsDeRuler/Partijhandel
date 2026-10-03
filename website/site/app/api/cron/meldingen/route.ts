import { NextResponse } from "next/server";
import { need, rpcAnon } from "@/lib/supabase";
import { mailsVoor, verstuur, type Melding } from "@/lib/mail";

export const dynamic = "force-dynamic";

/**
 * Haalt de meldingen op die gemaild moeten worden (vragen van klanten, antwoorden, aanvragen, formulieren) en verstuurt ze.
 * Doet niets zolang "Mails vanuit de site" in het Salesbureau op Nee staat. Vercel roept deze route elke paar minuten aan (vercel.json).
 */
export async function GET(req: Request) {
  const cron = process.env.CRON_SECRET;
  if (!cron || req.headers.get("authorization") !== `Bearer ${cron}`) return new NextResponse("Unauthorized", { status: 401 });
  const geheim = need("WEBSITE_FORM_SECRET");
  const { data, error } = await rpcAnon<{ aan: boolean; info_mail: string | null; items: Melding[] }>("site_meldingen_ophalen", { p_geheim: geheim });
  if (error || !data) return NextResponse.json({ ok: false, error }, { status: 500 });
  if (!data.aan) return NextResponse.json({ ok: true, aan: false, verstuurd: 0 });
  const info = data.info_mail || "info@fvdwpartijhandel.nl";
  let verstuurd = 0, mislukt = 0;
  for (const m of data.items) {
    try {
      for (const mail of mailsVoor(m, info)) await verstuur(mail);
      await rpcAnon("site_meldingen_afronden", { p_geheim: geheim, p_ids: [m.id] });
      verstuurd++;
    } catch (e) {
      mislukt++;
      await rpcAnon("site_meldingen_afronden", { p_geheim: geheim, p_ids: [m.id], p_fout: e instanceof Error ? e.message : "onbekende fout" });
    }
  }
  return NextResponse.json({ ok: true, aan: true, verstuurd, mislukt });
}
