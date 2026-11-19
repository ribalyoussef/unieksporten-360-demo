/* Potje — categorieën, automatische herkenning en bespaartips. */
(function (global) {
  'use strict';

  // kind: 'income' | 'spend' | 'saving'
  const CATEGORIES = [
    { id: 'inkomen', label: 'Inkomen', kind: 'income' },
    { id: 'wonen', label: 'Wonen', kind: 'spend' },
    { id: 'energie', label: 'Energie, water & internet', kind: 'spend' },
    { id: 'boodschappen', label: 'Boodschappen', kind: 'spend' },
    { id: 'uiteten', label: 'Uit eten & bezorgen', kind: 'spend' },
    { id: 'vervoer', label: 'Vervoer', kind: 'spend' },
    { id: 'abonnementen', label: 'Abonnementen', kind: 'spend' },
    { id: 'zorg', label: 'Zorg & verzekeringen', kind: 'spend' },
    { id: 'shopping', label: 'Shopping', kind: 'spend' },
    { id: 'vrijetijd', label: 'Vrije tijd & sport', kind: 'spend' },
    { id: 'contant', label: 'Contant geld', kind: 'spend' },
    { id: 'overig', label: 'Overig', kind: 'spend' },
    { id: 'sparen', label: 'Sparen & eigen rekeningen', kind: 'saving' },
  ];
  const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  const RULES = [
    ['sparen', /spaarrekening|oranje spaar|spaardoel|rentemeerder|eigen rekening|bunq savings|beleggen|meesman|degiro|brand new day/],
    ['inkomen', /salaris|loon|uitkering|kinderbijslag|toeslag|zorgtoeslag|huurtoeslag|belastingdienst.*teruggaaf|vakantiegeld|svb|uwv|duo studiefinanciering|stufi/],
    ['wonen', /\bhuur\b|hypotheek|woningcorporatie|vve|vereniging van eigenaren|ymere|eigen haard|de alliantie|vestia|stadgenoot|gemeente.*(belasting|heffing)|waterschap|gbt|bsgw/],
    ['energie', /vattenfall|eneco|essent|energiedirect|greenchoice|budget energie|vandebron|tibber|oxxio|waternet|vitens|evides|brabant water|pwn|dunea|ziggo|kpn|odido|t-mobile|vodafone|simyo|lebara|youfone|tele2|delta fiber|caiway/],
    ['boodschappen', /albert heijn|\bah\b|ah to go|jumbo|lidl|aldi|plus supermarkt|^plus\b|dirk|vomar|hoogvliet|coop|\bspar\b|dekamarkt|picnic|ekoplaza|crisp|flink|getir|etos|kruidvat|\baction\b/],
    ['uiteten', /thuisbezorgd|uber ?eats|deliveroo|domino|new york pizza|mcdonald|burger king|kfc|subway|starbucks|coffee|koffie|espresso|cafe|caf[eé]|restaurant|\bbar\b|eetcafe|febo|bakker|lunchroom|sushi|pizza/],
    ['vervoer', /\bns\b|ns groep|ov-?chipkaart|translink|gvb|\bret\b|\bhtm\b|arriva|connexxion|qbuzz|shell|esso|\bbp\b|tinq|tango|total ?energies|parkeren|q-park|parkmobile|yellowbrick|anwb|swapfiets|\buber\b|\bbolt\b|felyx|greenwheels|mywheels|car ?wash|wegenbelasting/],
    ['abonnementen', /netflix|spotify|disney|videoland|hbo|\bmax\b|amazon prime|prime video|apple\.com|itunes|google \*|youtube|icloud|dazn|viaplay|nlziet|audible|storytel|chatgpt|openai|adobe|microsoft|dropbox|playstation|xbox|nintendo|patreon|onlyfans|tinder|bumble|duolingo/],
    ['zorg', /zilveren kruis|\bcz\b|vgz|menzis|ohra|fbto|interpolis|centraal beheer|nationale.?nederlanden|\basr\b|unive|univé|anwb verzekering|apotheek|tandarts|huisarts|fysio|ziekenhuis|polis|verzekering/],
    ['vrijetijd', /basic.?fit|sportschool|fitness|trainmore|anytime fitness|sportclub|vereniging|bioscoop|path[eé]|kinepolis|\bvue\b|ticketmaster|eventim|museum|efteling|steam|booking\.com|airbnb|transavia|klm|ryanair|easyjet|corendon|\btui\b|sunweb/],
    ['shopping', /bol\.com|bol com|zalando|amazon|coolblue|mediamarkt|hema|ikea|primark|h&m|h & m|zara|wehkamp|about you|shein|temu|aliexpress|decathlon|blokker|praxis|gamma|karwei|hornbach|intertoys|douglas|rituals/],
    ['contant', /geldautomaat|geldopname|\bgea\b|cash/],
  ];

  function normalizeName(name) {
    return String(name || '').toLowerCase()
      .replace(/\b(b\.?v\.?|n\.?v\.?|via|inzake|pas\d*)\b/g, ' ')
      .replace(/[^a-zÀ-ſ& ]+/g, ' ')
      .replace(/\s+/g, ' ').trim()
      .split(' ').slice(0, 3).join(' ') || 'onbekend';
  }

  function guessCategory(tx) {
    const hay = (tx.name + ' ' + tx.desc).toLowerCase();
    for (const [cat, re] of RULES) {
      if (re.test(hay)) {
        // Een terugbetaling van een winkel blijft in die categorie; overig inkomen = inkomen.
        if (cat === 'inkomen' && tx.amount < 0) continue;
        return cat;
      }
    }
    if (/tikkie|betaalverzoek/.test(hay)) return tx.amount > 0 ? 'inkomen' : 'overig';
    return tx.amount > 0 ? 'inkomen' : 'overig';
  }

  function categorize(tx, userRules) {
    const key = normalizeName(tx.name);
    if (userRules && userRules[key]) return userRules[key];
    return guessCategory(tx);
  }

  const monthKey = date => date.slice(0, 7);

  // Totalen voor één maand.
  function summarize(txs) {
    const byCat = {};
    for (const t of txs) byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    let income = 0, spend = 0, saved = 0;
    const spendByCat = {};
    for (const [cat, net] of Object.entries(byCat)) {
      const kind = (CAT[cat] || CAT.overig).kind;
      if (kind === 'income') income += net;
      else if (kind === 'saving') saved += -net;
      else { const s = Math.max(0, -net); spendByCat[cat] = s; spend += s; }
    }
    return { income, spend, saved, spendByCat, net: income - spend };
  }

  // Terugkerende afschrijvingen: dezelfde partij, (bijna) hetzelfde bedrag, in meerdere maanden.
  function findRecurring(allTxs) {
    const groups = {};
    for (const t of allTxs) {
      if (t.amount >= 0 || ['boodschappen', 'uiteten', 'vervoer', 'contant', 'sparen'].includes(t.category)) continue;
      const k = normalizeName(t.name);
      (groups[k] = groups[k] || []).push(t);
    }
    const months = new Set(allTxs.map(t => monthKey(t.date)));
    const result = [];
    for (const list of Object.values(groups)) {
      const ms = new Set(list.map(t => monthKey(t.date)));
      if (ms.size < 2 || list.length > ms.size + 1) continue;
      const amts = list.map(t => -t.amount);
      const min = Math.min(...amts), max = Math.max(...amts);
      if (max / min > 1.15) continue;
      const last = list.reduce((a, b) => (a.date > b.date ? a : b));
      result.push({ name: last.name, category: last.category, monthly: -last.amount, months: ms.size, totalMonths: months.size });
    }
    return result.sort((a, b) => b.monthly - a.monthly);
  }

  const eur = n => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n);

  // Bespaartips, gesorteerd op wat ze per jaar kunnen opleveren.
  function buildTips(allTxs, month) {
    const tips = [];
    const mName = new Date(month + '-01T12:00').toLocaleString('nl-NL', { month: 'long' });
    const inMonth = allTxs.filter(t => monthKey(t.date) === month);
    const cur = summarize(inMonth);
    const prevMonths = [...new Set(allTxs.map(t => monthKey(t.date)))].filter(m => m < month).sort().slice(-3);
    const prev = prevMonths.map(m => summarize(allTxs.filter(t => monthKey(t.date) === m)));

    const subs = findRecurring(allTxs).filter(r => ['abonnementen', 'vrijetijd'].includes(r.category));
    if (subs.length >= 2) {
      const total = subs.reduce((s, r) => s + r.monthly, 0);
      const cheapest = subs[subs.length - 1];
      tips.push({
        id: 'abonnementen',
        title: `${subs.length} abonnementen kosten je ${eur(total * 12)} per jaar`,
        body: `Je betaalt elke maand ${eur(total)} aan ${subs.map(s => s.name).join(', ')}. Gebruik je ze allemaal nog? Eén streamingdienst per keer en de rest pauzeren is een bekende truc.`,
        yearly: Math.max(cheapest.monthly, total * 0.3) * 12,
        action: 'Zeg er deze week één op',
      });
    }

    const takeaway = inMonth.filter(t => t.category === 'uiteten' && t.amount < 0);
    const takeawaySum = cur.spendByCat.uiteten || 0;
    if (takeaway.length >= 3 && takeawaySum > 60) {
      const avg = takeawaySum / takeaway.length;
      tips.push({
        id: 'uiteten',
        title: `${takeaway.length}× uit eten of bezorgd: ${eur(takeawaySum)} in ${mName}`,
        body: `Gemiddeld ${eur(avg)} per keer. Als je er elke week één vervangt door zelf koken (± ${eur(6)} per maaltijd), houd je per jaar zo'n ${eur((avg - 6) * 52)} over.`,
        yearly: Math.max(0, (avg - 6) * 52),
        action: 'Plan één kookavond extra per week',
      });
    }

    if (prev.length) {
      for (const [cat, amount] of Object.entries(cur.spendByCat)) {
        if (['wonen', 'zorg', 'sparen'].includes(cat)) continue;
        const avg = prev.reduce((s, p) => s + (p.spendByCat[cat] || 0), 0) / prev.length;
        if (avg > 0 && amount > avg * 1.25 && amount - avg > 50) {
          tips.push({
            id: 'stijging-' + cat,
            title: `${CAT[cat].label}: ${eur(amount - avg)} meer dan normaal`,
            body: `Normaal geef je hier ${eur(avg)} per maand aan uit, in ${mName} ${eur(amount)}. Was dit eenmalig, of sluipt het erin?`,
            yearly: (amount - avg) * 4,
            action: 'Stel een budget in voor ' + CAT[cat].label.toLowerCase(),
          });
        }
      }
    }

    const small = inMonth.filter(t => t.amount < 0 && -t.amount < 8 && !['boodschappen', 'vervoer', 'abonnementen'].includes(t.category));
    const smallSum = small.reduce((s, t) => s - t.amount, 0);
    if (small.length >= 6) {
      tips.push({
        id: 'klein',
        title: `${small.length} kleine aankopen tellen op tot ${eur(smallSum)}`,
        body: `Koffie onderweg, een snack, een app: los niks, samen ${eur(smallSum * 12)} per jaar. Halveer het en je spaart ${eur(smallSum * 6)}.`,
        yearly: smallSum * 6,
        action: 'Neem een week lang koffie van huis mee',
      });
    }

    const energy = cur.spendByCat.energie || 0;
    if (energy > 220) {
      tips.push({
        id: 'energie',
        title: `Vaste lasten energie en internet: ${eur(energy)} per maand`,
        body: 'Overstappen van energie- of internetaanbieder levert vaak €100–300 per jaar op. Vergelijk eens per jaar, vooral als je contract afloopt.',
        yearly: 200,
        action: 'Vergelijk je energiecontract',
      });
    }

    if (cur.income > 0 && cur.net < 0) {
      tips.unshift({
        id: 'tekort',
        title: `In ${mName} gaf je ${eur(-cur.net)} meer uit dan er binnenkwam`,
        body: 'Begin bij de grootste flexibele post in je overzicht. Daar zit de snelste winst. De tips hieronder laten zien waar.',
        yearly: 0, shortfall: -cur.net, action: 'Bekijk je grootste uitgavenpost', urgent: true,
      });
    } else if (cur.income > 0 && cur.net > 0 && cur.saved < cur.net * 0.5) {
      tips.push({
        id: 'automatisch-sparen',
        title: `Je hield ${eur(cur.net)} over. Zet het meteen apart`,
        body: `Stel een automatische overboeking in op de dag dat je salaris binnenkomt, van bijvoorbeeld ${eur(Math.floor(cur.net * 0.5 / 10) * 10)}. Wat je niet ziet, geef je niet uit.`,
        yearly: Math.floor(cur.net * 0.5 / 10) * 10 * 12,
        action: 'Stel een automatische spaaropdracht in',
      });
    }

    return tips.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.yearly - a.yearly);
  }

  global.PotjeCore = { CATEGORIES, CAT, categorize, guessCategory, normalizeName, summarize, findRecurring, buildTips, monthKey, eur };
})(typeof window !== 'undefined' ? window : globalThis);
