/* Potje — "Geld dat je laat liggen": schatting van toeslagen 2026.
 *
 * LET OP: dit zijn indicaties. De parameters komen uit publieke bronnen (zie SOURCES) en
 * moeten elk jaar opnieuw gecontroleerd worden bij de Belastingdienst. Bronnen spraken elkaar
 * op enkele punten tegen (o.a. standaardpremie, huurtoeslag-afbouw); de app toont daarom altijd
 * een schatting en verwijst naar de proefberekening van de Belastingdienst.
 */
(function (global) {
  'use strict';

  const YEAR = 2026;

  const P = {
    zorgtoeslag: {
      standaardpremie: 2119,          // per verzekerde per jaar
      drempelinkomen: 29736,
      pctDrempel: { single: 0.01912, partner: 0.04289 },
      afbouw: 0.1373,                 // van het inkomen boven het drempelinkomen
      maxInkomen: { single: 40857, partner: 51142 },
      maxVermogen: { single: 146011, partner: 184633 },
    },
    kindgebondenBudget: {
      perKind: 2580,
      extra12tot15: 724,
      extra16tot17: 964,
      alleenstaandeOuderKop: 3416,
      drempel: { single: 29736, partner: 39141 },
      afbouw: 0.076,
      maxVermogen: { single: 146011, partner: 184633 },
    },
    huurtoeslag: {
      basishuur: { single: 202.52, multi: 200.71 },
      kwaliteitskortingsgrens: 498.20,
      aftoppingsgrens: { small: 713.02, large: 764.14 }, // 1–2 personen / 3+
      maxRekenhuur: 932.93,
      afbouw: { single: { vanaf: 23425, perEuro: 0.27 }, multi: { vanaf: 31500, perEuro: 0.22 } },
      maxVermogen: { single: 38479, partner: 76958 },
      minLeeftijd: 18,
    },
  };

  const SOURCES = {
    zorgtoeslag: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/maximaal-inkomen-voor-zorgtoeslag',
    huurtoeslag: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/content/kan-ik-huurtoeslag-krijgen',
    kindgebondenBudget: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/kindgebonden-budget/content/maximaal-vermogen-kindgebonden-budget',
  };

  // ── Signalen uit de bankdata ───────────────────────────────────────────────
  function detectFromBank(txs) {
    const months = [...new Set(txs.map(t => t.date.slice(0, 7)))].sort();
    const full = months.slice(0, -1).length ? months.slice(0, -1) : months; // laatste maand kan half zijn
    const salaryMonthly = full.length
      ? full.reduce((s, m) => s + txs.filter(t => t.date.startsWith(m) && t.category === 'inkomen' && t.amount > 300).reduce((a, t) => a + t.amount, 0), 0) / full.length
      : 0;
    const rentTx = txs.filter(t => t.category === 'wonen' && t.amount < 0 && /huur/i.test(t.name + ' ' + t.desc));
    const rent = rentTx.length ? -rentTx.sort((a, b) => b.date.localeCompare(a.date))[0].amount : 0;
    const receives = re => txs.some(t => t.amount > 0 && re.test(t.name + ' ' + t.desc));
    return {
      netMonthly: Math.round(salaryMonthly),
      // Grove schatting bruto uit netto (incl. vakantiegeld); de gebruiker past dit aan.
      grossYearlyGuess: salaryMonthly ? Math.round((salaryMonthly * 12 * 1.3) / 500) * 500 : '',
      rent: Math.round(rent),
      already: {
        zorgtoeslag: receives(/zorgtoeslag/i),
        huurtoeslag: receives(/huurtoeslag/i),
        kindgebondenBudget: receives(/kindgebonden|\bkgb\b/i),
      },
    };
  }

  // ── Berekeningen ───────────────────────────────────────────────────────────
  // a = { partner: bool, income: bruto jaarinkomen (samen), wealthOk: bool, rent: kale huur p/m,
  //       renting: bool, age18: bool, kids: [leeftijden], householdSize }
  function zorgtoeslag(a) {
    const z = P.zorgtoeslag, k = a.partner ? 'partner' : 'single';
    if (!a.age18) return { ok: false, reason: 'Je moet 18 jaar of ouder zijn.' };
    if (!a.wealthOk) return { ok: false, reason: 'Je vermogen ligt boven de grens.' };
    if (a.income > z.maxInkomen[k]) return { ok: false, reason: `Je inkomen ligt boven ${fmt(z.maxInkomen[k])}.` };
    const norm = z.pctDrempel[k] * z.drempelinkomen + z.afbouw * Math.max(0, a.income - z.drempelinkomen);
    const yearly = Math.max(0, z.standaardpremie * (a.partner ? 2 : 1) - Math.round(norm));
    return yearly > 0 ? { ok: true, yearly } : { ok: false, reason: 'Je inkomen is net te hoog.' };
  }

  function huurtoeslag(a) {
    const h = P.huurtoeslag;
    if (!a.renting) return { ok: false, reason: 'Alleen voor huurders.' };
    if (!a.age18) return { ok: false, reason: 'Je moet 18 jaar of ouder zijn.' };
    if (!a.wealthHuurOk) return { ok: false, reason: 'Je vermogen ligt boven de grens voor huurtoeslag.' };
    const single = a.householdSize === 1;
    const rent = Math.min(a.rent, h.maxRekenhuur);
    const basis = single ? h.basishuur.single : h.basishuur.multi;
    const top = a.householdSize >= 3 ? h.aftoppingsgrens.large : h.aftoppingsgrens.small;
    const perMonth = Math.max(0, Math.min(rent, h.kwaliteitskortingsgrens) - basis)
      + 0.65 * Math.max(0, Math.min(rent, top) - h.kwaliteitskortingsgrens);
    const af = single ? h.afbouw.single : h.afbouw.multi;
    const yearly = Math.max(0, perMonth * 12 - af.perEuro * Math.max(0, a.income - af.vanaf));
    return yearly > 120 ? { ok: true, yearly, rough: true } : { ok: false, reason: 'Bij jouw inkomen en huur is het waarschijnlijk te weinig of niets.' };
  }

  function kindgebondenBudget(a) {
    const k = P.kindgebondenBudget, key = a.partner ? 'partner' : 'single';
    const kids = (a.kids || []).filter(x => x >= 0 && x < 18);
    if (!kids.length) return { ok: false, reason: 'Alleen voor ouders met kinderen onder de 18.' };
    if (!a.wealthOk) return { ok: false, reason: 'Je vermogen ligt boven de grens.' };
    let max = kids.length * k.perKind
      + kids.filter(x => x >= 12 && x < 16).length * k.extra12tot15
      + kids.filter(x => x >= 16).length * k.extra16tot17
      + (a.partner ? 0 : k.alleenstaandeOuderKop);
    const yearly = Math.max(0, max - k.afbouw * Math.max(0, a.income - k.drempel[key]));
    return yearly > 0 ? { ok: true, yearly } : { ok: false, reason: 'Je inkomen is te hoog.' };
  }

  const fmt = n => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const REGELINGEN = [
    { id: 'zorgtoeslag', label: 'Zorgtoeslag', calc: zorgtoeslag, what: 'Tegemoetkoming in je zorgverzekering.', how: 'Aanvragen via Mijn toeslagen (inloggen met DigiD). Je kunt vaak ook nog met terugwerkende kracht aanvragen over dit jaar.' },
    { id: 'huurtoeslag', label: 'Huurtoeslag', calc: huurtoeslag, what: 'Bijdrage in je huur. Sinds 2026 is er geen maximale huurgrens meer.', how: 'Doe eerst de proefberekening bij de Belastingdienst; daarna aanvragen via Mijn toeslagen.' },
    { id: 'kindgebondenBudget', label: 'Kindgebonden budget', calc: kindgebondenBudget, what: 'Bijdrage in de kosten van je kinderen onder de 18.', how: 'Vaak krijg je dit automatisch als je kinderbijslag krijgt. Niets ontvangen? Vraag het aan via Mijn toeslagen.' },
  ];

  function check(answers, bank) {
    return REGELINGEN.map(r => {
      const res = r.calc(answers);
      const already = bank && bank.already[r.id];
      return { ...r, ...res, already, source: SOURCES[r.id] };
    });
  }

  global.PotjeRegelingen = { YEAR, P, SOURCES, detectFromBank, check, zorgtoeslag, huurtoeslag, kindgebondenBudget };
})(typeof window !== 'undefined' ? window : globalThis);
