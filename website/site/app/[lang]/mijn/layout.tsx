import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getT, href, isLang } from "@/lib/i18n";
import { getMij } from "@/lib/site";
import { logoutAction } from "@/app/actions";
import { MijnTabs } from "@/components/MijnTabs";

export const metadata = { robots: { index: false, follow: false } };

export default async function MijnLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const mij = await getMij();
  if (mij.status === "uitgelogd") redirect(href(lang, "/inloggen/"));
  if (mij.status !== "goedgekeurd") {
    return (
      <section className="blk"><div className="wrap" style={{ maxWidth: 680 }}>
        <div className="box" style={{ display: "grid", gap: 14 }}>
          <h1 style={{ color: "var(--navy)", fontSize: 26 }}>{t("mijn")}</h1>
          <p className="note">{mij.status === "aangevraagd" ? t("stAangevraagd") : mij.status === "geblokkeerd" ? t("stGeblokkeerd") : t("stOnbekend")}</p>
          {mij.status === "onbekend" && <div><Link className="btn bl" href={href(lang, "/klant-worden/")}>{t("klant")}</Link></div>}
          {"email" in mij && mij.email ? <p className="src">{t("ingelogdAls", { email: mij.email })}</p> : null}
          <form action={logoutAction}><input type="hidden" name="lang" value={lang} /><button className="btn ghost sm" type="submit">{t("uitloggen")}</button></form>
        </div>
      </div></section>
    );
  }
  return (
    <section className="blk"><div className="wrap">
      <div className="sh">
        <div><h1 style={{ fontSize: 26, fontWeight: 800, textTransform: "uppercase", color: "var(--navy)" }}>{t("welkomNaam", { naam: mij.naam })}</h1><p>{t("ingelogdAls", { email: mij.email })}</p></div>
        <form action={logoutAction}><input type="hidden" name="lang" value={lang} /><button className="btn ghost sm" type="submit">{t("uitloggen")}</button></form>
      </div>
      <MijnTabs lang={lang} ongelezen={mij.ongelezen} />
      {children}
    </div></section>
  );
}
