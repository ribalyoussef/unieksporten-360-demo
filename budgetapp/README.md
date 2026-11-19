# Potje: weet waar je geld blijft

Budget-app (MVP). De gebruiker uploadt een bankexport en ziet meteen waar het geld heen gaat:
uitgaven per categorie, vaste lasten en abonnementen, budgetten en concrete bespaartips met
het bedrag dat ze per jaar opleveren.

- **Privacy als verkoopargument:** alles draait in de browser. Er gaan geen bankgegevens naar een server.
- **Banken:** ING (CSV), Rabobank (CSV), ABN AMRO (TXT/TAB), bunq (CSV) en elke CSV met datum/bedrag/naam.
- **Verdienmodel:** de eerste tip is gratis, de rest zit achter Potje Premium (€3,99/mnd of €29/jaar).

## Draaien

Geen build nodig. Open `index.html` via een webserver:

```bash
cd budgetapp && python3 -m http.server 8000   # http://localhost:8000
node test/parsers.test.js                      # tests voor parsers, categorieën en tips
```

## Betalingen koppelen (Stripe Payment Links)

1. Maak in Stripe een product "Potje Premium" met een maand- en een jaarprijs.
2. Maak voor elke prijs een Payment Link en zet "na betaling doorsturen" op `https://<jouw-domein>/?premium=ok`.
3. Plak beide links in `CONFIG` bovenin `js/app.js`.

Let op: Premium wordt nu in de browser ontgrendeld. Dat is goed genoeg om te testen of mensen
willen betalen. Zodra er omzet is, wil je accounts en een Stripe-webhook die het abonnement controleert.

## Bestanden

- `js/parsers.js`: inlezen van bankexports
- `js/categorize.js`: categorieregels, vaste lasten herkennen, bespaartips
- `js/app.js`: schermen, opslag (localStorage), paywall
- `js/sample.js`: voorbeelddata
