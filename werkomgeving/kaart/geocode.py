# Bepaalt per relatie een locatie (postcode > plaats > regio > land) uit de Relaties-export van MyBusiness.
# Invoer: rel.json (uit Relaties.xlsx: nr, naam, plaats, land, pc, adres, email, tel, fplaats, fland), GeoNames cities500.txt en per land <XX>.txt (postcodes).
# Uitvoer: sales/kaart/locaties.csv (relatie_nr, lat, lon, nauwkeurigheid, land_code). Het Kaart-tabblad leest dat bestand.
import json,re,unicodedata,collections,os,csv
rel=json.load(open('rel.json'))
def norm(s):
    s=unicodedata.normalize('NFKD',str(s or '')).encode('ascii','ignore').decode().lower()
    s=re.sub(r"[`'’´\-\.,()/]"," ",s); s=re.sub(r"\b(st|sint)\b","sint",s)
    return re.sub(r"\s+"," ",s).strip()
LAND={ 'nederland':'NL','nederlamd':'NL','belgie':'BE','belgiie':'BE','duitsland':'DE','duistland':'DE','germany':'DE','frankrijk':'FR','frankijk':'FR','france':'FR','polen':'PL',
 'engeland':'GB','u k':'GB','uk':'GB','united kingdom':'GB','united kingdon':'GB','verenigd konikrijk':'GB','verenigd koninkrijk':'GB','estonia':'EE','estland':'EE','oostenrijk':'AT','denemarken':'DK','denmark':'DK',
 'finland':'FI','roemenie':'RO','litouwen':'LT','bulgarije':'BG','letland':'LV','italie':'IT','italy':'IT','kroatie':'HR','croatia':'HR','tsjechie':'CZ','tjechie':'CZ','spanje':'ES','zwitserland':'CH',
 'hongarije':'HU','ierland':'IE','zweden':'SE','malta':'MT','cyprus':'CY','griekenland':'GR','marokko':'MA','bosnie en herzegovina':'BA','bosnie hercegovina':'BA','montenegro':'ME','kosovo':'XK',
 'iraq':'IQ','irak':'IQ','slowenien':'SI','slovenia':'SI','slowakije':'SK','albania':'AL','libya':'LY','libie':'LY','nieuw zeeland':'NZ','oekraine':'UA','paraguay':'PY','curacao':'CW','verenigde staten':'US','moldavie':'MD','israel':'IL'}
NAME={'NL':'Nederland','BE':'België','DE':'Duitsland','FR':'Frankrijk','PL':'Polen','GB':'Verenigd Koninkrijk','EE':'Estland','AT':'Oostenrijk','DK':'Denemarken','FI':'Finland','RO':'Roemenië','LT':'Litouwen','BG':'Bulgarije','LV':'Letland','IT':'Italië','HR':'Kroatië','CZ':'Tsjechië','ES':'Spanje','CH':'Zwitserland','HU':'Hongarije','IE':'Ierland','SE':'Zweden','MT':'Malta','CY':'Cyprus','GR':'Griekenland','MA':'Marokko','BA':'Bosnië en Herzegovina','ME':'Montenegro','XK':'Kosovo','IQ':'Irak','SI':'Slovenië','SK':'Slowakije','AL':'Albanië','LY':'Libië','NZ':'Nieuw-Zeeland','UA':'Oekraïne','PY':'Paraguay','CW':'Curaçao','US':'Verenigde Staten','MD':'Moldavië','IL':'Israël'}
TLD={'nl':'NL','be':'BE','de':'DE','fr':'FR','pl':'PL','uk':'GB','ee':'EE','at':'AT','dk':'DK','fi':'FI','ro':'RO','lt':'LT','bg':'BG','lv':'LV','it':'IT','hr':'HR','cz':'CZ','es':'ES','ch':'CH','hu':'HU','ie':'IE','se':'SE'}
PHONE=[('+31','NL'),('0031','NL'),('+32','BE'),('0032','BE'),('+49','DE'),('0049','DE'),('+33','FR'),('+48','PL'),('+44','GB')]
# gazetteer
cities=collections.defaultdict(list); allc=collections.defaultdict(list)
for line in open('cities500.txt',encoding='utf-8'):
    f=line.split('\t'); cc=f[8]; pop=int(f[14] or 0); lat,lon=float(f[4]),float(f[5])
    names={norm(f[1]),norm(f[2])}|{norm(x) for x in f[3].split(',') if x}
    for n in names:
        if n: cities[(cc,n)].append((pop,lat,lon))
    allc[cc].append((pop,lat,lon))
cen={}
for cc,l in allc.items():
    t=sum(p+1 for p,_,_ in l); cen[cc]=(sum((p+1)*a for p,a,_ in l)/t,sum((p+1)*b for p,_,b in l)/t)
cen['CW']=(12.17,-68.99)
post={}
for fn in os.listdir('.'):
    if re.fullmatch(r'[A-Z]{2}\.txt',fn):
        cc=fn[:2]
        for line in open(fn,encoding='utf-8'):
            f=line.rstrip('\n').split('\t')
            if len(f)<11 or not f[9]: continue
            code=f[1].replace(' ','').upper()
            post.setdefault((cc,code),(float(f[9]),float(f[10])))
