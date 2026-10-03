import Link from "next/link";
import { notFound } from "next/navigation";
import { dateFmt, eur, getT, href, isLang } from "@/lib/i18n";
import { rpc } from "@/lib/supabase";
import { orderStatus } from "@/lib/status";
import type { OrderRij } from "@/lib/types";

export default async function Orders({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const { data } = await rpc<OrderRij[]>("site_mijn_orders");
  const rows = data ?? [];
  return (
    <div className="box tw">
      {rows.length ? (
        <table className="t list">
          <thead><tr><th>Nr</th><th>{t("datum")}</th><th>{t("status")}</th><th style={{ textAlign: "right" }}>{t("totaalExcl")}</th><th></th></tr></thead>
          <tbody>{rows.map(o => { const s = orderStatus(t, o.status); return (
            <tr key={o.nummer}>
              <td><Link href={href(lang, `/mijn/orders/${o.nummer}/`)}>{o.nummer}</Link></td><td>{dateFmt(lang, o.datum)}</td>
              <td><span className={`st ${s.kleur}`}>{s.tekst}</span>{o.ongelezen ? <> <span className="dot">{o.ongelezen}</span></> : null}</td>
              <td style={{ textAlign: "right" }}>{eur(lang, o.prijs)}</td>
              <td><Link className="btn ghost sm" href={href(lang, `/mijn/orders/${o.nummer}/`)}>{t("bekijk2")} →</Link></td>
            </tr>); })}</tbody>
        </table>
      ) : <p style={{ margin: 0 }}>{t("niksOpen")}</p>}
    </div>
  );
}
