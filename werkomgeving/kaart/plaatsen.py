# Bouwt de plaatsnamenlijst voor de Kaart (plaatsen.json) uit GeoNames cities500.txt.
# Selectie: wereldwijd vanaf 300.000 inwoners, Europa vanaf 15.000, de grensstreek (BE/DE/FR/GB-zuid) vanaf 5.000, Nederland alles vanaf 500.
# Volgorde = belangrijkheid (inwoners, Nederland zwaarder geteld); de kaart toont labels in die volgorde zolang er ruimte is.
# Uitvoer: [[naam, lat, lon], ...]; wordt tussen <script id="plaatsen"> in werkomgeving/index.html gezet.
import json,sys
NL_NAMEN={'Cologne':'Keulen','Brussels':'Brussel','Antwerp':'Antwerpen','Ghent':'Gent','Bruges':'Brugge','Liège':'Luik','Mons':'Bergen','Namur':'Namen','Louvain':'Leuven','Paris':'Parijs','Lille':'Rijsel','Dunkirk':'Duinkerke','London':'Londen','Munich':'München','Nuremberg':'Neurenberg','Hanover':'Hannover','Aachen':'Aken','Vienna':'Wenen','Prague':'Praag','Warsaw':'Warschau','Copenhagen':'Kopenhagen','Milan':'Milaan','Venice':'Venetië','Naples':'Napels','Turin':'Turijn','Genoa':'Genua','Lisbon':'Lissabon','Seville':'Sevilla','Athens':'Athene','Moscow':'Moskou','Kyiv':'Kiev','Bucharest':'Boekarest','Belgrade':'Belgrado','Geneva':'Genève','Zurich':'Zürich','Lucerne':'Luzern','Krakow':'Krakau','Kraków':'Krakau','Wrocław':'Wrocław','Gdańsk':'Gdańsk','Cairo':'Caïro','Istanbul':'Istanboel','Rome':'Rome','Florence':'Florence','Brasília':'Brasilia','Peking':'Peking','Beijing':'Peking','New York City':'New York','The Hague':'Den Haag',"'s-Hertogenbosch":"'s-Hertogenbosch",'Mexico City':'Mexico-Stad','Mumbai':'Mumbai','Seoul':'Seoel','Tokyo':'Tokio','Saint Petersburg':'Sint-Petersburg','Hamburg':'Hamburg','Frankfurt am Main':'Frankfurt','Luxembourg':'Luxemburg','Edinburgh':'Edinburgh','Dublin':'Dublin','Sofia':'Sofia','Tallinn':'Tallinn','Riga':'Riga','Vilnius':'Vilnius','Helsinki':'Helsinki','Stockholm':'Stockholm','Oslo':'Oslo','Budapest':'Boedapest','Bratislava':'Bratislava','Ljubljana':'Ljubljana','Valletta':'Valletta','Nicosia':'Nicosia','Tirana':'Tirana','Sarajevo':'Sarajevo','Chisinau':'Chisinau','Marseille':'Marseille','Lyon':'Lyon','Strasbourg':'Straatsburg','Dresden':'Dresden','Cairo':'Caïro','Casablanca':'Casablanca','Mechelen':'Mechelen','Tournai':'Doornik','Kortrijk':'Kortrijk','Ypres':'Ieper','Ostend':'Oostende','Maastricht':'Maastricht','Roermond':'Roermond','Venlo':'Venlo'}
src=sys.argv[1]; uit=sys.argv[2]
rij=[]; gezien=set()
for l in open(src,encoding='utf-8'):
    f=l.split('\t'); 
    if f[6]!='P': continue
    pop=int(f[14] or 0); cc=f[8]; lat=float(f[4]); lon=float(f[5]); naam=f[1]
    eu=34<lat<72 and -25<lon<45
    grens=49.4<lat<53.7 and 2<lon<8.2
    if not (pop>=300000 or (eu and pop>=15000) or (grens and pop>=5000) or (cc=='NL' and pop>=500)): continue
    if f[0] in gezien: continue
    gezien.add(f[0])
    rij.append((pop*(4 if cc=='NL' else 1),NL_NAMEN.get(naam,naam),round(lat,2),round(lon,2)))
rij.sort(key=lambda r:-r[0])
json.dump([[n,a,o] for _,n,a,o in rij],open(uit,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(rij))
