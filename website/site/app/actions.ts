"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, need, rpc, rpcAnon } from "@/lib/supabase";
import { turnstileOk } from "@/lib/turnstile";
import { getT, href, isLang, type Lang } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import type { FormState } from "@/components/ActionForm";

const langOf = (fd: FormData): Lang => { const l = String(fd.get("lang") ?? "nl"); return isLang(l) ? l : "nl"; };
const str = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
/** "1.234,50", "1234,50" en "1234.50" worden allemaal 1234.5 */
function parseBedrag(v: string): number {
  let s = v.replace(/[€\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return Number(s);
}
const MAILRE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Vertaalt een databasefout (de tekst die de functie met "raise exception" meegeeft) naar een melding in de taal van de bezoeker. */
function fout(lang: Lang, code: string | null): string {
  const t = getT(lang);
  const c = (code ?? "").split(":")[0];
  const map: Record<string, string> = {
    ongeldig_mailadres: "mailOngeldig", kvk_of_btw_nodig: "kvkOfBtw", gegevens_ontbreken: "gegevensNodig", kies_categorie: "kiesCat", tekst_nodig: "gegevensNodig",
    te_vaak: "teVaak", te_druk: "teVaak", geen_toegang: "fout_geen_toegang", niet_beschikbaar: "fout_niet_beschikbaar", te_weinig_voorraad: "fout_te_weinig_voorraad",
    ongeldig_bedrag: "bodNodig", leeg_bericht: "berichtLeeg",
  };
  if (c === "geheim_onjuist" || c === "onbekend_formulier") console.error("site_formulier:", c); // instelling fout, niet de bezoeker
  return t(map[c] ?? "algFout");
}

/* ---------- formulieren van bezoekers (alleen met het gedeelde geheim) ---------- */
export async function formulierAction(soort: "aanmelding" | "contact" | "partij_aanbieden" | "handel_alert", _prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd), t = getT(lang);
  if (fd.get("akkoord") !== "on") return { ok: false, msg: t("akkoordNodig") };
  if (!(await turnstileOk(fd.get("cf-turnstile-response")))) return { ok: false, msg: t("spamFout") };
  const email = str(fd, "email", 200).toLowerCase();
  if (!MAILRE.test(email)) return { ok: false, msg: t("mailOngeldig") };
  const p: Record<string, unknown> = { email, taal: lang.toUpperCase(), naam: str(fd, "naam", 160), bedrijf: str(fd, "bedrijf", 200), telefoon: str(fd, "telefoon", 60) };
  if (soort === "aanmelding") {
    if (!p.bedrijf || !p.naam) return { ok: false, msg: t("gegevensNodig") };
    Object.assign(p, { land: str(fd, "land", 80), plaats: str(fd, "plaats", 100), adres: str(fd, "adres", 200), postcode: str(fd, "postcode", 20), kvk_nr: str(fd, "kvk_nr", 40), btw_nr: str(fd, "btw_nr", 40), branche: str(fd, "branche", 30), interesses: fd.getAll("interesses").map(String).slice(0, 40) });
    if (!p.kvk_nr && !p.btw_nr) return { ok: false, msg: t("kvkOfBtw") };
  } else if (soort === "contact") {
    p.tekst = str(fd, "tekst", 4000);
    if (!p.tekst || !p.naam) return { ok: false, msg: t("gegevensNodig") };
  } else if (soort === "partij_aanbieden") {
    p.tekst = str(fd, "omschrijving", 4000);
    Object.assign(p, { omschrijving: p.tekst, hoeveelheid: str(fd, "hoeveelheid", 200), prijsidee: str(fd, "prijsidee", 200), link: str(fd, "link", 500) });
    if (!p.tekst || !p.bedrijf) return { ok: false, msg: t("gegevensNodig") };
  } else {
    p.interesses = fd.getAll("interesses").map(String).slice(0, 40);
    if (!(p.interesses as string[]).length) return { ok: false, msg: t("alertKies") };
  }
  const { error } = await rpcAnon("site_formulier", { p_geheim: need("WEBSITE_FORM_SECRET"), p_soort: soort, p });
  if (error) return { ok: false, msg: fout(lang, error) };
  const ok = { aanmelding: "klantOk", contact: "contactOk", partij_aanbieden: "aanbiedenOk", handel_alert: "alertOk" }[soort];
  return { ok: true, msg: soort === "aanmelding" ? t("klantOk") : t(ok) };
}

/* ---------- inloggen met een link per mail ---------- */
export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd), t = getT(lang);
  const email = str(fd, "email", 200).toLowerCase();
  if (!MAILRE.test(email)) return { ok: false, msg: t("mailOngeldig") };
  if (!(await turnstileOk(fd.get("cf-turnstile-response")))) return { ok: false, msg: t("spamFout") };
  const sb = await db();
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${SITE_URL}/auth/callback/?lang=${lang}` } });
  if (error) { console.error("signInWithOtp:", error.message); return { ok: false, msg: t("loginFout") }; }
  return { ok: true, msg: t("loginVerstuurd", { email }) };
}
export async function logoutAction(fd: FormData) {
  const lang = langOf(fd);
  const sb = await db();
  await sb.auth.signOut();
  revalidatePath("/", "layout");
  redirect(href(lang, "/"));
}

/* ---------- offerte aanvragen, bieden, akkoord, berichten, gegevens (alleen ingelogd en goedgekeurd) ---------- */
export type AanvraagInput = { lang: Lang; regels: { artikel_nr: number; omdozen: number }[]; levering: "afhalen" | "bezorgen"; adres: string; land: string; laadklep: boolean; afhaal: string; opmerking: string };
export async function offerteAanvragenAction(inp: AanvraagInput): Promise<FormState & { nummer?: number }> {
  const lang = isLang(inp.lang) ? inp.lang : "nl", t = getT(lang);
  const regels = (Array.isArray(inp.regels) ? inp.regels : []).filter(r => Number.isInteger(r.artikel_nr) && Number.isInteger(r.omdozen) && r.omdozen > 0).slice(0, 100);
  if (!regels.length) return { ok: false, msg: t("offerteLeegP") };
  const afhaal = /^\d{4}-\d{2}-\d{2}$/.test(inp.afhaal) ? inp.afhaal : null;
  const { data, error } = await rpc<{ id: number; nummer: number }>("site_offerte_aanvragen", {
    p_regels: regels, p_levering: inp.levering === "bezorgen" ? "bezorgen" : "afhalen", p_adres: inp.adres?.slice(0, 400) || null, p_land: inp.land?.slice(0, 80) || null,
    p_laadklep: inp.levering === "bezorgen" ? !!inp.laadklep : null, p_afhaal: afhaal, p_opmerking: inp.opmerking?.slice(0, 2000) || null,
  });
  if (error || !data) return { ok: false, msg: fout(lang, error) };
  revalidatePath("/", "layout");
  return { ok: true, msg: t("aanvraagOk", { nummer: data.nummer }), nummer: data.nummer };
}

export async function bodAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd), t = getT(lang);
  const nr = Number(fd.get("artikel_nr")), bedrag = parseBedrag(String(fd.get("bedrag") ?? ""));
  if (!Number.isInteger(nr) || !(bedrag > 0)) return { ok: false, msg: t("bodNodig") };
  const { error } = await rpc("site_bod_plaatsen", { p_artikel: nr, p_bedrag: bedrag, p_opmerking: str(fd, "opmerking", 2000) || null });
  if (error) return { ok: false, msg: fout(lang, error) };
  revalidatePath("/", "layout");
  return { ok: true, msg: t("bodOk") };
}

export async function accepterenAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd), t = getT(lang);
  const id = Number(fd.get("offerte_id")), naam = str(fd, "naam", 120);
  if (!Number.isInteger(id) || !naam) return { ok: false, msg: t("gegevensNodig") };
  const { error } = await rpc("site_offerte_accepteren", { p_id: id, p_naam: naam });
  if (error) return { ok: false, msg: error.startsWith("niet_te_accepteren") || error.startsWith("niet_gevonden") ? t("akkoordFout") : fout(lang, error) };
  revalidatePath("/", "layout");
  return { ok: true, msg: t("akkoordOkMsg") };
}

export async function berichtAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd), t = getT(lang);
  const tekst = str(fd, "tekst", 4000);
  if (!tekst) return { ok: false, msg: t("berichtLeeg") };
  const offerte = fd.get("offerte_id") ? Number(fd.get("offerte_id")) : null, order = fd.get("order_nummer") ? Number(fd.get("order_nummer")) : null;
  const { error } = await rpc("site_bericht_sturen", { p_offerte: offerte, p_order: order, p_tekst: tekst });
  if (error) return { ok: false, msg: fout(lang, error) === t("algFout") ? t("berichtFout") : fout(lang, error) };
  revalidatePath("/", "layout");
  return { ok: true, msg: t("berichtVerstuurd") };
}

export async function gegevensAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const lang = langOf(fd), t = getT(lang);
  const { error } = await rpc("site_gegevens_bijwerken", { p_telefoon: str(fd, "telefoon", 60), p_contactpersoon: str(fd, "contactpersoon", 120), p_taal: str(fd, "taal", 2), p_interesses: fd.getAll("interesses").map(String).slice(0, 40) });
  if (error) return { ok: false, msg: t("gegevensFout") };
  revalidatePath("/", "layout");
  return { ok: true, msg: t("gegevensOpgeslagen") };
}
