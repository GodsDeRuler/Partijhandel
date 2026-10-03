#!/usr/bin/env python3
"""Bouwt de SQL-blokken waarmee de sitegegevens (namen NL/EN/DE, webadressen per taal, verpakking) in Supabase komen.

Leest uit de projectmap (niet uit de repo: de bronbestanden bevatten bedrijfsgegevens) en schrijft blokken van ~100 artikelen naar de uitvoermap.
Gebruik: python3 bouw_sitegegevens.py <uitvoermap>
Elk blok is een update op artikelen via jsonb; draai ze achter elkaar. Alleen lege velden worden gevuld, bestaande waarden blijven staan.
"""
import csv, glob, json, os, re, sys

P = '/mnt/project-files/'
uit = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(uit, exist_ok=True)

namen = {}
for f in sorted(glob.glob(P + 'sales/artikelnamen/output/*.jsonl')):
    for l in open(f, encoding='utf-8'):
        if l.strip():
            o = json.loads(l)
            namen[str(o['Artikel'])] = o
nl_url = {r['Artikel']: r['juiste_url'] for r in csv.DictReader(open(P + 'sales/webshoplinks/gecontroleerd.csv', encoding='utf-8'))}
talen = {r['Artikel']: r for r in csv.DictReader(open(P + 'sales/webshoplinks/talen.csv', encoding='utf-8'))}
verp = {r['artikel_nr']: (r['verpakking'] or '').strip() for r in csv.DictReader(open(P + 'sales/supabase-import/5_artikel_extra.csv', encoding='utf-8'))}


def slug(url, taal):
    m = re.search(r'/product/([^/?#]+)/?', url or '')
    return m.group(1) if m else ''


rijen = []
gezien = {'nl': set(), 'en': set(), 'de': set()}
for nr in sorted(set(namen) | set(nl_url) | set(verp), key=int):
    n = namen.get(nr, {})
    sl = {'nl': slug(nl_url.get(nr), 'nl'), 'en': slug(talen.get(nr, {}).get('url_en'), 'en'), 'de': slug(talen.get(nr, {}).get('url_de'), 'de')}
    for t in sl:  # dubbele webadressen voorkomen
        if sl[t] in gezien[t]:
            sl[t] = ''
        elif sl[t]:
            gezien[t].add(sl[t])
    rijen.append([int(nr), n.get('naam_nl', ''), n.get('naam_en', ''), n.get('naam_de', ''), sl['nl'], sl['en'], sl['de'], verp.get(nr, '')])

for i in range(0, len(rijen), 100):
    blok = rijen[i:i + 100]
    data = json.dumps(blok, ensure_ascii=False, separators=(',', ':'))
    assert '$j$' not in data
    sql = f"""update artikelen a set
  site_naam_nl = coalesce(a.site_naam_nl, nullif(v.nl, '')), site_naam_en = coalesce(a.site_naam_en, nullif(v.en, '')), site_naam_de = coalesce(a.site_naam_de, nullif(v.de, '')),
  slug_nl = coalesce(a.slug_nl, nullif(v.sn, '')), slug_en = coalesce(a.slug_en, nullif(v.se, '')), slug_de = coalesce(a.slug_de, nullif(v.sd, '')),
  verpakking = coalesce(nullif(a.verpakking, ''), nullif(v.vp, ''))
from (select (e->>0)::int nr, e->>1 nl, e->>2 en, e->>3 de, e->>4 sn, e->>5 se, e->>6 sd, e->>7 vp from jsonb_array_elements($j${data}$j$::jsonb) e) v
where a.artikel_nr = v.nr"""
    open(f'{uit}/blok_{i // 100 + 1:02d}.sql', 'w', encoding='utf-8').write(sql)
print(len(rijen), 'artikelen in', (len(rijen) + 99) // 100, 'blokken')
grijs = [r['artikel_nr'] for r in csv.DictReader(open(P + 'website/artikelen_zonder_grote_foto.csv', encoding='utf-8'))]
open(f'{uit}/foto_grijs.sql', 'w').write("update artikelen set foto_grijs = true where artikel_nr = any (array[" + ','.join(grijs) + "])")
print(len(grijs), 'grijze foto\'s')
