"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { lijstLezen, lijstSchrijven, type LijstRegel } from "@/lib/lijst";
import { offerteAanvragenAction } from "@/app/actions";

type L = Record<string, string>;
type Props = { lang: "nl" | "en" | "de"; ingelogd: boolean; land: string; adres: string; l: L; hrefs: { partijen: string; inloggen: string; mijn: string } };

/** De offertelijst van de bezoeker: aantallen per omdoos aanpassen, afhalen of bezorgen kiezen en de aanvraag versturen. */
export function OfferteLijst({ lang, ingelogd, land, adres, l, hrefs }: Props) {
  const [lijst, setLijst] = useState<LijstRegel[] | null>(null);
  const [levering, setLevering] = useState<"afhalen" | "bezorgen">("afhalen");
  const [bezorgadres, setBezorgadres] = useState(adres);
  const [bezorgland, setBezorgland] = useState(land);
  const [laadklep, setLaadklep] = useState(false);
  const [afhaal, setAfhaal] = useState("");
  const [opmerking, setOpmerking] = useState("");
  const [uitkomst, setUitkomst] = useState<{ ok: boolean; msg: string } | null>(null);
  const [bezig, start] = useTransition();
  useEffect(() => { setLijst(lijstLezen()); }, []);

  const totalen = useMemo(() => {
    const regels = lijst ?? [];
    const omdozen = regels.reduce((s, r) => s + r.omdozen, 0);
    const stuks = regels.reduce((s, r) => s + r.omdozen * (r.omdoos ?? 1), 0);
    const kanPallets = regels.length > 0 && regels.every(r => r.pallet);
    const pallets = kanPallets ? Math.ceil(regels.reduce((s, r) => s + (r.omdozen * (r.omdoos ?? 1)) / (r.pallet as number), 0)) : null;
    return { omdozen, stuks, pallets };
  }, [lijst]);

  const zet = (nr: number, omdozen: number) => {
    const nieuw = (lijst ?? []).map(r => (r.nr === nr ? { ...r, omdozen: Math.max(1, Math.min(10000, Math.round(omdozen) || 1)) } : r));
    setLijst(nieuw); lijstSchrijven(nieuw);
  };
  const weg = (nr: number) => { const nieuw = (lijst ?? []).filter(r => r.nr !== nr); setLijst(nieuw); lijstSchrijven(nieuw); };

  if (lijst === null) return <p>…</p>;
  if (uitkomst?.ok) return <div className="ok" role="status">{uitkomst.msg} <Link href={hrefs.mijn}>{l.mijn}</Link></div>;
  if (!lijst.length) return <div className="box"><p style={{ marginTop: 0 }}>{l.offerteLeegP}</p><Link className="btn bl" href={hrefs.partijen}>{l.naarPartijen}</Link></div>;

  const verstuur = () => start(async () => {
    const r = await offerteAanvragenAction({
      lang, regels: lijst.map(x => ({ artikel_nr: x.nr, omdozen: x.omdozen })), levering, adres: bezorgadres, land: bezorgland, laadklep, afhaal, opmerking,
    });
    setUitkomst({ ok: r.ok, msg: r.msg });
    if (r.ok) { setLijst([]); lijstSchrijven([]); }
  });

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="box tw">
        <table className="t">
          <thead><tr><th>{l.naam}</th><th>{l.aantalOmdozen}</th><th style={{ textAlign: "right" }}>{l.stuksTotaal}</th><th></th></tr></thead>
          <tbody>{lijst.map(r => (
            <tr key={r.nr}>
              <td className="nm"><Link href={`${r.lang === "nl" ? "" : `/${r.lang}`}/product/${r.slug}/`}>{r.naam}</Link><br /><small className="src">{l.artnr} {r.nr}{r.omdoos ? ` · ${l.omdoos}: ${r.omdoos} ${l.st}` : ""}</small></td>
              <td><div className="qty">
                <button type="button" aria-label="−" onClick={() => zet(r.nr, r.omdozen - 1)}>−</button>
                <input type="number" min={1} max={10000} value={r.omdozen} aria-label={l.aantalOmdozen} onChange={e => zet(r.nr, Number(e.target.value))} />
                <button type="button" aria-label="+" onClick={() => zet(r.nr, r.omdozen + 1)}>+</button></div></td>
              <td style={{ textAlign: "right" }}>{(r.omdozen * (r.omdoos ?? 1)).toLocaleString(lang === "nl" ? "nl-NL" : lang === "de" ? "de-DE" : "en-GB")}</td>
              <td><button type="button" className="btn ghost sm" onClick={() => weg(r.nr)}>{l.verwijder}</button></td>
            </tr>))}</tbody>
        </table>
        <div className="sumrow"><span>{lijst.length} {l.totArt}</span><span>{totalen.omdozen} {l.totOm}</span><span>{totalen.stuks.toLocaleString(lang === "nl" ? "nl-NL" : lang === "de" ? "de-DE" : "en-GB")} {l.totSt}</span>{totalen.pallets ? <span>≈ {totalen.pallets} {l.palN}</span> : null}</div>
      </div>
      {!ingelogd ? (
        <div className="note">{l.inloggenVoorOfferte} <Link href={hrefs.inloggen}>{l.login}</Link></div>
      ) : (
        <form className="box" style={{ display: "grid", gap: 14 }} onSubmit={e => { e.preventDefault(); verstuur(); }}>
          <h2 style={{ margin: 0, fontSize: 19, color: "var(--navy)" }}>{l.afhalenKiezen}</h2>
          <div className="checks" role="radiogroup" aria-label={l.lev}>
            <label><input type="radio" name="lev" checked={levering === "afhalen"} onChange={() => setLevering("afhalen")} />{l.levA}</label>
            <label><input type="radio" name="lev" checked={levering === "bezorgen"} onChange={() => setLevering("bezorgen")} />{l.levT}</label>
          </div>
          {levering === "afhalen" ? (
            <div className="field"><label htmlFor="afhaal">{l.afhaalDatum}</label><input id="afhaal" type="date" value={afhaal} onChange={e => setAfhaal(e.target.value)} /></div>
          ) : (
            <div className="form">
              <p className="src" style={{ gridColumn: "1/-1", margin: 0 }}>{l.levTP}</p>
              <div className="field full"><label htmlFor="ba">{l.adres}</label><textarea id="ba" rows={2} required value={bezorgadres} onChange={e => setBezorgadres(e.target.value)} /></div>
              <div className="field"><label htmlFor="bl">{l.landL}</label><input id="bl" required value={bezorgland} onChange={e => setBezorgland(e.target.value)} /></div>
              <label className="akk" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={laadklep} onChange={e => setLaadklep(e.target.checked)} />{l.klep}</label>
            </div>
          )}
          <div className="field"><label htmlFor="opm">{l.opmerkingL}</label><textarea id="opm" rows={2} value={opmerking} onChange={e => setOpmerking(e.target.value)} maxLength={2000} /></div>
          {uitkomst && !uitkomst.ok && <p className="err" role="alert">{uitkomst.msg}</p>}
          <div><button className="btn bl" type="submit" disabled={bezig}>{l.verstuur}</button></div>
        </form>
      )}
    </div>
  );
}
