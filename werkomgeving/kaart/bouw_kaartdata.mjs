// Bouwt de kaartlagen voor het Kaart-paneel van het Salesbureau (kaartdata.json) uit Natural Earth (publiek domein) en world-atlas.
// Gebruik: node bouw_kaartdata.mjs <map met bronbestanden> <uitvoer.json>
// Bronnen: world-atlas countries-50m.json en countries-10m.json; Natural Earth ne_10m_admin_1_states_provinces_lines, ne_10m_lakes, ne_10m_rivers_lake_centerlines, ne_10m_urban_areas (geojson).
// Elke laag is een SVG-pad in kaarteenheden x100 (wereld = 100.000 breed), met relatieve lijnstukken; de pagina tekent ze met scale(.01).
import fs from "node:fs";
const [dir, uit] = process.argv.slice(2);
const rd = f => JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
const MW = 1000;
const mx = lon => (lon + 180) / 360 * MW;
const my = lat => { const l = Math.max(-85, Math.min(85, lat)) * Math.PI / 180; return (1 - Math.log(Math.tan(Math.PI / 4 + l / 2)) / Math.PI) / 2 * MW; };
const EU = { lon1: -25, lon2: 45, lat1: 33, lat2: 72 }, KERN = { lon1: -12, lon2: 32, lat1: 35, lat2: 61 };
const binnen = (b, lon, lat) => lon >= b.lon1 && lon <= b.lon2 && lat >= b.lat1 && lat <= b.lat2;
function dp(pts, tol) { // Douglas-Peucker, iteratief
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]], t2 = tol * tol;
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) { const [px, py] = pts[i]; let d; if (!l2) d = (px - ax) ** 2 + (py - ay) ** 2; else { const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)); d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2; } if (d > md) { md = d; mi = i; } }
    if (md > t2) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function padU(delen, sluit) { // delen in kaarteenheden
  let out = "";
  for (const d of delen) {
    if (d.length < 2) continue;
    const q = d.map(([x, y]) => [Math.round(x * 100), Math.round(y * 100)]);
    out += `M${q[0][0]} ${q[0][1]}l`; let px = q[0][0], py = q[0][1], eerste = true;
    for (let i = 1; i < q.length; i++) { const dx = q[i][0] - px, dy = q[i][1] - py; if (!dx && !dy) continue; out += (eerste ? "" : " ") + dx + " " + dy; eerste = false; px = q[i][0]; py = q[i][1]; }
    if (eerste) out = out.slice(0, out.lastIndexOf("M")); else if (sluit) out += "z";
  }
  return out;
}
function topoLanden(t, obj) { // geeft [{naam, ringen}] terug
  const [sx, sy] = t.transform.scale, [tx, ty] = t.transform.translate;
  const arcs = t.arcs.map(a => { let x = 0, y = 0; return a.map(p => { x += p[0]; y += p[1]; return [x * sx + tx, y * sy + ty]; }); });
  const ring = idx => { const pts = []; idx.forEach(i => { const a = i >= 0 ? arcs[i] : arcs[~i].slice().reverse(); pts.push(...(pts.length ? a.slice(1) : a)); }); return pts; };
  return obj.geometries.filter(g => g.arcs).map(g => ({ naam: (g.properties && g.properties.name) || "", ringen: (g.type === "Polygon" ? [g.arcs] : g.arcs).flatMap(p => p.map(r => ring(r))) }));
}
const midden = l => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; l.ringen.forEach(r => r.forEach(([lo, la]) => { a = Math.min(a, lo); b = Math.max(b, lo); c = Math.min(c, la); d = Math.max(d, la); })); return [(a + b) / 2, (c + d) / 2, b - a]; };
function splitsRing(pts, tol, regio) { // vereenvoudig een ring en breek af bij de datumgrens; ringen buiten de regio vallen weg
  if (regio && !pts.some(([lo, la]) => binnen(regio, lo, la))) return [];
  const delen = []; let cur = [];
  pts.forEach((q, i) => { if (i && Math.abs(q[0] - pts[i - 1][0]) > 180) { delen.push(cur); cur = []; } cur.push(q); });
  delen.push(cur);
  return delen.map(d => dp(d.map(([lo, la]) => [mx(lo), my(la)]), tol)).filter(d => d.length > 3);
}
const lagen = {};
const maat = {};
// Landen die in Europa en rond de Middellandse Zee in 10m worden getekend (zoomniveau Europa en dichterbij); de rest blijft 50m.
const DETAIL = { lon1: -25, lon2: 45, lat1: 18, lat2: 72 };
const t10 = topoLanden(rd("c10.json"), rd("c10.json").objects.countries);
const inDetail = l => { const [lo, la, br] = midden(l); return br < 180 && lo >= -25 && lo <= 44 && la >= 20 && la <= 72 && l.naam !== "Russia" && l.naam !== "Antarctica"; };
const namen = new Set(t10.filter(inDetail).map(l => l.naam));
lagen.land10 = padU(t10.filter(l => namen.has(l.naam)).flatMap(l => l.ringen.flatMap(r => splitsRing(r, 0.009, DETAIL))), true);
{
  const t = rd("c50.json"), l50 = topoLanden(t, t.objects.countries).filter(l => l.naam !== "Antarctica");
  lagen.landRest = padU(l50.filter(l => !namen.has(l.naam)).flatMap(l => l.ringen.flatMap(r => splitsRing(r, 0.035))), true);
  lagen.land50eu = padU(l50.filter(l => namen.has(l.naam)).flatMap(l => l.ringen.flatMap(r => splitsRing(r, 0.035))), true);
}
// lijnen en vlakken uit geojson
function lijnen(f, tol, regio, filter = () => true) {
  const j = rd(f), delen = [];
  for (const ft of j.features) {
    if (!filter(ft.properties)) continue;
    const g = ft.geometry; if (!g) continue;
    const ls = g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
    for (const l of ls) { let cur = []; for (const q of l) { if (binnen(regio, q[0], q[1])) cur.push(q); else { if (cur.length > 1) delen.push(cur); cur = []; } } if (cur.length > 1) delen.push(cur); }
  }
  return padU(delen.map(d => dp(d.map(([lo, la]) => [mx(lo), my(la)]), tol)), false);
}
function vlakken(f, tol, regio, filter = () => true) {
  const j = rd(f), delen = [];
  for (const ft of j.features) {
    if (!filter(ft.properties)) continue;
    const g = ft.geometry; if (!g) continue;
    const ps = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (const p of ps) for (const r of p) { if (!r.some(q => binnen(regio, q[0], q[1]))) continue; const d = dp(r.map(([lo, la]) => [mx(lo), my(la)]), tol); if (d.length > 3) delen.push(d); }
  }
  return padU(delen, true);
}
lagen.prov = lijnen("ne_10m_admin_1_states_provinces_lines.geojson", 0.009, EU);
lagen.landgrens = lijnen("ne_10m_admin_0_boundary_lines_land.geojson", 0.009, EU);
lagen.rivieren = lijnen("ne_10m_rivers_lake_centerlines.geojson", 0.009, EU, p => p.featurecla === "River" || p.featurecla === "Canal" ? p.scalerank <= 8 : false);
lagen.meren = vlakken("ne_10m_lakes.geojson", 0.009, EU, p => (p.scalerank ?? 9) <= 8);
lagen.stad = vlakken("ne_10m_urban_areas.geojson", 0.006, KERN, p => (p.area_sqkm ?? 0) >= 4);
for (const k in lagen) maat[k] = Math.round(lagen[k].length / 1024) + " KB";
console.error(JSON.stringify(maat));
fs.writeFileSync(uit, JSON.stringify(lagen));
