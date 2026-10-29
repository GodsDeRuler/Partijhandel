import { SITE_URL } from "./site";
import { getT, href, isLang, type Lang } from "./i18n";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const nl2br = (s: unknown) => esc(s).replace(/\n/g, "<br>");

export type Melding = {
  id: number; soort: "vraag_klant" | "antwoord" | "aanvraag" | "akkoord" | "formulier";
  klant?: string; klant_email?: string; taal?: string; tekst?: string; offerte_id?: number; offerte_nummer?: number; order_nummer?: number;
  offerte_soort?: string; bod_bedrag?: number; levering?: string; regels?: { omschrijving: string; aantal: number }[]; akkoord_naam?: string;
  formulier?: string; naam?: string; bedrijf?: string; email?: string; telefoon?: string; data?: Record<string, unknown>;
};
export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

function wrap(inhoud: string, lang: Lang): string {
  return `<!doctype html><html><body style="margin:0;background:#F6FAFE;font-family:Montserrat,Arial,sans-serif;color:#0B1730"><div style="max-width:620px;margin:0 auto;padding:20px">
  <div style="background:#fff;border:1px solid #D5E4F2;border-radius:14px;padding:22px;line-height:1.55">${inhoud}</div>
  <p style="font-size:12px;color:#4F5F7A;margin:14px 4px">Frank van de Wijgert Partijhandel · Rheastraat 19, 5047 TL Tilburg · <a href="${SITE_URL}${href(lang, "/")}" style="color:#0060F0">${SITE_URL.replace(/^https?:\/\//, "")}</a></p></div></body></html>`;
}

