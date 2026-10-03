import Link from "next/link";
import { getT, href, type Lang } from "@/lib/i18n";

/** Vinkje voor voorwaarden en privacybeleid; verplicht in elk formulier met persoonsgegevens. */
export function Akkoord({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const [pre, rest = ""] = t("akkoordAV").split(/<a data-r="voorwaarden">/);
  const [vw, rest2 = ""] = rest.split("</a>");
  const [mid, rest3 = ""] = rest2.split(/<a data-r="privacy">/);
  const [pv, post = ""] = rest3.split("</a>");
  return (
    <label className="akk field full" style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <input type="checkbox" name="akkoord" required style={{ width: "auto", marginTop: 4 }} />
      <span>{pre}<Link href={href(lang, "/voorwaarden/")}>{vw}</Link>{mid}<Link href={href(lang, "/privacy/")}>{pv}</Link>{post}</span>
    </label>
  );
}
