"use client";
import { useEffect, useState } from "react";
import { lijstLezen, LIJST_EVENT } from "@/lib/lijst";

/** Aantal artikelen op de offertelijst van deze bezoeker (staat alleen in zijn eigen browser). */
export function OfferteCount() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const upd = () => setN(lijstLezen().length);
    upd();
    window.addEventListener(LIJST_EVENT, upd);
    window.addEventListener("storage", upd);
    return () => { window.removeEventListener(LIJST_EVENT, upd); window.removeEventListener("storage", upd); };
  }, []);
  return <span className="qcount" aria-label={`${n}`}>{n}</span>;
}
