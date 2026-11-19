/* Potje — voorbeelddata: vier maanden van een fictief huishouden. */
(function (global) {
  'use strict';

  function makeSampleTransactions(today = new Date()) {
    let seed = 42;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const between = (a, b) => Math.round((a + rnd() * (b - a)) * 100) / 100;
    const txs = [];
    const add = (y, m, d, amount, name, desc = '') => {
      const date = new Date(y, m, d);
      if (date > today) return;
      txs.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, amount, name, desc });
    };

    for (let back = 3; back >= 0; back--) {
      const ref = new Date(today.getFullYear(), today.getMonth() - back, 1);
      const y = ref.getFullYear(), m = ref.getMonth();
      const days = new Date(y, m + 1, 0).getDate();
      const extra = back === 1 ? 1.6 : 1; // vorige maand liep het wat uit de hand

      add(y, m, 1, -925.0, 'Woonstichting De Key', 'Huur ' + ref.toLocaleString('nl-NL', { month: 'long' }));
      add(y, m, 2, -168.0, 'Vattenfall', 'Termijnbedrag stroom en gas');
      add(y, m, 3, -54.5, 'Ziggo', 'Internet + tv');
      add(y, m, 3, -24.0, 'Odido', 'Mobiel abonnement');
      add(y, m, 1, -152.35, 'Zilveren Kruis', 'Zorgverzekering premie');
      add(y, m, 5, -13.99, 'Netflix International B.V.', 'Netflix maandabonnement');
      add(y, m, 7, back <= 1 ? -12.99 : -11.99, 'Spotify AB', 'Spotify Premium'); // prijsverhoging
      add(y, m, 12, -10.99, 'Disney Plus', 'Disney+ abonnement');
      add(y, m, 14, -9.99, 'Videoland', 'Videoland Basis');
      add(y, m, 18, -29.99, 'Basic-Fit Nederland', 'Lidmaatschap');
      add(y, m, 20, -2.99, 'Apple.com/bill', 'iCloud+ 200 GB');
      add(y, m, 25, 2210.0, 'Werkgever BV', 'Salaris ' + ref.toLocaleString('nl-NL', { month: 'long' }));
      add(y, m, 26, -75.0, 'Oranje Spaarrekening', 'Naar eigen spaarrekening');
      add(y, m, 17, -38.4, 'Gemeente Amsterdam', 'Afvalstoffenheffing termijn');

      for (let d = 2; d <= days; d += pick([3, 4, 4])) {
        add(y, m, d, -between(12, 48), pick(['Albert Heijn 1427', 'Jumbo Amsterdam', 'Lidl', 'AH to go Centraal', 'Dirk van den Broek']), 'Betaalpas');
      }
      const deliveries = Math.round(3 * extra);
      for (let i = 0; i < deliveries; i++) add(y, m, 1 + Math.floor(rnd() * days), -between(19, 42), pick(['Thuisbezorgd.nl', 'Uber Eats', 'Domino\'s Pizza']), 'Bestelling');
      for (let i = 0; i < 2; i++) add(y, m, 1 + Math.floor(rnd() * days), -between(24, 55), pick(['Restaurant De Kas', 'Cafe Thijssen', 'Sushi Samba']), 'Betaalpas');
      for (let i = 0; i < 7; i++) add(y, m, 1 + Math.floor(rnd() * days), -between(2.8, 5.2), pick(['Starbucks Centraal', 'Coffee Company', 'Bakker Bart', 'Febo']), 'Contactloos');
      for (let i = 0; i < 5; i++) add(y, m, 1 + Math.floor(rnd() * days), -between(4.5, 16), 'NS Groep', 'OV-chipkaart reizen');
      if (back % 2 === 0) add(y, m, 9, -between(45, 60), 'Shell', 'Tanken');
      for (let i = 0; i < Math.round(2 * extra); i++) add(y, m, 1 + Math.floor(rnd() * days), -between(15, 70), pick(['Bol.com', 'Zalando SE', 'HEMA', 'Coolblue', 'IKEA']), 'Bestelling');
      if (back === 1) add(y, m, 8, -189.0, 'Zalando SE', 'Winterjas');
      if (back === 2) add(y, m, 16, 34.5, 'Bol.com', 'Terugbetaling retour');
      add(y, m, 1 + Math.floor(rnd() * days), -between(12, 30), 'Pathé', 'Bioscoop');
      add(y, m, 1 + Math.floor(rnd() * days), 18.5, 'Tikkie J. de Vries', 'Etentje vrijdag');
      if (rnd() > 0.4) add(y, m, 1 + Math.floor(rnd() * days), -50, 'Geldautomaat ING', 'Geldopname');
    }
    return txs.sort((a, b) => b.date.localeCompare(a.date));
  }

  global.PotjeSample = { makeSampleTransactions };
})(typeof window !== 'undefined' ? window : globalThis);
