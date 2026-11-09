/* Demo 360 graden klantprofiel · Uniek Sporten x Techonomy */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));

  const state = {
    pkey: 'anon', page: 'home', p: clone(PERSONAS.anon),
    panel: window.innerWidth >= 1200, labels: true, tour: null, flash: new Set(), toastClosed: false,
  };

  /* ---------- logica ---------- */
  const val = (p, k) => p.profile[k] ? p.profile[k].v : null;
  const active = s => s === 'relevant' || s === 'gestart';
  const nba = p => (ACTIONS.find(a => a.key !== 'inspiratie' && active(p.acties[a.key])) || ACTIONS.find(a => a.key === 'inspiratie')).key;
  const filled = p => FIELDS.filter(x => p.profile[x.key]).length;

  function fase(p) {
    if (p.key === 'mark') return { n: 2, why: 'Profiel compleet, nog geen beweegadvies of sport gekozen' };
    if (p.key === 'kim') return { n: 3, why: 'Sportzoeker afgerond, proefles nog niet gestart' };
    if (p.key === 'henk') return { n: 3, why: 'Beweegadvies afgerond, zoekt nu een club' };
    const c = filled(p);
    return c >= 3 ? { n: 2, why: `${c} profielvelden bekend: we weten wie het is` } : { n: 1, why: c ? `${c} van 8 profielvelden bekend` : 'We weten nog (bijna) niets' };
  }

  const beperking = p => {
    const b = val(p, 'type_beperking') || '';
    if (/NAH/.test(b)) return 'NAH';
    if (/Chronisch/.test(b)) return 'Chronisch';
    if (/Lichamelijk/.test(b)) return 'Lichamelijk';
    if (/Visueel/.test(b)) return 'Visueel';
    return null;
  };

  const city = p => val(p, 'woonplaats');
  const name = p => p.first;

  /* ---------- content per next best action ---------- */
  function nbaContent(key, p) {
    const c = city(p), n = name(p);
    const map = {
      beweegadvies: { icon: '☎', title: 'Gratis persoonlijk beweegadvies', text: `Een beweegadviseur belt je binnen een week en denkt met je mee: wat past bij jou${beperking(p) === 'NAH' ? ' na je herseninfarct' : ''}? Zonder verplichtingen.`, cta: 'Plan een gesprek', go: 'home' },
      vervoer: { icon: '🚐', title: 'Regel je vervoer naar de training', text: `Met Valys of de regiotaxi${c ? ' in ' + c : ''} kom je zonder gedoe bij de club. We zoeken uit wat voor jou geldt.`, cta: 'Bekijk vervoersopties', go: 'home' },
      hulpmiddelen: { icon: '♿', title: 'Probeer een sporthulpmiddel', text: 'Leen eerst, beslis later. Bekijk welke sporthulpmiddelen je gratis kunt uitproberen.', cta: 'Bekijk hulpmiddelen', go: 'home' },
      maatje: { icon: '🤝', title: `Sporten met een sportmaatje${c ? ' in ' + c : ''}`, text: 'Samen is de eerste stap makkelijker. We koppelen je aan een maatje met dezelfde sportwens.', cta: 'Vind een sportmaatje', go: 'home' },
      buurtsportcoach: { icon: '💬', title: 'Een buurtsportcoach denkt met je mee', text: `${c ? 'De buurtsportcoach in ' + c : 'Een buurtsportcoach'} helpt je kosteloos op weg, in een tempo dat bij je past.`, cta: 'Neem contact op', go: 'home' },
      sportzoeker: { icon: '🔍', title: `Vind een club${c ? ' in ' + c : ' bij jou in de buurt'}`, text: `We hebben de Sportzoeker al voor je ingevuld${beperking(p) ? ' met ' + (beperking(p) === 'NAH' ? 'NAH' : beperking(p).toLowerCase()) : ''}${c ? ' en ' + c : ''}. Bekijk de best passende sporten.`, cta: 'Bekijk jouw resultaten', go: 'sportzoeker' },
      proefles: { icon: '🏀', title: `Plan je proefles rolstoelbasketbal`, text: `Bij de club in Amsterdam Nieuw-West (3,2 km). Een sportrolstoel staat klaar en de eerste les is gratis.`, cta: 'Plan je proefles', go: 'sportzoeker' },
      thuisworkouts: { icon: '▶', title: 'Begin thuis, in 7 minuten', text: 'Start met een korte workout uit Uniek Sporten Thuis. Op jouw tempo, wanneer het jou uitkomt.', cta: 'Start de workout', go: 'home' },
      financien: { icon: '€', title: 'Hulp bij de kosten', text: 'Fondsen en regelingen die je sport betaalbaar maken.', cta: 'Doe de fondsencheck', go: 'home' },
      inspiratie: { icon: '★', title: 'Lees hoe anderen begonnen', text: 'Echte verhalen van sporters met een beperking. Misschien zit jouw sport ertussen.', cta: 'Lees de verhalen', go: 'home' },
    };
    return map[key];
  }

  function hero(p) {
    if (p.key === 'mark') return { eyebrow: 'Welkom terug, Mark', t1: 'Weer in beweging', t2: 'na je herseninfarct.', text: 'Stefan en Yolanda gingen je voor: met kleine stappen terug naar sport. Wij helpen je met de eerste, op jouw tempo en zonder druk.', img: STORIES[1].img, why: 'type_beperking = NAH · sportervaring = herintreder' };
    if (p.key === 'kim') return { eyebrow: 'Welkom terug, Kim', t1: 'Klaar voor', t2: 'teamsport, Kim?', text: 'Je hebt rolstoelbasketbal in Amsterdam gevonden en je sportrolstoel geregeld. Nog één stap: je eerste training.', img: IMG.hulpmiddelHome, why: 'sportvoorkeur = rolstoelbasketbal · sportzoeker = afgerond' };
    if (p.key === 'henk') return { eyebrow: 'Welkom terug, Henk', t1: 'Blijven bewegen', t2: 'met Parkinson.', text: 'Klimmen, boksen, wandelen: steeds meer clubs in Eindhoven hebben een groep voor mensen met Parkinson. Samen sporten houdt je in beweging.', img: STORIES[2].img, why: 'type_beperking = chronisch · woonplaats = Eindhoven · ambitie = sociaal' };
    const b = beperking(p);
    if (b) {
      const s = STORIES.find(x => x.tags.includes(b));
      const w = { NAH: ['NAH', 'NAH'], Chronisch: ['een chronische aandoening', 'chronische aandoeningen'], Lichamelijk: ['een lichamelijke beperking', 'lichamelijke beperkingen'], Visueel: ['een visuele beperking', 'visuele beperkingen'] }[b];
      return { eyebrow: val(p, 'type_bezoeker') === 'Ouder of naaste' ? 'Voor jouw kind of naaste' : 'Speciaal voor jou', t1: `Sporten met ${w[0]}?`, t2: 'Zo begin je.', text: `Honderden sportaanbieders hebben ervaring met ${w[1]}. ${city(p) ? 'We laten je zien wat er in ' + city(p) + ' kan.' : 'Vertel ons waar je woont, dan zoeken we mee.'}`, img: s ? s.img : IMG.zoekjerot, why: `type_beperking = ${b}` };
    }
    return null;
  }

  function stories(p) {
    const b = beperking(p), c = city(p);
    if (!b) return ['stefan', 'marathon', 'wk'].map(id => STORIES.find(s => s.id === id));
    const score = s => (s.tags.includes(b) ? 10 : 0) + (c && s.tags.includes(c) ? 5 : 0) + (s.tags.includes('algemeen') ? 1 : 0);
    return [...STORIES].sort((a, z) => score(z) - score(a)).slice(0, 3);
  }

  function workouts(p) {
    const b = beperking(p), low = val(p, 'vertrouwen_sporten') === 'Laag';
    return [...WORKOUTS].sort((a, z) => ((z.tags.includes(b) ? 2 : 0) + (low && z.tags.includes('laag') ? 1 : 0)) - ((a.tags.includes(b) ? 2 : 0) + (low && a.tags.includes('laag') ? 1 : 0))).slice(0, 3);
  }

  /* ---------- UI helpers ---------- */
  const tag = why => state.labels && why ? `<span class="pz-tag" title="Gepersonaliseerd op basis van het profiel"><b>Gepersonaliseerd</b> ${esc(why)}</span>` : '';
  const pz = why => state.labels && why ? ' pz' : '';

  /* ---------- demobalk ---------- */
  function renderBar() {
    const persons = ['anon', 'mark', 'kim', 'henk'].map(k => {
      const x = PERSONAS[k];
      return `<button class="chip ${state.pkey === k ? 'on' : ''}" data-persona="${k}" title="${esc(x.subtitle)}"><span class="av av-${k}">${x.initials}</span><span class="chip-t"><b>${k === 'anon' ? 'Anoniem' : esc(x.first)}</b><small>${k === 'anon' ? 'eerste bezoek' : esc(x.subtitle.split(' · ')[1])}</small></span></button>`;
    }).join('');
    const pages = [['home', 'Website'], ['sportzoeker', 'Sportzoeker'], ['mail', 'E-mail']].map(([k, l]) => `<button class="tab ${state.page === k ? 'on' : ''}" data-page="${k}">${l}</button>`).join('');
    $('#demobar').innerHTML = `
      <div class="db-l"><span class="db-brand">DEMO</span><span class="db-title">360° klantprofiel</span></div>
      <div class="db-persons" role="group" aria-label="Kies een bezoeker">${persons}</div>
      <div class="db-pages" role="group" aria-label="Kanaal">${pages}</div>
      <div class="db-r">
        <button class="tgl ${state.labels ? 'on' : ''}" data-act="labels" title="Toon waarom iets gepersonaliseerd is">Labels</button>
        <button class="tgl ${state.panel ? 'on' : ''}" data-act="panel">Profiel</button>
        <button class="tgl tour-btn" data-act="tour">▶ Rondleiding</button>
      </div>`;
  }

  /* ---------- site header/footer ---------- */
  function header(p) {
    return `
    <div class="us-top"><div class="wrap">
      <span class="us-top-l">◐ Toegankelijkheid</span>
      <span class="us-top-r"><span>Contact</span><span class="${city(p) ? 'pz-inline' : ''}">📍 ${city(p) ? esc(city(p)) : 'Kies je gemeente'} ⌄</span></span>
    </div></div>
    <header class="us-nav"><div class="wrap">
      <nav><a>Voor sporters ⌄</a><a>Voor sportclubs ⌄</a><a>Voor professionals ⌄</a></nav>
      <a class="us-logo" data-page="home"><img src="${IMG.logo}" alt="Uniek Sporten"></a>
      <div class="us-nav-r"><div class="us-search">🔍 <span>Waar ben je naar op zoek?</span></div><span class="us-user">👤 ${p.known ? esc(p.first) : 'Inloggen'}</span></div>
    </div></header>`;
  }

  const footer = () => `<footer class="us-foot"><div class="wrap">
      <img src="${IMG.logo}" alt="Uniek Sporten">
      <div><b>Uniek Sporten</b><br>Een initiatief van Fonds Gehandicaptensport</div>
      <div class="demo-note">Demo voor de jaarplansessie 2027 · Techonomy. Verhalen, workouts en beelden komen van unieksporten.nl. Personas, clubs en afstanden zijn illustratief.</div>
    </div></footer>`;

  /* ---------- pagina: home ---------- */
  function home(p) {
    const h = hero(p);
    const nk = nba(p), nc = nbaContent(nk, p);
    const showNba = p.key !== 'anon' || beperking(p);
    const heroHtml = h ? `
      <section class="hero${pz(h.why)}">${tag(h.why)}<div class="wrap hero-grid">
        <div><p class="eyebrow">${esc(h.eyebrow)}</p><h1>${esc(h.t1)}<br><span>${esc(h.t2)}</span></h1><p class="lead">${esc(h.text)}</p>
        <div class="btns"><button class="btn or" data-go="${nc.go}">${esc(nc.cta)}</button><button class="btn nv" data-page="sportzoeker">Zoek je sport</button></div></div>
        <div class="hero-img"><img src="${h.img}" alt=""></div></div></section>` : `
      <section class="hero"><div class="wrap hero-grid">
        <div><h1 class="gray">Zoek je rot?<br>Hoeft niet meer.</h1><p class="lead">Een sport vinden hoeft geen marathon te zijn! Met onze nieuwe campagne Zoekjerot.nl laten we zien hoe makkelijk het kan zijn om antwoord te vinden op je vragen over sporten met een beperking. Met onze nieuwe online assistent kun je je vraag gewoon typen of inspreken en krijg je direct antwoord.</p>
        <div class="btns"><button class="btn or">Start onze AI-assistent</button><button class="btn nv">Uniek Sporten Blessurevrij</button></div></div>
        <div class="hero-img"><img src="${IMG.zoekjerot}" alt=""></div></div></section>`;

    const nbaHtml = showNba ? `
      <section class="nba-band"><div class="wrap"><div class="nba${pz('next_best_action = ' + nk)}">${tag('next_best_action = ' + nk)}
        <div class="nba-ic">${nc.icon}</div>
        <div class="nba-t"><p class="eyebrow">Jouw volgende stap</p><h2>${esc(nc.title)}</h2><p>${esc(nc.text)}</p></div>
        <button class="btn or" data-go="${nc.go}">${esc(nc.cta)} →</button>
      </div></div></section>` : '';

    const tiles = [
      { k: 'sportzoeker', t: 'Sport zoeken', img: IMG.tileSport, go: 'sportzoeker' },
      { k: 'thuisworkouts', t: 'Thuis bewegen', img: IMG.tileThuis },
      { k: 'hulpmiddelen', t: 'Hulpmiddelen', img: IMG.tileHulp },
      { k: 'beweegadvies', t: 'Beweegadvies', img: IMG.tileAdvies },
    ];
    const rank = t => p.key === 'anon' && !beperking(p) ? 0 : (t.k === nk ? 3 : p.acties[t.k] === 'gestart' ? 2 : p.acties[t.k] === 'relevant' ? 1 : p.acties[t.k] === 'afgerond' ? -1 : 0);
    const sorted = [...tiles].sort((a, z) => rank(z) - rank(a));
    const badge = t => {
      if (p.key === 'anon' && !beperking(p)) return '';
      if (t.k === nk) return '<span class="badge or">Jouw volgende stap</span>';
      const s = p.acties[t.k];
      if (s === 'gestart') return '<span class="badge nv">Ga verder</span>';
      if (s === 'relevant') return '<span class="badge lt">Past bij jou</span>';
      if (s === 'afgerond') return '<span class="badge ok">✓ Gedaan</span>';
      return '';
    };
    const personalTiles = !(p.key === 'anon' && !beperking(p));
    const tilesHtml = `
      <section class="gray-sec"><div class="wrap${pz(personalTiles ? 'volgorde op actiestatussen' : '')}">${personalTiles ? tag('volgorde op actiestatussen') : ''}
        <h2 class="sec-t">Waarmee kunnen wij je helpen?</h2>
        <div class="tiles">${sorted.map(t => `<a class="tile ${t.k === nk && personalTiles ? 'hl' : ''}" ${t.go ? `data-page="${t.go}"` : ''}>${badge(t)}<h3>${t.t}</h3><img src="${t.img}" alt=""></a>`).join('')}</div>
      </div></section>`;

    const st = stories(p);
    const stWhy = beperking(p) ? `verhalen over ${beperking(p) === 'Lichamelijk' ? 'lichamelijke beperking' : beperking(p)}` : '';
    const storiesHtml = `
      <section class="sec"><div class="wrap${pz(stWhy)}">${tag(stWhy)}
        <div class="sec-h"><h2 class="sec-t">${beperking(p) ? 'Verhalen die bij jou passen' : 'Inspiratie en verhalen'}</h2><a class="btn or sm" href="${SITE}/actueel/nieuws" target="_blank" rel="noopener">Meer nieuws</a></div>
        <div class="stories">
          <a class="story big" href="${st[0].url}" target="_blank" rel="noopener"><img src="${st[0].img}" alt=""><span>${esc(st[0].title)}</span></a>
          <div class="stack">${st.slice(1).map(s => `<a class="story" href="${s.url}" target="_blank" rel="noopener"><img src="${s.img}" alt=""><span>${esc(s.title)}</span></a>`).join('')}</div>
        </div></div></section>`;

    const showW = active(p.acties.thuisworkouts);
    const wo = workouts(p);
    const woWhy = `thuisworkouts = ${p.acties.thuisworkouts}${val(p, 'vertrouwen_sporten') === 'Laag' ? ' · vertrouwen = laag' : ''}`;
    const workoutHtml = showW ? `
      <section class="sec thuis"><div class="wrap${pz(woWhy)}">${tag(woWhy)}
        <div class="sec-h"><h2 class="sec-t">${p.acties.thuisworkouts === 'gestart' ? `Ga verder waar je gebleven was, ${esc(name(p))}` : 'Alvast thuis beginnen?'}</h2><span class="muted">Uniek Sporten Thuis</span></div>
        <div class="workouts">${wo.map(w => `<div class="wo"><div class="wo-img"><img src="${w.img}" alt=""><span class="play">▶</span></div><b>${esc(w.title)}</b><small>⏱ ${w.min} min</small></div>`).join('')}</div>
      </div></section>` : '';

    const c = city(p);
    const loc = c ? LOCAL.filter(l => l.near.includes(c)) : [];
    const localItems = [...loc, ...LOCAL.filter(l => !loc.includes(l) && l.near.length === 0), ...LOCAL.filter(l => !loc.includes(l))].filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
    const localHtml = `
      <section class="gray-sec"><div class="wrap${pz(c ? 'woonplaats = ' + c : '')}">${c ? tag('woonplaats = ' + c) : ''}
        <h2 class="sec-t">${c ? 'Bij jou in de buurt' : 'Lokaal nieuws & agenda'}</h2>
        <div class="local">
          <div class="local-card">${c ? `<div class="pin">📍</div><p><b>Nieuws en agenda rond ${esc(c)}</b><br>We tonen sportnieuws uit jouw regio.</p><button class="btn or sm">Wijzig gemeente</button>` : `<div class="pin">📍</div><p><b>Kies jouw gemeente en lees hier het laatste nieuws bij jou in de buurt</b></p><button class="btn or sm">Kies je gemeente</button>`}</div>
          ${localItems.map(l => `<a class="local-item" href="${l.url}" target="_blank" rel="noopener"><img src="${l.img}" alt=""><div><span class="region">${esc(l.region)}</span><b>${esc(l.title)}</b></div></a>`).join('')}
        </div></div></section>`;

    const sz = szFields(p);
    const szHtml = `
      <section class="sz-teaser"><div class="wrap sz-grid">
        <div class="${pz(sz.some(x => x.auto) ? 'velden uit het profiel' : '')}">${sz.some(x => x.auto) ? tag('velden uit het profiel') : ''}
          <h2 class="sec-t">Vind je Unieke Sport</h2>
          <div class="sz-form">${sz.map(x => `<label class="${x.wide ? 'wide' : ''} ${x.auto ? 'auto' : ''}"><span>${x.label}</span><div>${x.v ? esc(x.v) : `<i>${x.ph}</i>`}${x.auto ? '<em>uit je profiel</em>' : ''}</div></label>`).join('')}</div>
          <div class="btns"><button class="btn or" data-page="sportzoeker">Zoek je sportclub</button><button class="btn nv" data-page="sportzoeker">Zoeken op kaart</button></div>
        </div>
        <div class="map">${mapSvg(p)}</div>
      </div></section>`;

    return header(p) + heroHtml + nbaHtml + tilesHtml + workoutHtml + storiesHtml + localHtml + szHtml + footer();
  }

  function szFields(p) {
    const presets = {
      mark: { sport: 'Fitness, zwemmen, wandelen', age: '50 tot 65 jaar' },
      kim: { sport: 'Rolstoelbasketbal', age: '18 tot 30 jaar' },
      henk: { sport: 'Klimmen, boksen', age: '50 tot 65 jaar' },
    }[p.key] || {};
    const c = city(p), b = val(p, 'type_beperking');
    return [
      { label: 'Postcode/woonplaats', v: c, auto: !!c, ph: 'Geef een locatie op' },
      { label: 'Hoe ver wil je reizen?', v: '< 15 km', ph: '' },
      { label: 'Welke sport(en) vind je leuk?', v: presets.sport, auto: !!presets.sport, ph: 'Zoek en selecteer sporten', wide: true },
      { label: 'Wat is je leeftijdscategorie?', v: presets.age, auto: !!presets.age, ph: 'Zoek en selecteer leeftijdscategorie', wide: true },
      { label: 'Welk type beperking of aandoening heb je?', v: b, auto: !!b, ph: 'Zoek en selecteer beperking', wide: true },
    ];
  }

  function mapSvg(p) {
    // Gestileerde kaart: oranje clusters, met de woonplaats gemarkeerd
    const pts = [[52, 18], [60, 22], [70, 20], [48, 30], [58, 34], [68, 32], [78, 30], [44, 42], [54, 46], [64, 44], [74, 42], [40, 54], [50, 58], [60, 56], [70, 58], [80, 54], [46, 68], [56, 70], [66, 72], [62, 84], [72, 82]];
    const cities = { Amsterdam: [47, 40], Utrecht: [55, 52], Eindhoven: [58, 74], Rotterdam: [40, 58] };
    const c = city(p), cc = c && cities[c];
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-label="Kaart met sportaanbieders">
      <rect width="100" height="100" fill="#cfe7f3"/>
      <path d="M38 8 L74 10 L86 26 L84 52 L88 70 L76 92 L58 96 L50 86 L36 76 L30 62 L34 44 L32 26 Z" fill="#f4f1ea" stroke="#d9d3c4" stroke-width=".6"/>
      ${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${1.3 + (i % 3) * .45}" fill="#EE7203" opacity=".9"/>`).join('')}
      ${cc ? `<circle cx="${cc[0]}" cy="${cc[1]}" r="9" fill="none" stroke="#27348B" stroke-width="1.2" stroke-dasharray="2 1.5"/><circle cx="${cc[0]}" cy="${cc[1]}" r="2.6" fill="#27348B"/><text x="${cc[0]}" y="${cc[1] - 11}" text-anchor="middle" font-size="5" font-weight="700" fill="#27348B">${esc(c)}</text>` : ''}
    </svg>`;
  }

  /* ---------- pagina: sportzoeker ---------- */
  function sportzoeker(p) {
    const res = RESULTS[p.key] || RESULTS.anon;
    const personal = p.key !== 'anon';
    const sz = szFields(p);
    const nk = nba(p);
    return header(p) + `
      <section class="sec"><div class="wrap">
        <p class="crumbs">Home › Voor sporters › Sport zoeken</p>
        <div class="szp">
          <div class="szp-form${pz(sz.some(x => x.auto) ? 'ingevuld vanuit het profiel' : '')}">${sz.some(x => x.auto) ? tag('ingevuld vanuit het profiel') : ''}
            <h1 class="sec-t">Vind je Unieke Sport</h1>
            <div class="sz-form col">${sz.map(x => `<label class="${x.auto ? 'auto' : ''}"><span>${x.label}</span><div>${x.v ? esc(x.v) : `<i>${x.ph}</i>`}${x.auto ? '<em>uit je profiel</em>' : ''}</div></label>`).join('')}</div>
            <button class="btn or full">Zoek je sportclub</button>
            ${!personal ? '<p class="muted small">Tip: vul je woonplaats en beperking in, dan sorteren we op wat het best bij je past.</p>' : ''}
          </div>
          <div class="szp-res">
            <div class="sec-h"><h2 class="sec-t sm">${personal ? `${res.length} sporten die het best bij je passen` : 'Populaire sporten'}</h2>${personal ? '<span class="muted">gesorteerd op match</span>' : ''}</div>
            <div class="${pz(personal ? 'sortering op beperking, woonplaats en voorkeur' : '')}">${personal ? tag('sortering op beperking, woonplaats en voorkeur') : ''}
            ${res.map((r, i) => `
              <div class="res ${i === 0 && personal ? 'top' : ''}">
                <div class="res-t"><h3>${esc(r.sport)}</h3><p>📍 ${esc(r.place)}${r.km ? ` · ${String(r.km).replace('.', ',')} km` : ''}</p>
                <div class="pills">${r.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>
                ${r.match ? `<div class="match"><b>${r.match}%</b><small>match</small></div>` : ''}
                ${i === 0 && personal ? `<button class="btn or sm">${nk === 'proefles' ? 'Plan proefles' : 'Bekijk club'}</button>` : '<button class="btn nv sm">Bekijk</button>'}
              </div>`).join('')}
            </div>
            <div class="map small">${mapSvg(p)}</div>
          </div>
        </div>
      </div></section>` + footer();
  }

  /* ---------- pagina: e-mail ---------- */
  function mail(p) {
    if (!p.optin) {
      return `<div class="mailbox"><div class="mb-empty"><div class="mb-ic">✉</div><h2>Nog geen e-mail</h2><p>Deze bezoeker heeft nog geen opt-in gegeven. Zodra dat gebeurt, start de welkomstflow in ActiveCampaign, gevoed met wat BlueConic al weet: ${filled(p) ? `<b>${filled(p)} profielvelden</b>` : 'nu nog niets'}.</p><button class="btn or" data-page="home">Terug naar de website</button></div></div>`;
    }
    const nk = nba(p), nc = nbaContent(nk, p), st = stories(p).slice(0, 2), wo = workouts(p)[0];
    const subj = {
      beweegadvies: `${p.first}, zo zet je je eerste stap (gratis beweegadvies)`,
      proefles: `${p.first}, je proefles rolstoelbasketbal staat klaar`,
      vervoer: `${p.first}, zo kom je makkelijk bij de training`,
      sportzoeker: `${p.first}, dit kan er in ${city(p)} voor jou`,
      maatje: `${p.first}, samen sporten in ${city(p)}?`,
      buurtsportcoach: `${p.first}, een coach die met je meedenkt`,
    }[nk] || `${p.first}, nieuwe verhalen voor jou`;
    const others = [
      { from: 'Uniek Sporten', s: 'De nieuwste verhalen van november', d: '4 nov' },
      { from: 'Uniek Sporten Thuis', s: 'Je volgende workout staat klaar', d: '28 okt' },
    ];
    return `<div class="mailbox">
      <div class="mb-list"><div class="mb-h">Inbox · ${esc(p.name)}</div>
        <div class="mb-item on"><b>Uniek Sporten</b><span>${esc(subj)}</span><small>zojuist</small></div>
        ${others.map(o => `<div class="mb-item"><b>${o.from}</b><span>${o.s}</span><small>${o.d}</small></div>`).join('')}
        <div class="mb-note${pz('flow in ActiveCampaign volgt next_best_action')}">${tag('flow in ActiveCampaign volgt next_best_action')}<b>Hoe deze mail ontstaat</b><br>BlueConic stuurt de next best action (<code>${nk}</code>) naar ActiveCampaign. De mail toont dezelfde ene stap als de website, plus verhalen die bij het profiel passen.</div>
      </div>
      <div class="mb-read">
        <div class="mb-meta"><b>${esc(subj)}</b><small>Van: Uniek Sporten &lt;nieuws@unieksporten.nl&gt; · Aan: ${esc(p.first.toLowerCase())}@voorbeeld.nl</small></div>
        <div class="em">
          <div class="em-head"><img src="${IMG.logo}" alt="Uniek Sporten"></div>
          <div class="em-body">
            <p class="em-hi">Hoi ${esc(p.first)},</p>
            <p>${nk === 'proefles' ? 'Je hebt een club gevonden en je sportrolstoel is geregeld. Tijd voor de leukste stap.' : nk === 'beweegadvies' ? 'Je hebt al een paar verhalen van herintreders gelezen. Mooi! Wil je weten wat voor jou de beste eerste stap is?' : nk === 'maatje' ? 'Je gaf aan dat je graag samen sport. Daar kunnen we je mee helpen.' : nk === 'vervoer' ? 'Je gaf aan dat je niet altijd zelf naar de training kunt. Dat lossen we samen op.' : nk === 'sportzoeker' ? `Je las over klimmen bij Parkinson. In ${city(p)} zijn clubs met een groep speciaal voor mensen met Parkinson.` : 'We hebben iets voor je klaargezet.'}</p>
            <div class="em-nba${pz('next_best_action = ' + nk)}">${tag('next_best_action = ' + nk)}<span class="em-ic">${nc.icon}</span><div><b>${esc(nc.title)}</b><p>${esc(nc.text)}</p><span class="btn or sm">${esc(nc.cta)}</span></div></div>
            <h3 class="em-h">Verhalen voor jou</h3>
            <div class="em-stories${pz('type_beperking = ' + (beperking(p) || ''))}">${tag('type_beperking = ' + (beperking(p) || ''))}${st.map(s => `<a href="${s.url}" target="_blank" rel="noopener"><img src="${s.img}" alt=""><span>${esc(s.title)}</span></a>`).join('')}</div>
            ${active(p.acties.thuisworkouts) ? `<div class="em-wo"><img src="${wo.img}" alt=""><div><small>Uniek Sporten Thuis · ${wo.min} min</small><b>${esc(wo.title)}</b></div></div>` : ''}
            <p class="em-foot">Je ontvangt deze mail omdat je je hebt aangemeld bij Uniek Sporten. <u>Voorkeuren aanpassen</u> · <u>Afmelden</u></p>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- profielpaneel ---------- */
  function renderPanel() {
    const p = state.p, fz = fase(p), nk = nba(p);
    const srcLabel = { gevraagd: 'gevraagd', gedrag: 'gedrag', berekend: 'berekend' };
    $('#panel').innerHTML = `
      <div class="pp-h"><span class="av big av-${p.key}">${p.initials}</span><div><b>${esc(p.name)}</b><small>${esc(p.subtitle)}</small></div><button class="x" data-act="panel" aria-label="Sluit paneel">×</button></div>
      <div class="pp-src">BlueConic-profiel · ${p.known ? 'bekend (e-mail + opt-in)' : 'anoniem (cookie)'}</div>
      <div class="pp-sec"><h4>Klantreisfase</h4>
        <div class="fase">${FASES.map((x, i) => `<div class="fs ${i + 1 < fz.n ? 'done' : ''} ${i + 1 === fz.n ? 'now' : ''}" title="${x}"><span></span><small>${x}</small></div>`).join('')}</div>
        <p class="pp-why">Fase ${fz.n} · ${esc(FASES[fz.n - 1])}: ${esc(fz.why)}</p></div>
      <div class="pp-sec nba-box ${state.flash.has('nba') ? 'flash' : ''}"><h4>Next best action</h4><b>${esc(nbaContent(nk, p).title)}</b><small>berekend uit de actiestatussen (eerste in prioriteit met status relevant of gestart)</small></div>
      <div class="pp-sec"><h4>Fundament <span class="cnt">${filled(p)}/8</span></h4>
        <table class="pf">${FIELDS.map(x => { const v = p.profile[x.key]; return `<tr class="${state.flash.has(x.key) ? 'flash' : ''}"><td>${x.label}${x.sensitive ? ' <span class="lock" title="Bijzonder persoonsgegeven: aparte toestemming (art. 9 AVG)">🔒</span>' : ''}</td><td>${v ? `<b>${esc(v.v)}</b><span class="src ${v.src}">${srcLabel[v.src]}${v.when ? ' · ' + esc(v.when) : ''}</span>` : '<span class="empty">onbekend</span>'}</td></tr>`; }).join('')}</table></div>
      <div class="pp-sec"><h4>Actiestatussen</h4>
        <div class="acts">${ACTIONS.map(a => `<div class="act ${a.key === nk ? 'nba' : ''} ${state.flash.has('a_' + a.key) ? 'flash' : ''}"><span>${a.label}</span><span class="st ${p.acties[a.key]}">${STATUS_LABEL[p.acties[a.key]]}</span></div>`).join('')}</div></div>
      <div class="pp-sec"><h4>Recent gedrag</h4><ul class="log">${p.log.slice().reverse().map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`;
    document.body.classList.toggle('panel-open', state.panel);
  }

  /* ---------- verrijkingsvraag (BlueConic-dialoog) ---------- */
  function renderToaster() {
    const p = state.p, qk = p.questions[0];
    const show = qk && state.page === 'home' && !state.toastClosed;
    if (!show) { $('#toaster').innerHTML = ''; $('#toaster').className = ''; return; }
    const q = QUESTIONS[qk];
    $('#toaster').className = 'on';
    $('#toaster').innerHTML = `
      <div class="toast">
        ${state.labels ? '<span class="pz-tag in"><b>BlueConic-dialoog</b> verrijkingsvraag · max. 1 per bezoek</span>' : ''}
        <button class="x" data-act="closetoast" aria-label="Sluiten">×</button>
        <img src="${IMG.logo}" alt="" class="toast-logo">
        <h3>${esc(q.q)}</h3><p>${esc(q.sub)}</p>
        ${q.consent ? `<label class="consent"><input type="checkbox" id="consent"> Ik geef toestemming dat Uniek Sporten deze gezondheidsinformatie gebruikt om mij passend aanbod te tonen.</label>` : ''}
        <div class="opts">${q.options.map((o, i) => `<button class="opt" data-ans="${i}" ${q.consent ? 'disabled' : ''}>${esc(o.label)}</button>`).join('')}</div>
      </div>`;
  }

  function answer(i) {
    const p = state.p, qk = p.questions[0], q = QUESTIONS[qk], o = q.options[i];
    const before = nba(p);
    state.flash = new Set();
    Object.entries(o.set || {}).forEach(([k, v]) => { p.profile[k] = { v, src: 'gevraagd', when: 'zojuist' }; state.flash.add(k); });
    Object.entries({ ...(q.acties || {}), ...(o.acties || {}) }).forEach(([k, v]) => { p.acties[k] = v; state.flash.add('a_' + k); });
    p.log.push(`Zojuist: "${q.q}" → ${o.label}`);
    p.questions.shift();
    if (nba(p) !== before) state.flash.add('nba');
    if (!state.panel && window.innerWidth >= 900) state.panel = true;
    render();
    setTimeout(() => { state.flash = new Set(); renderPanel(); }, 2600);
  }

  /* ---------- rondleiding ---------- */
  const TOUR = [
    { persona: 'anon', page: 'home', t: 'Zo ziet de site er vandaag voor iedereen uit', d: 'Een nieuwe bezoeker. In het profiel rechts staat nog niets: we weten niet wie het is of wat hij zoekt.' },
    { persona: 'anon', page: 'home', t: 'Eén vraag tegelijk vult het profiel', d: 'Beantwoord de vraag linksonder (een BlueConic-dialoog). Kijk hoe het profiel zich vult en de site meteen meebeweegt.' },
    { persona: 'mark', page: 'home', t: 'Mark, 52: herintreder na een herseninfarct', d: 'Mark krijgt verhalen van andere herintreders, rustige thuisworkouts en één volgende stap: gratis beweegadvies.' },
    { persona: 'kim', page: 'home', t: 'Kim, 27: wil rolstoelbasketballen', d: 'Club gevonden en sportrolstoel geregeld: haar stap is de proefles. Antwoord "Soms" op de vervoersvraag en zie de volgende stap veranderen.' },
    { persona: 'kim', page: 'sportzoeker', t: 'De Sportzoeker staat al klaar', d: 'Woonplaats, sport en beperking zijn ingevuld vanuit het profiel. De resultaten zijn gesorteerd op match.' },
    { persona: 'henk', page: 'home', t: 'Henk, 63: Parkinson, wil samen sporten', d: 'Lokaal nieuws uit Eindhoven en het artikel over klimmen bij Parkinson. Zijn vraag: wil je samen sporten?' },
    { persona: 'henk', page: 'mail', t: 'Dezelfde stap in de mail', d: 'ActiveCampaign krijgt de next best action uit BlueConic. Site en mail vertellen hetzelfde verhaal.' },
    { persona: 'anon', page: 'home', t: 'Eén profiel, overal dezelfde volgende stap', d: 'Dit kan met BlueConic en ActiveCampaign die we al hebben. De vraag voor vandaag: hoe ver willen we in 2027 komen?' },
  ];

  function renderTour() {
    if (state.tour === null) { $('#tour').innerHTML = ''; return; }
    const s = TOUR[state.tour];
    $('#tour').innerHTML = `<div class="tour"><div class="tour-n">${state.tour + 1}/${TOUR.length}</div><div class="tour-t"><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div>
      <div class="tour-b"><button class="btn ghost sm" data-act="tprev" ${state.tour === 0 ? 'disabled' : ''}>←</button><button class="btn or sm" data-act="tnext">${state.tour === TOUR.length - 1 ? 'Klaar' : 'Volgende →'}</button><button class="x" data-act="tclose" aria-label="Stop rondleiding">×</button></div></div>`;
  }

  function goTour(i) {
    if (i < 0 || i >= TOUR.length) { state.tour = null; render(); return; }
    const s = TOUR[i];
    state.tour = i;
    if (s.persona !== state.pkey || (i === 0)) setPersona(s.persona, false);
    state.page = s.page;
    if (i === 1 || i === 3 || i === 5) state.panel = window.innerWidth >= 900 ? true : state.panel;
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- render & events ---------- */
  function setPersona(k, doRender = true) {
    state.pkey = k; state.p = clone(PERSONAS[k]); state.flash = new Set(); state.toastClosed = false;
    if (doRender) { render(); window.scrollTo({ top: 0 }); }
  }

  function render() {
    renderBar();
    const p = state.p;
    $('#app').innerHTML = `<div class="site">${state.page === 'home' ? home(p) : state.page === 'sportzoeker' ? sportzoeker(p) : mail(p)}</div>`;
    renderPanel(); renderToaster(); renderTour();
    document.body.classList.toggle('labels', state.labels);
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-persona],[data-page],[data-go],[data-act],[data-ans]');
    if (!t) return;
    if (t.dataset.persona) { state.tour = null; setPersona(t.dataset.persona); return; }
    if (t.dataset.page) { e.preventDefault(); state.page = t.dataset.page; render(); window.scrollTo({ top: 0 }); return; }
    if (t.dataset.go) { if (t.dataset.go !== 'home') { state.page = t.dataset.go; render(); window.scrollTo({ top: 0 }); } return; }
    if (t.dataset.ans !== undefined) { answer(+t.dataset.ans); return; }
    const a = t.dataset.act;
    if (a === 'panel') { state.panel = !state.panel; render(); }
    if (a === 'labels') { state.labels = !state.labels; render(); }
    if (a === 'closetoast') { state.toastClosed = true; renderToaster(); }
    if (a === 'tour') goTour(state.tour === null ? 0 : state.tour);
    if (a === 'tnext') goTour(state.tour + 1);
    if (a === 'tprev') goTour(state.tour - 1);
    if (a === 'tclose') { state.tour = null; renderTour(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'consent') document.querySelectorAll('#toaster .opt').forEach(b => b.disabled = !e.target.checked);
  });
  document.addEventListener('keydown', e => {
    if (state.tour === null) return;
    if (e.key === 'ArrowRight') goTour(state.tour + 1);
    if (e.key === 'ArrowLeft' && state.tour > 0) goTour(state.tour - 1);
    if (e.key === 'Escape') { state.tour = null; renderTour(); }
  });

  render();
})();
