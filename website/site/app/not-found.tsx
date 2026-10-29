import Link from "next/link";
import { headers } from "next/headers";
import { getT, href, isLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function NotFound() {
  const h = await headers();
  const l = h.get("x-lang");
  const lang = isLang(l) ? l : "nl";
  const t = getT(lang);
  return (
    <>
      <Header lang={lang} />
      <main id="main"><section className="blk"><div className="wrap" style={{ maxWidth: 680 }}>
        <div className="box" style={{ display: "grid", gap: 14 }}>
          <h1 style={{ color: "var(--navy)", fontSize: 28 }}>404</h1>
          <p style={{ margin: 0 }}>{t("paginaNietGevonden")}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link className="btn bl" href={href(lang, "/")}>{t("terugNaarHome")}</Link><Link className="btn ghost" href={href(lang, "/partijen/")}>{t("bekijkAnder")}</Link></div>
        </div>
      </div></section></main>
      <Footer lang={lang} />
    </>
  );
}
