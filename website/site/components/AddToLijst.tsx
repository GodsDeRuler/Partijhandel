"use client";
import { useEffect, useState } from "react";
import { lijstLezen, lijstToevoegen, LIJST_EVENT, type LijstRegel } from "@/lib/lijst";

type Props = { item: Omit<LijstRegel, "omdozen">; label: string; doneLabel: string; className?: string; stop?: boolean };

/** Zet 1 omdoos van dit artikel op de offertelijst. */
export function AddToLijst({ item, label, doneLabel, className = "btn bl sm", stop }: Props) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const upd = () => setN(lijstLezen().find(r => r.nr === item.nr)?.omdozen ?? 0);
    upd();
    window.addEventListener(LIJST_EVENT, upd);
    return () => window.removeEventListener(LIJST_EVENT, upd);
  }, [item.nr]);
  return (
    <button type="button" className={className} onClick={e => { if (stop) e.stopPropagation(); lijstToevoegen(item, 1); }}>
      {n > 0 ? `${doneLabel} (${n})` : label}
    </button>
  );
}
