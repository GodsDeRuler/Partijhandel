import Link from "next/link";
import { eur, getT, href, num, type Lang } from "@/lib/i18n";
import { itemNaam, itemSlug, type Item } from "@/lib/types";
import { AddToLijst } from "./AddToLijst";
import { ItemFoto } from "./ItemFoto";

export function Prijs({ item, lang, ingelogd }: { item: Item; lang: Lang; ingelogd: boolean }) {
  const t = getT(lang);
  if (item.prijs != null)
    return (
      <div className="price">{eur(lang, item.prijs, 2)} <small>{t("perSt")}</small>
        {item.prijs_omdoos != null && <div><small>{eur(lang, item.prijs_omdoos, 2)} {t("perOm")}</small></div>}</div>
    );
  return <Link className="lock" href={href(lang, ingelogd ? "/mijn/" : "/inloggen/")}>🔒 {t("prijsNa")}</Link>;
}

export function Card({ item, lang, ingelogd }: { item: Item; lang: Lang; ingelogd: boolean }) {
  const t = getT(lang);
  const naam = itemNaam(item, lang), slug = itemSlug(item, lang);
  const url = href(lang, `/product/${slug}/`);
  return (
    <article className="card">
      <Link href={url} className="ph" aria-label={naam} tabIndex={-1}>
        {item.nieuw ? <span className="pill nw">{t("nieuwB")}</span> : item.inlog ? <span className="pill wn">{t("alleenInlog")}</span> : null}
        {item.restant ? <span className="pill rs">{t("restant")}</span> : null}
        <ItemFoto item={item} lang={lang} />
      </Link>
      <div className="body">
        <h3><Link href={url} style={{ color: "inherit", textDecoration: "none" }}>{naam}</Link></h3>
        <Prijs item={item} lang={lang} ingelogd={ingelogd} />
        <div className="strip">
          <div><span className="k">{t("voorraad")}</span><span className="v">{num(lang, item.voorraad)}</span></div>
          <div><span className="k">{t("omdoos")}</span><span className="v">{item.omdoos ? `${item.omdoos} ${t("st")}` : "–"}</span></div>
        </div>
        {ingelogd && !item.restant && (
          <AddToLijst item={{ nr: item.nr, naam, slug, lang, omdoos: item.omdoos ?? null, pallet: item.pallet ?? null }} label={t("plus1")} doneLabel={t("toegevoegd")} />
        )}
      </div>
    </article>
  );
}
