import Link from "next/link";
import { notFound } from "next/navigation";
import { dateFmt, eur, getT, href, isLang } from "@/lib/i18n";
import { rpc } from "@/lib/supabase";
import { getMij } from "@/lib/site";
import { offerteOpen, offerteStatus, orderStatus } from "@/lib/status";
import type { OfferteRij, OrderRij } from "@/lib/types";

export default async function Overzicht({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const mij = await getMij();
  if (mij.status !== "goedgekeurd") return null;
  const [off, ord] = await Promise.all([rpc<OfferteRij[]>("site_mijn_offertes"), rpc<OrderRij[]>("site_mijn_orders")]);
  const offertes = (off.data ?? []).filter(offerteOpen);
  const orders = (ord.data ?? []).filter(o => orderStatus(t, o.status).open);
  const leeg = !offertes.length && !orders.length;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {mij.openstaand > 0 && (
        <Link className="box" href={href(lang, "/mijn/openstaand/")} style={{ textDecoration: "none", color: "inherit", display: "grid", gap: 4 }}>
          <span className="lbl" style={{ color: "var(--muted)" }}>{t("nogOpenstaand")}</span>
          <b className="num" style={{ color: "var(--navy)", fontSize: 24 }}>{eur(lang, mij.openstaand)}</b><span className="rowlink">{t("mijnOpenstaand")} →</span>
        </Link>
      )}
      <h2 style={{ fontSize: 19, color: "var(--navy)", margin: 0 }}>{t("open2")}</h2>
      {leeg ? <div className="box"><p style={{ margin: 0 }}>{t("niksOpen")}</p></div> : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
          {offertes.map(o => { const s = offerteStatus(t, o); return (
            <Link key={`o${o.id}`} href={href(lang, `/mijn/offertes/${o.id}/`)} className="box" style={{ display: "grid", gap: 8, textDecoration: "none", color: "inherit" }}>
              <span className="lbl" style={{ color: "var(--muted)" }}>{t("docOff")} {o.nummer ?? o.id} · {dateFmt(lang, o.datum)}</span>
              <span><span className={`st ${s.kleur}`}>{s.tekst}</span>{o.ongelezen ? <> <span className="dot">{o.ongelezen}</span></> : null}</span>
              <b className="num" style={{ color: "var(--navy)" }}>{o.soort === "bod" ? eur(lang, o.bod_bedrag) : eur(lang, o.totaal)}</b><span className="rowlink">{t("bekijk2")} →</span>
            </Link>); })}
          {orders.map(o => { const s = orderStatus(t, o.status); return (
            <Link key={`r${o.nummer}`} href={href(lang, `/mijn/orders/${o.nummer}/`)} className="box" style={{ display: "grid", gap: 8, textDecoration: "none", color: "inherit" }}>
              <span className="lbl" style={{ color: "var(--muted)" }}>{t("docOrd")} {o.nummer} · {dateFmt(lang, o.datum)}</span>
              <span><span className={`st ${s.kleur}`}>{s.tekst}</span>{o.ongelezen ? <> <span className="dot">{o.ongelezen}</span></> : null}</span>
              {s.uitleg && <span>{s.uitleg}</span>}<span className="rowlink">{t("bekijk2")} →</span>
            </Link>); })}
        </div>
      )}
    </div>
  );
}
