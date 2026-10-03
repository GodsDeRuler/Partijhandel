# Opdracht voor thread "Online werkomgeving sales": berichten van klanten

Michel (3 oktober 2026, thread "Nieuwe website met Salesbureau"): klanten stellen in hun klantomgeving op de nieuwe site vragen bij een offerte of order, in chatvorm. Michel wil daar meldingen van krijgen in het Salesbureau, en vanuit het Salesbureau antwoorden. Hij zei "maak het".

Voorbeeld van de klantkant: https://claude.ai/artifact/JZUXAvdGrRbRzXrDzYKKqc (Ingelogde klant > Mijn omgeving > offerte openen > Vraag stellen; "Achter de schermen" toont de Salesbureau-kant).

## Database
Migratie `20261003b_berichten.sql` (in deze map): nieuwe tabel `berichten` (klant_id, offerte_id of order_nummer, afzender klant/verkoop, tekst, kanaal, aangemaakt, gelezen_op). Additief, RLS aan zonder policies zoals de rest.

## Salesbureau
1. **Belletje met teller** in de bovenbalk (naast zoekbalk / "+ Nieuw"): aantal berichten met afzender = klant en gelezen_op leeg. Klik opent het scherm Berichten. Verversen bij elke render, en elke 60 seconden zolang het scherm open is.
2. **Scherm "Berichten"** in groep Verkoop (`tabs: ["klanten", "offertes", "orders", "berichten"]`): gesprekken gegroepeerd per offerte/order, nieuwste eerst, filter "Wacht op antwoord" (laatste bericht is van de klant) als standaard. Per gesprek: klantnaam, offerte/ordernummer (klikbaar), laatste bericht, hoe lang het wacht.
3. **Gesprek bij offerte en order**: in de detailweergave van een offerte en een order een blok "Berichten" met de chat (klant links, verkoop rechts) en een invoerveld "Antwoord". Openen markeert de klantberichten als gelezen (`gelezen_op = now()`).
4. **Antwoord** = insert met afzender 'verkoop', afzender_naam = ingelogde medewerker (of "Michel"). De mail naar de klant ("Je hebt antwoord op je vraag") verstuurt later de website-server; het Salesbureau verstuurt zelf geen mail (regel: nooit mail versturen zonder akkoord).
5. **Handmatig vastleggen**: optie om een vraag die per telefoon/WhatsApp/mail binnenkwam toe te voegen (kanaal kiezen), zodat het hele gesprek op één plek staat.
6. Dashboard: tegel "Vragen wachten op antwoord" met het aantal.

## Testen
Testgesprek aanmaken op een bestaande offerte (bijv. via SQL insert met afzender 'klant'), teller en scherm controleren, antwoorden, gelezen-status controleren, testrijen daarna opruimen (Michel bevestigt deletes zelf).

## Later (als de nieuwe site live staat)
- Website schrijft klantberichten via de server; policies op basis van `klant_accounts`.
- Melding per mail naar info@ bij een nieuwe vraag; pushmelding op telefoon zodra het Salesbureau een eigen webadres heeft.
