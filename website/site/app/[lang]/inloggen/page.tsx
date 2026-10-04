import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getT, href, isLang } from "@/lib/i18n";
import { getMij } from "@/lib/site";
import { ActionForm } from "@/components/ActionForm";
import { Veld } from "@/components/Veld";
import { loginAction } from "@/app/actions";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLang(lang) ? getT(lang)("login") : "Inloggen", robots: { index: false } };
}

export default async function Inloggen({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ fout?: string }> }) {
  const { lang } = await params, sp = await searchParams;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const mij = await getMij();
  if (mij.status === "goedgekeurd") redirect(href(lang, "/mijn/"));
  return (
    <section className="blk"><div className="wrap" style={{ maxWidth: 560 }}>
      <div className="box" style={{ display: "grid", gap: 14 }}>
        <h1 style={{ color: "var(--navy)", fontWeight: 800, textTransform: "uppercase", fontSize: 26 }}>{t("loginTitel")}</h1>
        <p style={{ margin: 0 }}>{t("loginP")}</p>
        {sp.fout && <p className="err">{t("loginFout")}</p>}
        {mij.status !== "uitgelogd" && <p className="note">{mij.status === "aangevraagd" ? t("stAangevraagd") : mij.status === "geblokkeerd" ? t("stGeblokkeerd") : t("stOnbekend")}</p>}
        <ActionForm action={loginAction} lang={lang} submitLabel={t("stuurLink")} turnstile hideOnOk>
          <Veld id="email" label={t("email")} type="email" required autoComplete="email" />
        </ActionForm>
        <p style={{ margin: 0 }}>{t("loginNog")} <Link href={href(lang, "/klant-worden/")}>{t("loginNogLink")}</Link></p>
      </div>
    </div></section>
  );
}
