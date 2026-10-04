import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { db } from "@/lib/supabase";
import { href, isLang } from "@/lib/i18n";

/**
 * Hier komt de klant terecht na het klikken op de inloglink in zijn mail. Twee varianten van de link worden ondersteund:
 *  - ?code=...        (standaard van Supabase, werkt in dezelfde browser als waar de link is aangevraagd)
 *  - ?token_hash=...  (met de aanbevolen mailtemplate, werkt ook als de mail op een ander apparaat wordt geopend)
 * Daarna koppelen we het account aan de klant en sturen we door naar Mijn omgeving.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lang = isLang(sp.get("lang")) ? (sp.get("lang") as "nl" | "en" | "de") : "nl";
  const sb = await db();
  let fout: string | null = "geen_gegevens";
  const code = sp.get("code"), tokenHash = sp.get("token_hash"), type = sp.get("type");
  if (code) fout = (await sb.auth.exchangeCodeForSession(code)).error?.message ?? null;
  else if (tokenHash && type) fout = (await sb.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash })).error?.message ?? null;
  const url = req.nextUrl.clone();
  url.search = "";
  if (fout) {
    url.pathname = href(lang, "/inloggen/");
    url.searchParams.set("fout", "1");
    return NextResponse.redirect(url);
  }
  await sb.rpc("site_koppel_account"); // koppelt (of herkent) de klant en bepaalt of hij direct toegang krijgt
  url.pathname = href(lang, "/mijn/");
  return NextResponse.redirect(url);
}
