# Potje: weet waar je geld blijft

Budget-app (MVP). De gebruiker uploadt een bankexport en ziet meteen waar het geld heen gaat:
uitgaven per categorie, vaste lasten en abonnementen, budgetten en concrete bespaartips met
het bedrag dat ze per jaar opleveren.

- **Privacy als verkoopargument:** alles draait in de browser. Er gaan geen bankgegevens naar een server.
- **Banken:** ING (CSV), Rabobank (CSV), ABN AMRO (TXT/TAB), bunq (CSV) en elke CSV met datum/bedrag/naam.
- **Geld dat je laat liggen:** schatting van zorgtoeslag, huurtoeslag en kindgebonden budget 2026 (`js/regelingen.js`, parameters elk jaar controleren).
- **Verdienmodel:** de check en het totaalbedrag zijn gratis; details, alle regelingen en alle tips via Potje Plus (eenmalig €9,95).

## Draaien

Geen build nodig. Open `index.html` via een webserver:

```bash
cd budgetapp && python3 -m http.server 8000   # http://localhost:8000
node test/parsers.test.js                      # tests voor parsers, categorieën en tips
```

## Betalingen koppelen (Stripe Payment Links)

1. Maak in Stripe een product "Potje Plus" met een eenmalige prijs van €9,95.
2. Maak een Payment Link en zet "na betaling doorsturen" op `https://<jouw-domein>/?premium=ok`.
3. Plak de link bij `paymentLink` in `CONFIG` bovenin `js/app.js`.

Let op: Premium wordt nu in de browser ontgrendeld. Dat is goed genoeg om te testen of mensen
willen betalen. Zodra er omzet is, wil je accounts en een Stripe-webhook die het abonnement controleert.

## Bestanden

- `js/parsers.js`: inlezen van bankexports
- `js/categorize.js`: categorieregels, vaste lasten herkennen, bespaartips
- `js/app.js`: schermen, opslag (localStorage), paywall
- `js/sample.js`: voorbeelddata