def country(o):
    l=norm(o['land'])
    if l in LAND: return LAND[l],'land'
    if l: return None,'onbekend:'+l
    fl=norm(o['fland'])
    if fl in LAND: return LAND[fl],'factuurland'
    pc=str(o['pc'] or '').strip()
    if re.fullmatch(r'\d{4}\s?[A-Za-z]{2}',pc): return 'NL','postcode'
    m=re.search(r'@[^@]*\.([a-z]{2})$',str(o['email'] or '').strip().lower())
    if m and m.group(1) in TLD: return TLD[m.group(1)],'e-mail'
    t=re.sub(r'[\s\-\(\)]','',str(o['tel'] or ''))
    for p,c in PHONE:
        if t.startswith(p): return c,'telefoon'
    if o['plaats']:
        n=norm(o['plaats']); best=None
        for cc in ('NL','BE','DE'):
            if (cc,n) in cities: best=best or cc
        if best and sum((cc,n) in cities for cc in ('NL','BE','DE'))==1: return best,'plaats'
    return None,''
def geo(o,cc):
    pc=str(o['pc'] or '').upper().replace(' ','')
    if cc in ('DE','ES','FR','IT','FI') and pc.isdigit() and len(pc)==4: pc='0'+pc
    pl=norm(o['plaats'])
    if pc:
        keys=[]
        if cc=='NL': keys=[pc[:4]]
        elif cc=='GB': keys=[re.sub(r'\d[A-Z]{2}$','',pc)]
        elif cc=='PL': keys=[pc[:2]+'-'+pc[2:] if '-' not in pc else pc, pc]
        else: keys=[pc, re.sub(r'^[A-Z]+[-]?','',pc)]
        for k in keys:
            k=k.replace('-','') if cc!='PL' else k.replace('-','')
            if (cc,k) in post: return post[(cc,k)],'postcode'
            # polish codes stored with dash
        if cc=='PL' and pc[:2].isdigit():
            for k in [pc[:2]+'-'+pc[2:5]]:
                if (cc,k.replace('-','')) in post: return post[(cc,k.replace('-',''))],'postcode'
    if pl and (cc,pl) in cities:
        p,a,b=max(cities[(cc,pl)]); return (a,b),'plaats'
    if pl:
        # loosely: first word
        w=pl.split(' ')[0]
        if (cc,w) in cities: p,a,b=max(cities[(cc,w)]); return (a,b),'plaats'
    import difflib
    names=[k[1] for k in cities if k[0]==cc]
    for cand in [pl]+[x.strip() for x in re.split(r'[,/]',str(o['plaats'] or '')) if x.strip()]:
        cand=norm(cand)
        if len(cand)>=4:
            m=difflib.get_close_matches(cand,names,n=1,cutoff=0.82)
            if m: p,a,b=max(cities[(cc,m[0])]); return (a,b),'plaats'
    if pc:
        for L in range(min(len(pc),4),1,-1):
            pts=[v for (c,k),v in post.items() if c==cc and k.startswith(pc[:L])]
            if len(pts)>=1 and (L>=3 or cc in ('NL','BE','DE','FR','PL')):
                return (sum(a for a,b in pts)/len(pts),sum(b for a,b in pts)/len(pts)),'regio'
    if cc in cen: return cen[cc],'land'
    return None,''
out=[]; stat=collections.Counter(); unk=[]; conflict=[]
for o in rel:
    cc,how=country(o)
    pcs=str(o['pc'] or '').strip()
    if cc and cc!='NL' and re.fullmatch(r'\d{4}\s?[A-Za-z]{2}',pcs) and (('NL',norm(o['plaats'])) in cities):
        conflict.append((o['nr'],o['naam'],o['plaats'],o['pc'],o['land'])); cc,how='NL','conflict-postcode'
    if not cc:
        stat['geen_land']+=1; out.append(dict(nr=o['nr'],cc=None,nauw='geen',how=how,naam=o['naam'])); continue
    g,n=geo(o,cc)
    if not g: stat['geen_coord']+=1; out.append(dict(nr=o['nr'],cc=cc,nauw='geen',how=how,naam=o['naam'])); continue
    stat[n]+=1; out.append(dict(nr=o['nr'],cc=cc,lat=round(g[0],3),lon=round(g[1],3),nauw=n,how=how,naam=o['naam'],plaats=o['plaats'],land=o['land'],pc=o['pc']))
print(stat); print(collections.Counter(o['how'] for o in out))
json.dump(out,open('geo.json','w'),ensure_ascii=False)
for o in out:
    if o['nauw']=='land' and o.get('plaats'): print('LANDNIV',o['nr'],o['naam'],o['plaats'],o['pc'],o['cc'])
print('conflict',conflict)
print([ (o['nr'],o['naam'],o['how']) for o in out if o['how'].startswith('onbekend')])

os.makedirs('/mnt/project-files/sales/kaart',exist_ok=True)
with open('/mnt/project-files/sales/kaart/locaties.csv','w',newline='',encoding='utf-8') as f:
    w=csv.writer(f); w.writerow(['relatie_nr','lat','lon','nauwkeurigheid','land_code'])
    n=0
    for o in out:
        if o['nauw']!='geen' and o['nr'] not in (0,None):
            w.writerow([o['nr'],o['lat'],o['lon'],o['nauw'],o['cc']]); n+=1
print('geschreven',n)
json.dump({c:[NAME.get(c,c),round(v[0],2),round(v[1],2)] for c,v in cen.items() if c in NAME},open('landen.json','w'),ensure_ascii=False)
