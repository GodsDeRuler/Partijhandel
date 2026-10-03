import { getT, type Lang } from "@/lib/i18n";
import legal from "@/content/legal.json";

/** Concepttekst voor privacybeleid of voorwaarden. Zolang LEGAL_FINAL niet op 1 staat, tonen we dat de tekst nog wordt nagekeken. */
export function Legal({ lang, doc }: { lang: Lang; doc: "privacy" | "voorwaarden" }) {
  const t = getT(lang);
  const final = process.env.LEGAL_FINAL === "1";
  return (
    <section className="blk"><div className="wrap">
      <article className="doc legal">
        {!final && <p className="note wn">Concept: deze tekst wordt nog door een jurist nagekeken en aangevuld. / Draft: this text is still being reviewed.</p>}
        {lang !== "nl" && <p className="note">{t("legalNL")}</p>}
        <div className="prose" dangerouslySetInnerHTML={{ __html: legal[doc] }} />
      </article>
    </div></section>
  );
}
