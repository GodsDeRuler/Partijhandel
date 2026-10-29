import Link from "next/link";
import { headers } from "next/headers";
import { LANGS, getT, href, type Lang } from "@/lib/i18n";
import { getMij } from "@/lib/site";
import { Flag } from "./Flag";
import { OfferteCount } from "./OfferteCount";

export async function Header({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const mij = await getMij();
  const h = await headers();
  const pad = h.get("x-path") || "/";
  const ingelogd = mij.status === "goedgekeurd";
  const nav: [string, string][] = [["home", "/"], ["partijen", "/partijen/"], ["agenda", "/agenda/"], ["over", "/over-ons/"], ["contact", "/contact/"]];
  const aantalOpen = mij.status === "goedgekeurd" ? mij.ongelezen : 0;
  return (
    <header>
      <a className="skip" href="#main">{t("naarInhoud")}</a>
      <div className="top"><div className="wrap">
        <nav aria-label={t("menu")} className="topnav">{nav.map(([k, p]) => <Link key={k} href={href(lang, p)}>{t(k)}</Link>)}</nav>
        <div className="langs">{LANGS.map(l => (
          <a key={l} href={`/taal/?naar=${l}&van=${lang}&pad=${encodeURIComponent(pad)}`} className={l === lang ? "on" : ""} title={t("taalNaam")} aria-label={l.toUpperCase()} aria-current={l === lang ? "true" : undefined} hrefLang={l} rel="nofollow"><Flag lang={l} /></a>
        ))}</div>
      </div></div>
      <div className="hdr"><div className="wrap">
        <Link href={href(lang, "/")} aria-label="Frank van de Wijgert Partijhandel"><img className="logo" src="/img/logo.png" alt="Frank van de Wijgert Partijhandel" width={280} height={40} /></Link>
        <form className="search" action={href(lang, "/partijen/")} method="get" role="search">
          <input name="q" type="search" placeholder={t("zoek")} aria-label={t("zoek")} />
          <button type="submit" aria-label={t("zoekOpdracht")}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></svg></button>
        </form>
        <div className="hdrbtns">
          <Link className="btn cy" href={href(lang, "/offertelijst/")}>{t("offerte")} <OfferteCount /></Link>
          {ingelogd
            ? <Link className="btn" href={href(lang, "/mijn/")}>{t("mijn")}{aantalOpen ? <span className="dot">{aantalOpen}</span> : null}</Link>
            : mij.status === "uitgelogd"
              ? <><Link className="btn" href={href(lang, "/klant-worden/")}>{t("klant")}</Link><Link className="btn ghost" href={href(lang, "/inloggen/")}>{t("login")}</Link></>
              : <Link className="btn" href={href(lang, "/mijn/")}>{t("mijn")}</Link>}
        </div>
      </div></div>
    </header>
  );
}
