import csv,json,re,glob,collections,shutil,os
P='/mnt/project-files/sales/'
S=os.path.dirname(os.path.abspath(__file__))
cat=list(csv.DictReader(open(P+'categorieen/artikel_categorie.csv')))
cats=list(csv.DictReader(open(P+'categorieen/categorieen.csv')))
names={}
for f in sorted(glob.glob(P+'artikelnamen/output/*.jsonl')):
    for l in open(f):
        if l.strip(): o=json.loads(l); names[o['Artikel']]=o
art={r['artikel_nr']:r for r in csv.DictReader(open(P+'supabase-import/2_artikelen.csv'))}
extra={r['artikel_nr']:r for r in csv.DictReader(open(P+'supabase-import/5_artikel_extra.csv'))}
gec={r['Artikel']:r for r in csv.DictReader(open(P+'webshoplinks/gecontroleerd.csv'))}
tal={r['Artikel']:r for r in csv.DictReader(open(P+'webshoplinks/talen.csv'))}
fotos=set(os.path.basename(x)[:-4] for x in glob.glob(P+'aanbodpagina/fotos/*.jpg'))
pat=re.compile(r'geen\s+(internet|online|verkoop|action)|niet\s+naar\s+action|^nnb',re.I)
def beperking(n):
    l=n.lower(); k=[]
    if 'online' in l or 'internet' in l: k.append('geen online/consumentenverkoop')
    if 'benelux' in l: k.append('geen verkoop Benelux')
    if 'verkoop nederland' in l or 'verkoop nl' in l: k.append('geen verkoop Nederland')
    if 'belgie' in l: k.append('geen verkoop België')
    if 'action' in l: k.append('niet aan Action-landen')
    if l.startswith('nnb'): k.append('NNB (nog niet beschikbaar)')
    return k
out=[]; indeling=[]
for r in cat:
    a=r['Artikel']; n=r['Artikelnaam (MyBusiness)']
    b=beperking(n) if pat.search(n) else []
    prijs=float(r['Verkoopprijs'] or 0)
    if r['In webshop']=='ja' and not b and not r['Hoofdcode'].startswith('ERO'):
        st,why='publiek','staat nu in de webshop, geen beperking in de artikelnaam'
    elif r['In webshop']=='ja':
        st='alleen_inlog'
        why='staat nu in de webshop, maar '+('; '.join(b) if b else 'erotiek: alleen voor klanten die daarvoor kiezen')
    else:
        st='niet_op_site'
        why='staat nu niet in de webshop (alleen per mail/persoonlijk aanbod)'+(('; '+'; '.join(b)) if b else '')+('; verkoopprijs 0' if prijs==0 else '')
    nm=names.get(a,{})
    ex=extra.get(a,{}); verp=(ex.get('verpakking') or '').strip()
    pallet,omdoos='',''
    m=re.match(r'^\s*(\d*)\s*/\s*(\d*)',verp)
    if m: pallet,omdoos=m.group(1),m.group(2)
    url=(gec.get(a,{}).get('juiste_url') or '')
    indeling.append({'artikel_nr':a,'naam':n,'hoofdcategorie':r['Hoofdcategorie'],'subcategorie':r['Subcategorie'],'nu_in_webshop':r['In webshop'],'nieuwe_site':st,'reden':why,'huidige_url':url,'url_en':tal.get(a,{}).get('url_en',''),'url_de':tal.get(a,{}).get('url_de','')})
    out.append(dict(id=a,nl=nm.get('naam_nl') or n,en=nm.get('naam_en') or n,de=nm.get('naam_de') or n,pk=nm.get('verpakking',''),
        h=r['Hoofdcode'],s=r['Subcode'],v=int(float(r['Voorraad'] or 0)),p=prijs,om=omdoos,pa=pallet,st=st,b=b,
        d=art.get(a,{}).get('aangemaakt','')[:10],ean=art.get(a,{}).get('ean',''),foto=a in fotos,url=url))
with open('/mnt/project-files/website/artikelen_publiek_indeling.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(indeling[0].keys())); w.writeheader(); w.writerows(indeling)
print(collections.Counter(x['st'] for x in out))
print('publiek met foto', sum(1 for x in out if x['st']=='publiek' and x['foto']))
# selectie voor voorbeeld
pub=[x for x in out if x['st']=='publiek' and x['foto'] and x['p']>0]
pub.sort(key=lambda x:x['d'],reverse=True)
per=collections.defaultdict(list)
for x in pub: per[x['h']].append(x)
sel=[]
for h,l in per.items(): sel+=l[:14]
inl=[x for x in out if x['st']=='alleen_inlog' and x['foto'] and x['p']>0 and x['h']!='ERO'][:16]
mail=[x for x in out if x['st']=='niet_op_site' and x['foto'] and x['p']>0 and not x['b']]
mail.sort(key=lambda x:x['d'],reverse=True); mail=mail[:14]
items=sel+inl+mail
print(len(sel),len(inl),len(mail),len(items))
for x in items: shutil.copy(P+'aanbodpagina/fotos/%s.jpg'%x['id'], S+'/proto/f/%s.jpg'%x['id'])
catl=[dict(c=c['Code'],h=c['Hoofdcode'],n=c['Niveau'],nl=c['Naam NL'],en=c['Naam EN'],de=c['Naam DE']) for c in cats if c['Hoofdcode']!='ERO']
tot=collections.Counter(x['h'] for x in out if x['st']=='publiek')
json.dump(dict(items=items,cats=catl,totaal_publiek=tot,mijn=[x['id'] for x in mail]),open(S+'/proto/data.json','w'),ensure_ascii=False)