/** Bouwt de mails bij één melding uit de wachtrij. Interne meldingen gaan naar het info-adres, berichten voor de klant naar de klant. */
export function mailsVoor(m: Melding, infoMail: string): Mail[] {
  const lang: Lang = isLang((m.taal || "").toLowerCase()) ? ((m.taal as string).toLowerCase() as Lang) : "nl";
  const t = getT(lang);
  const nr = m.offerte_nummer ?? m.offerte_id;
  const doc = m.offerte_id ? `offerte ${nr}` : m.order_nummer ? `order ${m.order_nummer}` : "";
  const mijn = `${SITE_URL}${href(lang, m.offerte_id ? `/mijn/offertes/${m.offerte_id}/` : m.order_nummer ? `/mijn/orders/${m.order_nummer}/` : "/mijn/")}`;
  const knop = (url: string, label: string) => `<p><a href="${esc(url)}" style="background:#0E2B5D;color:#fff;text-decoration:none;padding:10px 20px;border-radius:30px;display:inline-block;font-weight:600">${esc(label)}</a></p>`;
  switch (m.soort) {
    case "vraag_klant":
      return [{ to: infoMail, subject: `Vraag van ${m.klant} bij ${doc}`, replyTo: m.klant_email || undefined,
        html: wrap(`<h2 style="margin-top:0">Vraag van ${esc(m.klant)}</h2><p>Bij ${esc(doc)}:</p><blockquote style="border-left:4px solid #4BD7E3;margin:0;padding:4px 14px">${nl2br(m.tekst)}</blockquote><p>Antwoord in het Salesbureau (Verkoop, Berichten), dan staat het meteen bij de klant.</p>`, "nl"),
        text: `Vraag van ${m.klant} bij ${doc}:\n\n${m.tekst}\n\nAntwoord in het Salesbureau (Verkoop, Berichten).` }];
    case "antwoord":
      if (!m.klant_email) return [];
      return [{ to: m.klant_email, subject: t("mailAntwoordOnderwerp", { doc }), replyTo: infoMail,
        html: wrap(`<h2 style="margin-top:0">${esc(t("mailAntwoordKop"))}</h2><blockquote style="border-left:4px solid #4BD7E3;margin:0;padding:4px 14px">${nl2br(m.tekst)}</blockquote>${knop(mijn, t("mailBekijk"))}`, lang),
        text: `${t("mailAntwoordKop")}\n\n${m.tekst}\n\n${t("mailBekijk")}: ${mijn}` }];
    case "aanvraag": {
      const regels = (m.regels ?? []).map(r => `${r.aantal} × ${r.omschrijving}`);
      const bod = m.offerte_soort === "bod";
      const intern: Mail = { to: infoMail, subject: `${bod ? "Bod" : "Nieuwe offerteaanvraag"} van ${m.klant} (offerte ${nr})`, replyTo: m.klant_email || undefined,
        html: wrap(`<h2 style="margin-top:0">${bod ? "Bod op een hele partij" : "Nieuwe offerteaanvraag"}</h2><p><b>${esc(m.klant)}</b> · offerte ${esc(nr)}${m.levering ? ` · ${esc(m.levering)}` : ""}</p><ul>${regels.map(r => `<li>${esc(r)}</li>`).join("")}</ul><p>Open de offerte in het Salesbureau (Website, Offertes via site).</p>`, "nl"),
        text: `${bod ? "Bod" : "Aanvraag"} van ${m.klant}, offerte ${nr}\n${regels.join("\n")}` };
      const klant: Mail[] = m.klant_email ? [{ to: m.klant_email, subject: t("mailOntvangenOnderwerp", { nr: nr ?? "" }), replyTo: infoMail,
        html: wrap(`<h2 style="margin-top:0">${esc(t("mailOntvangenKop"))}</h2><p>${esc(t("mailOntvangenTekst", { nr: nr ?? "" }))}</p>${knop(mijn, t("mailBekijk"))}`, lang),
        text: `${t("mailOntvangenKop")}\n${t("mailOntvangenTekst", { nr: nr ?? "" })}\n${mijn}` }] : [];
      return [intern, ...klant];
    }
    case "akkoord":
      return [{ to: infoMail, subject: `${m.klant} is akkoord met offerte ${nr}`,
        html: wrap(`<h2 style="margin-top:0">Online akkoord</h2><p><b>${esc(m.klant)}</b> heeft offerte ${esc(nr)} online geaccepteerd (${esc(m.akkoord_naam)}).</p><p>Zet de offerte in het Salesbureau om naar een order (Website, Offertes via site).</p>`, "nl"),
        text: `${m.klant} is akkoord met offerte ${nr} (${m.akkoord_naam}). Zet om naar order in het Salesbureau.` }];
    case "formulier": {
      const d = Object.entries(m.data ?? {}).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length));
      return [{ to: infoMail, subject: `Website: ${m.formulier} van ${m.bedrijf || m.naam || m.email}`, replyTo: m.email || undefined,
        html: wrap(`<h2 style="margin-top:0">Formulier: ${esc(m.formulier)}</h2><p>${esc(m.naam)}${m.bedrijf ? `, ${esc(m.bedrijf)}` : ""}<br>${esc(m.email)}${m.telefoon ? `<br>${esc(m.telefoon)}` : ""}</p>${m.tekst ? `<blockquote style="border-left:4px solid #4BD7E3;margin:0;padding:4px 14px">${nl2br(m.tekst)}</blockquote>` : ""}<ul>${d.map(([k, v]) => `<li>${esc(k)}: ${esc(Array.isArray(v) ? v.join(", ") : v)}</li>`).join("")}</ul><p>Afhandelen in het Salesbureau (Website, Formulieren).</p>`, "nl"),
        text: `Formulier ${m.formulier} van ${m.naam} ${m.bedrijf ?? ""} <${m.email}>\n${m.tekst ?? ""}\n${d.map(([k, v]) => `${k}: ${v}`).join("\n")}` }];
    }
    default: return [];
  }
}

export async function verstuur(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY ontbreekt");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM || "Frank van de Wijgert Partijhandel <info@fvdwpartijhandel.nl>", to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
