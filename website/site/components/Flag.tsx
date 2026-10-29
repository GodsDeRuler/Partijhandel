import type { Lang } from "@/lib/i18n";

export function Flag({ lang }: { lang: Lang }) {
  if (lang === "nl")
    return (<svg viewBox="0 0 28 19" aria-hidden="true"><rect width="28" height="19" fill="#fff" /><rect width="28" height="6.33" fill="#AE1C28" /><rect y="12.67" width="28" height="6.33" fill="#21468B" /></svg>);
  if (lang === "de")
    return (<svg viewBox="0 0 28 19" aria-hidden="true"><rect width="28" height="19" fill="#FFCE00" /><rect width="28" height="6.33" fill="#000" /><rect y="6.33" width="28" height="6.33" fill="#DD0000" /></svg>);
  return (
    <svg viewBox="0 0 28 19" aria-hidden="true"><rect width="28" height="19" fill="#012169" />
      <path d="M0 0L28 19M28 0L0 19" stroke="#fff" strokeWidth="3.4" /><path d="M0 0L28 19M28 0L0 19" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M14 0V19M0 9.5H28" stroke="#fff" strokeWidth="6" /><path d="M14 0V19M0 9.5H28" stroke="#C8102E" strokeWidth="3.4" /></svg>
  );
}
