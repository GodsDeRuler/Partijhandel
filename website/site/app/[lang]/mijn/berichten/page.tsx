import Link from "next/link";
import { notFound } from "next/navigation";
import { dateFmt, getT, href, isLang } from "@/lib/i18n";
import { rpc } from "@/lib/supabase";
import type { OfferteRij, OrderRij } from "@/lib/types";

export default async function Berichten({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const [off, ord] = await Promise.all([rpc<OfferteRij[]>("site_mijn_offertes"), rpc<OrderRij[]>("site_mijn_orders")]);
  const items = [
    ...(off.data ?? []).map(o => ({ k: `o${o.id}`, url: `/mijn/offertes/${o.id}/`, titel: t("offerteNr", { nr: o.nummer ?? o.id }), datum: o.datum, ongelezen: o.ongelezen })),
    ...(ord.data ?? []).map(o => ({ k: `r${o.nummer}`, url: `/mijn/orders/${o.nummer}/`, titel: t("orderNr", { nr: o.nummer }), datum: o.datum, ongelezen: o.ongelezen })),
  ].sort((a, b) => b.ongelezen - a.ongelezen || b.datum.localeCompare(a.datum)).slice(0, 60);
  return (
    <div className="box">
      <p className="src" style={{ marginTop: 0 }}>{t("chatP")}</p>
      {items.length ? (
        <div style={{ display: "grid", gap: 8 }}>{items.map(i => (
          <Link key={i.k} href={href(lang, i.url)} className="box" style={{ display: "flex", justifyContent: "space-between", gap: 8, textDecoration: "none", color: "inherit", padding: "12px 16px" }}>
            <span><b>{i.titel}</b> <span className="src">· {dateFmt(lang, i.datum)}</span></span>{i.ongelezen ? <span className="dot">{i.ongelezen}</span> : <span className="rowlink">→</span>}
          </Link>
        ))}</div>
      ) : <p style={{ margin: 0 }}>{t("geenGesprekken")}</p>}
    </div>
  );
}
