import Link from "next/link";
import { getT, href, type Lang } from "@/lib/i18n";

export function Footer({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const alg = lang === "de" ? "Allgemein" : lang === "en" ? "General" : "Algemeen";
  const service = lang === "de" ? "Kundenservice" : lang === "en" ? "Customer service" : "Klantenservice";
  return (
    <footer>
      <div className="wrap">
        <div><h4>Contact</h4><p>Rheastraat 19<br />5047 TL Tilburg<br />+31 (0)13 57 11 75 5<br />info@fvdwpartijhandel.nl</p></div>
        <div><h4>{alg}</h4>
          <Link href={href(lang, "/")}>{t("home")}</Link><Link href={href(lang, "/partijen/")}>{t("partijen")}</Link><Link href={href(lang, "/over-ons/")}>{t("over")}</Link><Link href={href(lang, "/agenda/")}>{t("agenda")}</Link><Link href={href(lang, "/contact/")}>{t("contact")}</Link></div>
        <div><h4>{service}</h4>
          <Link href={href(lang, "/klant-worden/")}>{t("klant")}</Link><Link href={href(lang, "/inloggen/")}>{t("login")}</Link><Link href={href(lang, "/offertelijst/")}>{t("offerte")}</Link><Link href={href(lang, "/voorwaarden/")}>{t("voorw")}</Link><Link href={href(lang, "/privacy/")}>{t("privacy")}</Link></div>
        <div className="panel b" style={{ borderRadius: 25 }}><h4 style={{ margin: 0 }}>{t("alertT")}</h4><p>{t("alertP")}</p><Link className="btn cy sm" href={href(lang, "/handel-alert/")}>{t("alertB")}</Link></div>
      </div>
      <div className="copy"><div className="wrap">© {new Date().getFullYear()} Frank van de Wijgert Partijhandel · {t("cookieNoot")}</div></div>
      <a className="wa" href="https://wa.me/31618306148" rel="noopener" target="_blank" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4Z" /></svg>WhatsApp</a>
    </footer>
  );
}
