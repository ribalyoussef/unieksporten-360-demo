/* Potje — app. Alle data blijft in de browser (localStorage). */
(function () {
  'use strict';

  // ── Instellingen ───────────────────────────────────────────────────────────
  // Maak in Stripe twee Payment Links aan en zet de success-URL op
  // https://<jouw-domein>/?premium=ok  — plak de links hieronder.
  const CONFIG = {
    paymentLinkMonthly: '',
    paymentLinkYearly: '',
    priceMonthly: '€3,99',
    priceYearly: '€29',
  };

  const { CATEGORIES, CAT, categorize, normalizeName, summarize, findRecurring, forecast, buildTips, monthKey, eur } = window.PotjeCore;

  // Directe opzeglinks waar we zeker van zijn; anders zoeken we de opzegpagina op.
  const CANCEL_LINKS = [
    [/netflix/, 'https://www.netflix.com/cancelplan'],
    [/spotify/, 'https://www.spotify.com/nl/account/subscription/'],
  ];
  const cancelUrl = r => (CANCEL_LINKS.find(([re]) => re.test(r.key)) || [])[1] || 'https://www.google.com/search?q=' + encodeURIComponent(r.name.replace(/\b(b\.?v\.?|ab|se|international|nederland)\b/gi, '').trim() + ' abonnement opzeggen');
  const CANCELLABLE = ['abonnementen', 'vrijetijd', 'shopping', 'overig', 'energie'];
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur2 = n => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

  // ── Opslag ────────────────────────────────────────────────────────────────
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem('potje.' + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem('potje.' + key, JSON.stringify(value)); } catch { /* privémodus */ } },
    clear() { try { Object.keys(localStorage).filter(k => k.startsWith('potje.')).forEach(k => localStorage.removeItem(k)); } catch { /* */ } },
  };

  const state = {
    raw: store.get('txs', []),
    rules: store.get('rules', {}),
    budgets: store.get('budgets', {}),
    premium: store.get('premium', false),
    isSample: store.get('sample', false),
    done: store.get('done', {}), // { id: { label, yearly, at } } — uitgevoerde tips en opgezegde abonnementen
    view: 'overzicht',
    month: null,
    search: '',
    catFilter: '',
  };

  const params = new URLSearchParams(location.search);
  if (params.get('premium') === 'ok') {
    state.premium = true; store.set('premium', true);
    history.replaceState(null, '', location.pathname);
    setTimeout(() => toast('Welkom bij Potje Premium! Alle tips staan nu open.'), 300);
  }

  const cancelled = () => new Set(Object.keys(state.done).filter(k => k.startsWith('cancel:')).map(k => k.slice(7)));
  const savedTotal = () => Object.values(state.done).reduce((a, d) => a + d.yearly, 0);
  function toggleDone(id, label, yearly) {
    if (state.done[id]) delete state.done[id];
    else state.done[id] = { label, yearly: Math.round(yearly * 100) / 100, at: new Date().toISOString().slice(0, 10) };
    store.set('done', state.done);
    render();
    if (state.done[id]) toast(`Top! ${eur(yearly)} per jaar erbij op je bespaarteller.`);
  }

  let txs = [];
  function recompute() {
    txs = state.raw.map((t, i) => ({ ...t, id: i, category: categorize(t, state.rules) }));
    const months = allMonths();
    if (!state.month || !months.includes(state.month)) {
      // Start op de laatste volledige maand: een halve maand (salaris nog niet binnen) geeft een vertekend beeld.
      const last = months[months.length - 1];
      state.month = last && isPartial(last) && months.length > 1 ? months[months.length - 2] : last || null;
    }
  }
  // Een maand is "lopend" als het de laatste maand in de data is en de laatste transactie ruim voor het einde valt.
  function isPartial(m) {
    const months = allMonths();
    if (m !== months[months.length - 1]) return false;
    const lastDay = txs.filter(t => monthKey(t.date) === m).reduce((a, t) => (t.date > a ? t.date : a), '');
    const daysInMonth = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
    return +lastDay.slice(8, 10) < daysInMonth - 3;
  }
  const lastDateIn = m => txs.filter(t => monthKey(t.date) === m).reduce((a, t) => (t.date > a ? t.date : a), '');
  const allMonths = () => [...new Set(txs.map(t => monthKey(t.date)))].sort();
  const monthLabel = (m, short) => new Date(m + '-01T12:00').toLocaleString('nl-NL', short ? { month: 'short' } : { month: 'long', year: 'numeric' });

  // ── Importeren ────────────────────────────────────────────────────────────
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const tryRead = enc => {
        const r = new FileReader();
        r.onload = () => (enc === 'utf-8' && r.result.includes('�') ? tryRead('windows-1252') : resolve(r.result));
        r.onerror = () => reject(new Error('Kon het bestand niet lezen.'));
        r.readAsText(file, enc);
      };
      tryRead('utf-8');
    });
  }

  async function importFiles(files) {
    let added = 0, banks = new Set();
    try {
      if (state.isSample) { state.raw = []; state.isSample = false; store.set('sample', false); }
      const seen = new Set(state.raw.map(t => t.date + t.amount + t.name + t.desc));
      for (const f of files) {
        const { bank, transactions } = window.PotjeParsers.parseBankFile(await readFile(f));
        banks.add(bank);
        for (const t of transactions) {
          const k = t.date + t.amount + t.name + t.desc;
          if (!seen.has(k)) { seen.add(k); state.raw.push(t); added++; }
        }
      }
    } catch (e) {
      toast(e.message, true);
      return;
    }
    state.raw.sort((a, b) => b.date.localeCompare(a.date));
    store.set('txs', state.raw);
    state.month = null;
    recompute();
    render();
    toast(added ? `${added} transacties ingelezen (${[...banks].join(', ')}).` : 'Geen nieuwe transacties gevonden.', !added);
  }

  function loadSample() {
    state.raw = window.PotjeSample.makeSampleTransactions();
    state.isSample = true;
    store.set('sample', true); store.set('txs', state.raw);
    state.month = null; recompute(); render();
  }

  // ── UI-hulpjes ────────────────────────────────────────────────────────────
  let toastTimer;
  function toast(msg, isError) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.className = ''), 4200);
  }

  const tip = $('#tooltip');
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.add('show');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
    tip.style.top = Math.max(8, y - h - 14) + 'px';
  }
  const hideTip = () => tip.classList.remove('show');

  const logo = `<span class="logo"><img src="icon.svg" alt="" width="28" height="28">Potje</span>`;

  // ── Welkomstscherm ────────────────────────────────────────────────────────
  function renderWelcome() {
    return `
    <header class="topbar"><div class="wrap">${logo}</div></header>
    <main class="wrap welcome">
      <section class="hero">
        <p class="eyebrow">Gratis · geen account nodig</p>
        <h1>Weet in 10 seconden waar je geld blijft.</h1>
        <p class="lede">Upload de export van je bank en Potje sorteert al je uitgaven automatisch. Je ziet wat je aan abonnementen kwijt bent, waar het lekt en hoeveel je per jaar kunt besparen.</p>
        <div class="dropzone" id="drop" tabindex="0" role="button" aria-label="Kies je bankexport">
          <strong>Sleep je bankexport hierheen</strong>
          <span>of <u>kies een bestand</u> · ING, Rabobank, ABN AMRO, bunq of andere CSV</span>
        </div>
        <button class="btn ghost" data-act="sample">Eerst proberen met voorbeelddata →</button>
        <p class="privacy"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z"/></svg>Je bankgegevens blijven op je eigen apparaat. We uploaden niets.</p>
      </section>
      <section class="how">
        <h2>Zo download je je transacties</h2>
        <details><summary>ING</summary><p>Mijn ING → je betaalrekening → <em>Downloaden</em> (pijltje) → kies periode en formaat <strong>Kommagescheiden CSV</strong>.</p></details>
        <details><summary>Rabobank</summary><p>Rabo Online Bankieren → <em>Rekeningen</em> → <em>Transacties downloaden</em> → formaat <strong>CSV</strong>.</p></details>
        <details><summary>ABN AMRO</summary><p>Internet Bankieren → <em>Zelf regelen</em> → <em>Transacties downloaden</em> → formaat <strong>TXT</strong>.</p></details>
        <details><summary>bunq</summary><p>App → je rekening → <em>Exporteren</em> → <strong>CSV</strong>.</p></details>
        <details><summary>Andere bank</summary><p>Elke CSV met kolommen voor datum, bedrag en naam/omschrijving werkt. Lukt het niet? Laat het ons weten.</p></details>
      </section>
    </main>`;
  }

  // ── Hoofdscherm ───────────────────────────────────────────────────────────
  const NAV = [['overzicht', 'Overzicht'], ['tips', 'Bespaartips'], ['transacties', 'Transacties'], ['budgetten', 'Budgetten']];

  function renderShell(content) {
    const months = allMonths();
    return `
    <header class="topbar"><div class="wrap">
      ${logo}
      <label class="month-select"><span class="sr">Maand</span>
        <select data-act="month">${months.slice().reverse().map(m => `<option value="${m}" ${m === state.month ? 'selected' : ''}>${monthLabel(m)}${isPartial(m) ? ' (loopt nog)' : ''}</option>`).join('')}</select>
      </label>
      <button class="btn small" data-act="upload">+ Importeer</button>
    </div>
    <nav class="tabs wrap" aria-label="Onderdelen">${NAV.map(([id, label]) => `<button data-view="${id}" class="${state.view === id ? 'active' : ''}" ${state.view === id ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</nav>
    </header>
    ${state.isSample ? `<div class="sample-bar wrap">Je bekijkt voorbeelddata. <button class="link" data-act="upload">Importeer je eigen bankexport</button></div>` : ''}
    <main class="wrap">${content}</main>
    <footer class="wrap foot">
      <span>Je gegevens staan alleen in deze browser.</span>
      <button class="link" data-act="reset">Alles wissen</button>
    </footer>`;
  }

  function monthData(m) { return txs.filter(t => monthKey(t.date) === m); }

  function delta(cur, prevAvg, goodWhenDown) {
    if (!prevAvg) return '';
    const d = cur - prevAvg;
    if (Math.abs(d) < 1) return `<span class="delta">gelijk aan normaal</span>`;
    const up = d > 0, good = goodWhenDown ? !up : up;
    return `<span class="delta ${good ? 'good' : 'bad'}">${up ? '▲' : '▼'} ${eur(Math.abs(d))} t.o.v. gemiddeld</span>`;
  }

  function renderOverview() {
    const cur = summarize(monthData(state.month));
    const prevMonths = allMonths().filter(m => m < state.month).slice(-3);
    const partial = isPartial(state.month);
    const prev = partial ? [] : prevMonths.map(m => summarize(monthData(m)));
    const avg = key => (prev.length ? prev.reduce((s, p) => s + p[key], 0) / prev.length : 0);
    const tips = buildTips(txs, state.month, cancelled());
    const top = tips[0];
    const cats = Object.entries(cur.spendByCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;
    const gone = cancelled();
    const recurring = findRecurring(txs);
    const recurringTotal = recurring.filter(r => !gone.has(r.key)).reduce((s, r) => s + r.monthly, 0);
    const budgeted = Object.entries(state.budgets).filter(([, v]) => v > 0);

    return `
    ${partial ? `<p class="partial-note">${monthLabel(state.month)} loopt nog: je ziet alles t/m ${new Date(lastDateIn(state.month) + 'T12:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}. Vergelijkingen en tips maken we op volledige maanden. <button class="link" data-month-go="${allMonths().slice(-2)[0]}">Bekijk vorige maand</button></p>` : ''}
    <div class="now-row">
      ${renderForecast()}
      ${renderSavedCounter()}
    </div>
    <h2 class="section-title">${monthLabel(state.month)}</h2>
    <section class="stats">
      <div class="stat"><span class="stat-label">Binnengekomen</span><span class="stat-value">${eur(cur.income)}</span>${delta(cur.income, avg('income'), false)}</div>
      <div class="stat"><span class="stat-label">Uitgegeven</span><span class="stat-value">${eur(cur.spend)}</span>${delta(cur.spend, avg('spend'), true)}</div>
      <div class="stat ${cur.net < 0 ? 'neg' : ''}"><span class="stat-label">Over</span><span class="stat-value">${cur.net < 0 ? '−' : ''}${eur(Math.abs(cur.net))}</span><span class="delta">${partial && !cur.income ? 'inkomen nog niet binnen' : cur.income > 0 ? Math.round((cur.net / cur.income) * 100) + '% van je inkomen' : ''}</span></div>
      <div class="stat"><span class="stat-label">Gespaard</span><span class="stat-value">${eur(Math.max(0, cur.saved))}</span><span class="delta">naar eigen rekeningen</span></div>
    </section>

    ${top ? `
    <section class="card tip-hero ${top.urgent ? 'urgent' : ''}">
      <div>
        <p class="eyebrow">Bespaartip van de week</p>
        <h2>${esc(top.title)}</h2>
        <p>${esc(top.body)}</p>
        <p class="tip-action">→ ${esc(top.action)}</p>
        ${doneButton(top)}
      </div>
      ${top.shortfall ? `<div class="tip-save"><strong class="neg">−${eur(top.shortfall)}</strong><span>tekort</span></div>` : `<div class="tip-save"><span>Tot</span><strong>${eur(top.yearly)}</strong><span>per jaar</span></div>`}
    </section>
    ${tips.length > 1 ? `<button class="more-tips" data-view="tips">Nog ${tips.length - 1} ${tips.length - 1 === 1 ? 'tip' : 'tips'} gevonden${state.premium ? '' : ' · Premium'} →</button>` : ''}` : ''}

    <div class="grid2">
      <section class="card">
        <header class="card-head"><h2>Waar ging het heen?</h2><span class="muted">${monthLabel(state.month)}</span></header>
        ${cats.length ? `<ul class="hbars" aria-label="Uitgaven per categorie">
          ${cats.map(([c, v]) => `
          <li><button class="hbar" data-cat="${c}" data-tip="${esc(CAT[c].label)}|${eur2(v)}|${Math.round((v / cur.spend) * 100)}% van je uitgaven">
            <span class="hbar-label">${esc(CAT[c].label)}</span>
            <span class="hbar-track"><span class="hbar-fill" style="width:${Math.max(1.5, (v / maxCat) * 100)}%"></span></span>
            <span class="hbar-value">${eur(v)}</span>
          </button></li>`).join('')}
        </ul><p class="hint">Klik op een categorie om de transacties te zien.</p>` : '<p class="muted">Geen uitgaven in deze maand.</p>'}
      </section>

      <section class="card">
        <header class="card-head"><h2>Uitgaven per maand</h2></header>
        ${renderMonthChart()}
        ${budgeted.length ? `<h3 class="sub">Budgetten</h3>${renderBudgetBars(cur, budgeted.slice(0, 4))}<button class="link" data-view="budgetten">Alle budgetten →</button>`
          : `<div class="nudge"><p>Stel een maandbudget in per categorie en zie meteen wanneer je er overheen gaat.</p><button class="btn small ghost" data-view="budgetten">Budget instellen</button></div>`}
      </section>
    </div>

    <section class="card">
      <header class="card-head"><h2>Vaste lasten en abonnementen</h2><span class="muted">${eur(recurringTotal)} per maand · ${eur(recurringTotal * 12)} per jaar</span></header>
      ${recurring.length ? `<ul class="recurring">${recurring.map(r => renderRecurringItem(r, gone.has(r.key))).join('')}</ul>`
        : '<p class="muted">Importeer minstens twee maanden om terugkerende betalingen te vinden.</p>'}
    </section>`;
  }

  function renderForecast() {
    const f = forecast(txs, cancelled());
    if (!f) return `<section class="card forecast"><p class="eyebrow">Vrij te besteden</p><p class="muted">Importeer minstens twee maanden, dan rekenen we uit hoeveel je per dag kunt uitgeven tot je volgende salaris.</p></section>`;
    const payDate = new Date(f.nextPay + 'T12:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
    const asOf = new Date(f.asOf + 'T12:00');
    const stale = (Date.now() - asOf) / 864e5 > 4;
    const short = f.remaining < 0;
    return `<section class="card forecast ${short ? 'short' : ''}">
      <p class="eyebrow">Vrij te besteden tot je salaris</p>
      ${short
        ? `<p class="big neg">−${eur(-f.remaining)}</p><p>Je komt <strong>${eur(-f.remaining)} tekort</strong> tot ${payDate}. Stel grote aankopen uit en kijk bij je bespaartips waar je kunt schrappen.</p>`
        : `<p class="big">${eur(f.perDay)} <span>per dag</span></p><p><strong>${eur(f.remaining)}</strong> voor de komende ${f.daysLeft} ${f.daysLeft === 1 ? 'dag' : 'dagen'}, tot je salaris op ${payDate}.</p>`}
      <details class="calc"><summary>Hoe rekenen we dit?</summary>
        <dl>
          <dt>Binnengekomen sinds je vorige salaris</dt><dd>${eur2(f.income)}</dd>
          <dt>Uitgegeven</dt><dd>−${eur2(f.spent)}</dd>
          ${f.saved ? `<dt>Naar sparen</dt><dd>−${eur2(f.saved)}</dd>` : ''}
          <dt>Nog af te schrijven${f.upcoming.length ? ': ' + f.upcoming.map(u => esc(u.name)).join(', ') : ''}</dt><dd>−${eur2(f.upcomingTotal)}</dd>
          <dt class="total">Vrij te besteden</dt><dd class="total">${f.remaining < 0 ? '−' : ''}${eur2(Math.abs(f.remaining))}</dd>
        </dl>
      </details>
      <p class="asof ${stale ? 'stale' : ''}">Op basis van je export t/m ${asOf.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}.${stale ? ' <button class="link" data-act="upload">Importeer een nieuwe export</button> voor een actueel bedrag.' : ''}</p>
    </section>`;
  }

  function renderSavedCounter() {
    const total = savedTotal(), items = Object.values(state.done);
    return `<section class="card counter">
      <p class="eyebrow">Bespaard dankzij Potje</p>
      ${items.length
        ? `<p class="big">${eur(total)} <span>per jaar</span></p>
           <p class="muted small">${items.length} ${items.length === 1 ? 'actie' : 'acties'}: ${items.slice(-3).map(d => esc(d.label)).join(', ')}${items.length > 3 ? '…' : ''}</p>
           ${!state.premium && total > 29 ? `<p class="small good-text">Dat is ${Math.floor(total / 29)}× wat Premium per jaar kost.</p>` : ''}`
        : `<p class="big zero">€ 0</p><p class="muted small">Vink een bespaartip af of zeg een abonnement op. Wij tellen bij wat het je per jaar oplevert.</p>`}
    </section>`;
  }

  function renderRecurringItem(r, isCancelled) {
    const canCancel = CANCELLABLE.includes(r.category);
    return `<li class="${isCancelled ? 'cancelled' : ''}">
      <div class="rec-top">
        <span>${esc(r.name)}<small>${esc(CAT[r.category].label)}</small></span>
        <span class="amt">${eur2(r.monthly)}<small>${eur(r.monthly * 12)}/jaar</small></span>
      </div>
      ${r.increase && !isCancelled ? `<span class="status warning"><i aria-hidden="true">!</i>${eur2(r.increase)} per maand duurder (was ${eur2(r.previous)})</span>` : ''}
      ${isCancelled
        ? `<div class="rec-actions"><span class="status good"><i aria-hidden="true">✓</i>Opgezegd · ${eur(r.monthly * 12)}/jaar bespaard</span><button class="link small" data-act="cancel" data-key="${esc(r.key)}" data-name="${esc(r.name)}" data-yearly="${r.monthly * 12}">Ongedaan maken</button></div>`
        : canCancel ? `<div class="rec-actions"><a class="chip" href="${cancelUrl(r)}" target="_blank" rel="noopener">Opzeggen ↗</a><button class="chip" data-act="cancel" data-key="${esc(r.key)}" data-name="${esc(r.name)}" data-yearly="${r.monthly * 12}">Opgezegd</button></div>` : ''}
    </li>`;
  }

  function doneButton(t) {
    if (t.shortfall) return '';
    const on = !!state.done['tip:' + t.id];
    return `<button class="chip ${on ? 'on' : ''}" aria-pressed="${on}" data-act="done" data-id="${esc(t.id)}" data-label="${esc(t.action)}" data-yearly="${t.yearly}">${on ? '✓ Gedaan, staat op je bespaarteller' : 'Gedaan'}</button>`;
  }

  function renderMonthChart() {
    const months = allMonths().slice(-6);
    const data = months.map(m => ({ m, ...summarize(monthData(m)) }));
    const max = Math.max(...data.map(d => d.spend), 1);
    const W = 100 / data.length;
    return `<div class="cols" role="img" aria-label="Uitgaven per maand: ${data.map(d => `${monthLabel(d.m)} ${eur(d.spend)}`).join(', ')}">
      ${data.map(d => `<button class="col ${d.m === state.month ? 'current' : ''}" style="width:${W}%" data-month="${d.m}"
          data-tip="${monthLabel(d.m)}|${eur2(d.spend)} uitgegeven|${eur(d.income)} binnengekomen">
        <span class="col-val">${d.m === state.month ? eur(d.spend) : ''}</span>
        <span class="col-bar" style="height:${Math.max(2, (d.spend / max) * 100)}%"></span>
        <span class="col-label">${monthLabel(d.m, true)}</span>
      </button>`).join('')}
    </div>`;
  }

  function renderBudgetBars(cur, entries) {
    return `<ul class="budgets">${entries.map(([c, b]) => {
      const spent = cur.spendByCat[c] || 0, pct = spent / b;
      const status = pct > 1 ? ['critical', 'Over budget'] : pct > 0.85 ? ['warning', 'Bijna op'] : ['good', 'Op koers'];
      return `<li>
        <div class="budget-row"><span>${esc(CAT[c].label)}</span><span class="muted">${eur(spent)} van ${eur(b)}</span></div>
        <div class="budget-track"><span class="budget-fill ${status[0]}" style="width:${Math.min(100, pct * 100)}%"></span></div>
        <span class="status ${status[0]}"><i aria-hidden="true">${status[0] === 'good' ? '✓' : '!'}</i>${status[1]}${pct > 1 ? ` · ${eur(spent - b)} erover` : ''}</span>
      </li>`;
    }).join('')}</ul>`;
  }

  function renderTips() {
    const tips = buildTips(txs, state.month, cancelled());
    if (!tips.length) return `<section class="card"><h2>Geen tips deze maand</h2><p class="muted">Netjes! Importeer meer maanden voor betere vergelijkingen.</p></section>`;
    const total = tips.reduce((s, t) => s + t.yearly, 0);
    const firstFree = tips[0].shortfall ? 2 : 1; // de tekort-melding telt niet als tip
    return `
    <section class="tips-head">
      <h1>Je kunt tot <span class="hl">${eur(total)}</span> per jaar besparen</h1>
      <p class="muted">Gebaseerd op je uitgaven in ${monthLabel(state.month)}, vergeleken met de maanden ervoor.</p>
    </section>
    <ol class="tips">
      ${tips.map((t, i) => {
        const locked = i >= firstFree && !state.premium;
        return `<li class="card tip ${locked ? 'locked' : ''} ${t.urgent ? 'urgent' : ''} ${state.done['tip:' + t.id] ? 'is-done' : ''}" ${locked ? 'aria-hidden="true"' : ''}>
          <div>${t.alert ? '<span class="status warning"><i aria-hidden="true">!</i>Prijsstijging</span>' : ''}<h2>${esc(t.title)}</h2><p>${esc(t.body)}</p><p class="tip-action">→ ${esc(t.action)}</p>${locked ? '' : doneButton(t)}</div>
          ${t.shortfall ? `<div class="tip-save"><strong class="neg">−${eur(t.shortfall)}</strong><span>tekort</span></div>` : `<div class="tip-save"><strong>${eur(t.yearly)}</strong><span>per jaar</span></div>`}
        </li>`;
      }).join('')}
    </ol>
    ${!state.premium && tips.length > firstFree ? renderPaywall(tips.length - firstFree, tips.slice(firstFree).reduce((s, t) => s + t.yearly, 0)) : ''}`;
  }

  function renderPaywall(n, amount) {
    return `<section class="card paywall">
      <p class="eyebrow">Potje Premium</p>
      <h2>Ontgrendel ${n} ${n === 1 ? 'tip' : 'tips'} ter waarde van ${eur(amount)} per jaar</h2>
      <ul class="checks">
        <li>Alle bespaartips met eurobedrag, na elke import opnieuw</li>
        <li>Melding zodra een abonnement duurder wordt</li>
        <li>Afvinken en zien hoeveel je al bespaard hebt</li>
      </ul>
      <div class="plans">
        <button class="plan" data-act="buy" data-plan="yearly"><span class="badge">Voordeligst</span><strong>${CONFIG.priceYearly}</strong><span>per jaar</span></button>
        <button class="plan" data-act="buy" data-plan="monthly"><strong>${CONFIG.priceMonthly}</strong><span>per maand</span></button>
      </div>
      <p class="muted small">Je verdient het abonnement meestal met de eerste tip al terug. Je kunt elke maand opzeggen.</p>
    </section>`;
  }

  function renderTransactions() {
    const q = state.search.toLowerCase();
    const list = monthData(state.month).filter(t =>
      (!state.catFilter || t.category === state.catFilter) &&
      (!q || (t.name + ' ' + t.desc).toLowerCase().includes(q)));
    const total = list.reduce((s, t) => s + t.amount, 0);
    const opts = sel => CATEGORIES.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.label}</option>`).join('');
    let lastDate = '';
    return `
    <section class="card">
      <div class="filters">
        <input type="search" placeholder="Zoek op naam of omschrijving" value="${esc(state.search)}" data-act="search" aria-label="Zoeken">
        <select data-act="catfilter" aria-label="Categorie"><option value="">Alle categorieën</option>${opts(state.catFilter)}</select>
      </div>
      <p class="muted small">${list.length} transacties · totaal ${total < 0 ? '−' : ''}${eur2(Math.abs(total))} · klopt een categorie niet? Pas hem aan, dan onthoudt Potje dat voor die winkel of persoon.</p>
      <ul class="txlist">
        ${list.map(t => {
          const head = t.date !== lastDate ? `<li class="txdate">${new Date(t.date + 'T12:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</li>` : '';
          lastDate = t.date;
          return head + `<li class="tx">
            <div class="tx-main"><strong>${esc(t.name)}</strong><small>${esc(t.desc)}</small></div>
            <select data-act="setcat" data-id="${t.id}" aria-label="Categorie voor ${esc(t.name)}">${opts(t.category)}</select>
            <span class="tx-amt ${t.amount > 0 ? 'pos' : ''}">${t.amount > 0 ? '+' : '−'}${eur2(Math.abs(t.amount))}</span>
          </li>`;
        }).join('') || '<li class="muted">Niets gevonden.</li>'}
      </ul>
    </section>`;
  }

  function renderBudgetsView() {
    const cur = summarize(monthData(state.month));
    const prevMonths = allMonths().slice(-4, -1);
    const spendCats = CATEGORIES.filter(c => c.kind === 'spend');
    const budgeted = Object.entries(state.budgets).filter(([, v]) => v > 0);
    return `
    <div class="grid2">
      <section class="card">
        <header class="card-head"><h2>Maandbudgetten</h2></header>
        <p class="muted small">Tip: begin met de 2 of 3 posten die je zelf kunt sturen, zoals boodschappen, uit eten en shopping.</p>
        <ul class="budget-inputs">
          ${spendCats.map(c => {
            const avg = prevMonths.length ? prevMonths.reduce((s, m) => s + (summarize(monthData(m)).spendByCat[c.id] || 0), 0) / prevMonths.length : 0;
            return `<li><label for="b-${c.id}">${c.label}<small>${avg ? 'gemiddeld ' + eur(avg) : ''}</small></label>
              <span class="euro-input">€<input id="b-${c.id}" type="number" min="0" step="10" inputmode="numeric" placeholder="${avg ? Math.round(avg * 0.9 / 10) * 10 : '–'}" value="${state.budgets[c.id] || ''}" data-act="budget" data-cat="${c.id}"></span></li>`;
          }).join('')}
        </ul>
      </section>
      <section class="card">
        <header class="card-head"><h2>${monthLabel(state.month)}</h2></header>
        ${budgeted.length ? renderBudgetBars(cur, budgeted) : '<p class="muted">Vul links een bedrag in om je voortgang te zien.</p>'}
      </section>
    </div>`;
  }

  // ── Renderen & events ─────────────────────────────────────────────────────
  function render() {
    hideTip();
    const app = $('#app');
    if (!txs.length) { app.innerHTML = renderWelcome(); return; }
    const views = { overzicht: renderOverview, tips: renderTips, transacties: renderTransactions, budgetten: renderBudgetsView };
    app.innerHTML = renderShell(views[state.view]());
  }

  function setView(v) {
    state.view = v; render();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act],[data-view],[data-cat].hbar,[data-month].col,[data-month-go],#drop');
    if (!el) return;
    if (el.dataset.monthGo) { state.month = el.dataset.monthGo; return render(); }
    if (el.id === 'drop') return $('#file').click();
    if (el.dataset.view) return setView(el.dataset.view);
    if (el.classList.contains('hbar')) { state.catFilter = el.dataset.cat; state.search = ''; hideTip(); return setView('transacties'); }
    if (el.classList.contains('col')) { state.month = el.dataset.month; hideTip(); return render(); }
    switch (el.dataset.act) {
      case 'upload': return $('#file').click();
      case 'sample': return loadSample();
      case 'reset':
        if (confirm('Weet je zeker dat je alle transacties, budgetten en instellingen in deze browser wilt wissen?')) {
          store.clear(); Object.assign(state, { raw: [], rules: {}, budgets: {}, done: {}, premium: false, isSample: false, view: 'overzicht' }); recompute(); render();
        }
        return;
      case 'done': return toggleDone('tip:' + el.dataset.id, el.dataset.label, +el.dataset.yearly);
      case 'cancel': return toggleDone('cancel:' + el.dataset.key, el.dataset.name + ' opgezegd', +el.dataset.yearly);
      case 'buy': {
        const link = el.dataset.plan === 'yearly' ? CONFIG.paymentLinkYearly : CONFIG.paymentLinkMonthly;
        if (link) location.href = link;
        else toast('Betalen is nog niet gekoppeld. Vul je Stripe Payment Links in bij CONFIG in js/app.js.', true);
        return;
      }
    }
  });

  document.addEventListener('keydown', e => {
    if (e.target.id === 'drop' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); $('#file').click(); }
  });

  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'file') { if (el.files.length) importFiles([...el.files]); el.value = ''; return; }
    switch (el.dataset.act) {
      case 'month': state.month = el.value; return render();
      case 'catfilter': state.catFilter = el.value; return render();
      case 'setcat': {
        const t = txs[+el.dataset.id];
        const key = normalizeName(t.name);
        state.rules[key] = el.value; store.set('rules', state.rules);
        const n = txs.filter(x => normalizeName(x.name) === key).length;
        recompute(); render();
        return toast(`${n === 1 ? 'Transactie' : `Alle ${n} transacties`} van ${t.name} → ${CAT[el.value].label}`);
      }
      case 'budget': {
        const v = Math.max(0, Math.round(+el.value || 0));
        if (v) state.budgets[el.dataset.cat] = v; else delete state.budgets[el.dataset.cat];
        store.set('budgets', state.budgets);
        return render();
      }
    }
  });

  let searchTimer;
  document.addEventListener('input', e => {
    if (e.target.dataset.act !== 'search') return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value; render();
      const s = $('[data-act="search"]'); s.focus(); s.setSelectionRange(s.value.length, s.value.length);
    }, 200);
  });

  // Tooltips voor de grafieken (muis en toetsenbord).
  const tipFor = el => {
    const [a, b, c] = el.dataset.tip.split('|');
    return `<strong>${esc(a)}</strong><span>${esc(b)}</span>${c ? `<small>${esc(c)}</small>` : ''}`;
  };
  document.addEventListener('pointermove', e => {
    const el = e.target.closest('[data-tip]');
    if (el) showTip(tipFor(el), e.clientX, e.clientY); else hideTip();
  });
  document.addEventListener('focusin', e => {
    const el = e.target.closest('[data-tip]');
    if (el) { const r = el.getBoundingClientRect(); showTip(tipFor(el), r.left + r.width / 2, r.top); } else hideTip();
  });
  window.addEventListener('scroll', hideTip, { passive: true });

  // Slepen en neerzetten, overal op de pagina.
  ['dragenter', 'dragover'].forEach(t => document.addEventListener(t, e => { e.preventDefault(); document.body.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach(t => document.addEventListener(t, e => {
    e.preventDefault();
    if (t === 'drop' || e.relatedTarget === null) document.body.classList.remove('dragging');
    if (t === 'drop' && e.dataTransfer.files.length) importFiles([...e.dataTransfer.files]);
  }));

  recompute();
  render();
})();
