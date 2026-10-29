import { dateTimeFmt, getT, type Lang } from "@/lib/i18n";
import type { Bericht } from "@/lib/types";
import { ActionForm } from "./ActionForm";
import { berichtAction } from "@/app/actions";

/** Gesprek bij een offerte of order: wat de klant vroeg en wat wij antwoordden. */
export function Chat({ lang, berichten, offerteId, orderNummer }: { lang: Lang; berichten: Bericht[]; offerteId?: number | null; orderNummer?: number | null }) {
  const t = getT(lang);
  return (
    <div className="chat">
      <h3 style={{ color: "var(--navy)", margin: 0 }}>{t("chatT")}</h3>
      <p className="src" style={{ margin: 0 }}>{t("chatP")}</p>
      {berichten.length > 0 && (
        <div className="msgs" aria-live="polite">
          {berichten.map(b => (
            <div key={b.id} className={`bub ${b.afzender === "klant" ? "me" : "them"}`}>
              <div style={{ whiteSpace: "pre-line" }}>{b.tekst}</div>
              <small>{b.afzender === "klant" ? t("jij") : b.naam || t("wij")} · {dateTimeFmt(lang, b.aangemaakt)}</small>
            </div>
          ))}
        </div>
      )}
      <ActionForm action={berichtAction} lang={lang} submitLabel={t("stuur")}>
        {offerteId ? <input type="hidden" name="offerte_id" value={offerteId} /> : null}
        {orderNummer ? <input type="hidden" name="order_nummer" value={orderNummer} /> : null}
        <div className="field"><label htmlFor="tekst" className="lbl">{t("chatPh")}</label><textarea id="tekst" name="tekst" rows={3} maxLength={4000} required /></div>
      </ActionForm>
    </div>
  );
}
