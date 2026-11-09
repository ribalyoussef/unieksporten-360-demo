/* Demo 360 graden klantprofiel · Uniek Sporten x Techonomy
   De logica volgt de sheet: Actiemodel (triggers + prioriteit), Beperking x Actie (wie welke vraag krijgt),
   Klantreisfase (afleidregels) en de spelregels (max. 1 vraag per bezoek, antwoord is leidend, gedrag mag een vraag overslaan). */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));

  const state = {
    pkey: 'anon', page: 'home', p: clone(PERSONAS.anon),
    panel: window.innerWidth >= 1200, labels: false, tour: null, flash: new Set(),
    toastClosed: false, askedThisVisit: false, pick: [], consent: false, flow: null,
  };

  /* ================= Engine ================= */
  const fld = (p, k) => p.fields[k] ? p.fields[k].v : null;
  const arr = v => v == null ? [] : Array.isArray(v) ? v : [v];
  const has = (p, k, ...vals) => arr(fld(p, k)).some(x => vals.includes(x));
  const src = (p, ...keys) => keys.some(k => p.fields[k] && p.fields[k].src === 'gevraagd') ? 'relevant_gevraagd' : 'relevant_signaal';
  const isRel = s => s === 'relevant_gevraagd' || s === 'relevant_signaal';
  const isActive = s => isRel(s) || s === 'gestart';
  const beperkingen = p => arr(fld(p, 'type_beperking'));
  const mainB = p => beperkingen(p)[0] || null;
  const city = p => fld(p, 'woonplaats');
  const sporterRoute = p => !fld(p, 'type_bezoeker') || has(p, 'type_bezoeker', 'Sporter', 'Ouder');

  // Spelregel 2: per actie de hoogste waarde over alle beperkingen (R > V > N)
  function matrix(p, a) {
    const bs = beperkingen(p);
    if (!bs.length) return null;
    const i = MATRIX_COLS.indexOf(a);
    const vals = bs.map(b => (MATRIX[b] || 'VVVVVVVVVV')[i]);
    return vals.includes('R') ? 'R' : vals.includes('V') ? 'V' : 'N';
  }

  // Actiemodel: 'Wanneer Relevant (trigger)'
  function trigger(p, a) {
    switch (a) {
      case 'beweegadvies':
        if (has(p, 'sportstatus', 'Inactief', 'InactiefMetSportwens') || has(p, 'sportervaring', 'Beginner', 'Herintreder')) return src(p, 'sportstatus', 'sportervaring');
        return null;
      case 'buurtsportcoach':
        return has(p, 'vertrouwen_sporten', 'Laag') ? src(p, 'vertrouwen_sporten') : null;
      case 'sportzoeker':
        return has(p, 'sportstatus', 'InactiefMetSportwens', 'ActiefZonderClub') && has(p, 'sportvoorkeur', 'Vereniging', 'Sportschool', 'Buiten') ? src(p, 'sportstatus') : null;
      case 'proefles': {
        const block = ['vervoer', 'financien'].some(x => isActive(status(p, x)));
        return status(p, 'sportzoeker') === 'afgerond' && !block ? 'relevant_signaal' : null;
      }
      case 'thuisworkouts':
        return has(p, 'sportvoorkeur', 'Thuis') ? src(p, 'sportvoorkeur') : has(p, 'vertrouwen_sporten', 'Laag') ? src(p, 'vertrouwen_sporten') : null;
      case 'inspiratie':
        return 'relevant_signaal'; // altijd relevant als instap
      default: return null;
    }
  }

  // Spelregel 1: het antwoord (progress) gaat voor alles. Daarna de trigger, dan passieve signalen (spelregel 4).
  function status(p, a) {
    if (p.progress[a]) return p.progress[a];
    const t = trigger(p, a);
    if (t) return t;
    if (p.signals[a]) return 'relevant_signaal';
    return 'onbekend';
  }

  // next_best_action: eerste actie in Actiemodel-volgorde met status Relevant of Gestart
  const nba = p => (ACTIONS.find(a => isActive(status(p, a.key))) || ACTIONS.at(-1)).key;

  const filledCount = p => FIELDS.filter(x => p.fields[x.key]).length;

  // Tab Klantreisfase: afleidregels
  function fase(p) {
    const s = a => status(p, a), done = a => s(a) === 'afgerond';
    const drempelOpen = ['vervoer', 'hulpmiddelen', 'financien', 'maatje'].some(a => isActive(s(a)));
    const randOk = ['vervoer', 'hulpmiddelen', 'financien', 'maatje'].every(a => ['afgerond', 'nietrelevant', 'onbekend'].includes(s(a)));
    if (has(p, 'sportstatus', 'ActiefClub') && (done('proefles') || p.workoutsDone >= 5)) return { n: 6, why: 'sportstatus = ActiefClub' };
    if (has(p, 'sportstatus', 'ActiefZonderClub') && (done('proefles') || p.workoutsDone >= 3)) return { n: 5, why: `sportstatus = ActiefZonderClub en ${done('proefles') ? 'proefles afgerond' : p.workoutsDone + ' thuisworkouts gedaan'}` };
    if ((s('proefles') === 'gestart' || s('thuisworkouts') === 'gestart') && randOk) return { n: 4, why: `${s('proefles') === 'gestart' ? 'actie_proefles' : 'actie_thuisworkouts'} = Gestart` };
    if ((done('sportzoeker') || done('beweegadvies')) && drempelOpen) return { n: 3, why: `${done('sportzoeker') ? 'actie_sportzoeker' : 'actie_beweegadvies'} afgerond, drempel open` };
    if (done('sportzoeker') || done('beweegadvies')) return { n: 3, why: `${done('sportzoeker') ? 'actie_sportzoeker' : 'actie_beweegadvies'} afgerond, richting is er` };
    if (filledCount(p) >= 4) return { n: 2, why: `fundament ${filledCount(p)} van 8 gevuld, nog geen richting` };
    return { n: 1, why: filledCount(p) ? `fundament ${filledCount(p)} van 8 gevuld` : 'we weten nog (bijna) niets' };
  }

  // Volgende vraag in de wachtrij: eerst het fundament, daarna V-vragen uit de matrix in NBA-volgorde
  function nextQuestion(p) {
    for (const k of FIELD_ORDER) {
      if (p.fields[k]) continue;
      if ((k === 'type_beperking' || k === 'sportstatus') && !sporterRoute(p)) continue;
      return { kind: 'field', key: k, ...FIELD_QUESTIONS[k] };
    }
    if (!sporterRoute(p)) return null;
    for (const a of ACTIONS) {
      if (!a.q || status(p, a.key) !== 'onbekend') continue;
      if (matrix(p, a.key) !== 'V') continue;
      return { kind: 'action', key: a.key, q: a.q.q, sub: 'Dan kunnen we je beter op weg helpen.', options: a.q.options };
    }
    return null;
  }

  // Spelregel 5 (voorstel), in deze volgorde:
  // a. Is de next best action een drempel die nog niet is opgelost: het contact gaat over die drempel (de check).
  // b. Staat de next best action op Gestart: een follow-up ('is het gelukt?') bij het volgende bezoek.
  // c. Anders de wachtrij: eerst het fundament, dan V-vragen. Die checken of er nog een drempel is vóór de volgende stap.
  // d. Is de wachtrij leeg: de eigen vraag van de next best action uit het Actiemodel (bijv. 'Klaar om het gewoon eens te proberen?').
  function nextInteraction(p) {
    const nk = nba(p), s = status(p, nk);
    if (DREMPELS.includes(nk) && isRel(s)) return { kind: 'drempel', key: nk, q: FLOWS[nk].title + '?', sub: FLOWS[nk].intro };
    if (s === 'gestart' && FOLLOWUP[nk]) return { kind: 'followup', key: nk, q: FOLLOWUP[nk].q, sub: 'Dan helpen we je verder.', options: FOLLOWUP[nk].options };
    const q = nextQuestion(p);
    if (q) return q;
    const a = ACTIONS.find(x => x.key === nk);
    if (isRel(s) && a && a.q) return { kind: 'nba', key: nk, q: a.q.q, sub: 'Dit is je volgende stap.', options: a.q.options };
    return null;
  }

  /* ================= Content ================= */
  function nbaContent(key, p) {
    const c = city(p), b = mainB(p);
    const map = {
      beweegadvies: { icon: '☎', title: 'Gratis persoonlijk beweegadvies', text: `Een beweegadviseur denkt met je mee over wat bij jou past${b === 'NAH' ? ' na je hersenletsel' : ''}. Telefonisch en zonder verplichtingen.`, cta: 'Vraag beweegadvies aan', go: 'home', mail: 'Ontdek wat bij je past' },
      financien: { icon: '€', title: 'Hulp bij de kosten van sporten', text: 'Doe de fondsencheck: welke regelingen en fondsen maken jouw sport betaalbaar?', cta: 'Start de fondsencheck', go: 'home', mail: 'Drempel: financiën' },
      vervoer: { icon: '🚐', title: 'Regel je vervoer naar de sport', text: `Met Valys of de regiotaxi${c ? ' in ' + c : ''} kom je zonder gedoe bij de club. We zoeken uit wat voor jou geldt.`, cta: 'Bekijk vervoersopties', go: 'home', mail: 'Drempel: vervoer' },
      hulpmiddelen: { icon: '♿', title: 'Probeer een sporthulpmiddel', text: 'Bekijk welke sporthulpmiddelen je kunt aanschaffen of lenen, en vraag er een aan.', cta: 'Bekijk hulpmiddelen', go: 'home', mail: 'Drempel: hulpmiddelen' },
      maatje: { icon: '🤝', title: `Sporten met een sportmaatje${c ? ' in ' + c : ''}`, text: 'Samen is de stap naar een club makkelijker. We koppelen je aan een maatje met dezelfde sportwens.', cta: 'Vind een sportmaatje', go: 'home', mail: 'Drempel: maatje' },
      buurtsportcoach: { icon: '💬', title: 'Een buurtsportcoach denkt met je mee', text: `${c ? 'De buurtsportcoach in ' + c : 'Een buurtsportcoach'} helpt je kosteloos op weg, in jouw tempo.`, cta: 'Neem contact op', go: 'home', mail: 'Vangnet: buurtsportcoach' },
      sportzoeker: { icon: '🔍', title: `Vind een club${c ? ' in ' + c : ' bij jou in de buurt'}`, text: `Bekijk welke sporten${c ? ' in ' + c : ' bij jou in de buurt'} het best bij je passen.`, cta: 'Bekijk jouw resultaten', go: 'sportzoeker', mail: 'Ontdek wat bij je past' },
      proefles: { icon: '🏀', title: 'Plan je proefles', text: p.key === 'kim' ? 'Rolstoelbasketbal in Amsterdam Nieuw-West (3,2 km). Neem je eigen sportrolstoel mee, de eerste les is gratis.' : 'Je hebt een sport gevonden. Probeer het gewoon eens, de eerste les is vaak gratis.', cta: 'Plan je proefles', go: 'sportzoeker', mail: 'Proefles' },
      thuisworkouts: { icon: '▶', title: 'Begin thuis met een korte workout', text: 'Uniek Sporten Thuis: korte workouts op jouw tempo, wanneer het jou uitkomt.', cta: 'Start een workout', go: 'home', mail: 'Thuis beginnen' },
      inspiratie: { icon: '★', title: 'Lees hoe anderen begonnen', text: 'Echte verhalen van sporters met een beperking. Misschien zit jouw sport ertussen.', cta: 'Lees de verhalen', go: 'home', mail: 'Inspiratie' },
    };
    if (DREMPELS.includes(key)) {
      map[key].go = 'drempel';
      if (status(p, key) === 'gestart') Object.assign(map[key], { title: FLOWS[key].gestart, text: `Bekijk je advies en de volgende stappen.`, cta: 'Bekijk je aanvraag' });
      else map[key].cta = { vervoer: 'Doe de vervoerscheck', financien: 'Doe de fondsencheck', hulpmiddelen: 'Bekijk wat bij je past', maatje: 'Vind een sportmaatje' }[key];
    }
    return map[key];
  }

  function hero(p) {
    if (p.key === 'mark') return { eyebrow: 'Welkom terug, Mark', t1: 'Weer in beweging', t2: 'na je herseninfarct.', text: 'Stefan en Yolanda gingen je voor: met kleine stappen terug naar sport. Wij helpen je met de eerste, op jouw tempo.', img: STORIES[1].img, why: 'type_beperking = NAH · sportervaring = Herintreder' };
    if (p.key === 'kim') return { eyebrow: 'Welkom terug, Kim', t1: 'Klaar voor', t2: 'teamsport, Kim?', text: 'Rolstoelbasketbal in Amsterdam: snel, fanatiek en met een team dat op je wacht. Kom een keer meedoen.', img: IMG.hulpmiddelHome, why: 'sportvoorkeur = rolstoelbasketbal · actie_sportzoeker = Afgerond' };
    if (p.key === 'henk') return { eyebrow: 'Welkom terug, Henk', t1: 'Blijven bewegen', t2: 'met Parkinson.', text: 'Klimmen, boksen, wandelen: steeds meer clubs in Eindhoven hebben een groep voor mensen met Parkinson. Samen sporten houdt je in beweging.', img: STORIES[2].img, why: 'type_beperking = Chronisch · woonplaats = Eindhoven · beweegambitie = Sociaal' };
    const tb = fld(p, 'type_bezoeker');
    if (tb && !sporterRoute(p)) return { eyebrow: `Voor ${tb === 'Club' ? 'sportclubs' : tb.toLowerCase() + 's'}`, t1: 'Samen meer mensen', t2: 'aan het sporten.', text: 'Verwijzen, begeleiden of aanbod opzetten: hier vind je materiaal, cijfers en contactpersonen voor jouw rol.', img: STORIES[7].img, why: `type_bezoeker = ${tb}` };
    const b = mainB(p);
    if (b) {
      const s = STORIES.find(x => x.tags.includes(b));
      const w = BEPERKING_ZIN[b];
      const ouder = tb === 'Ouder';
      return { eyebrow: ouder ? 'Voor jouw kind' : 'Speciaal voor jou', t1: `Sporten met ${w[0]}?`, t2: 'Zo begin je.', text: `Honderden sportaanbieders hebben ervaring met ${w[1]}. ${city(p) ? 'Ontdek wat er in ' + city(p) + ' kan.' : 'Ontdek wat er bij jou in de buurt kan.'}`, img: s ? s.img : IMG.zoekjerot, why: `type_beperking = ${b}${ouder ? ' · type_bezoeker = Ouder' : ''}` };
    }
    return null;
  }

  function stories(p) {
    const bs = beperkingen(p), c = city(p);
    if (!bs.length) return ['stefan', 'marathon', 'wk'].map(id => STORIES.find(s => s.id === id));
    const score = s => (s.tags.some(t => bs.includes(t)) ? 10 : 0) + (c && s.tags.includes(c) ? 5 : 0) + (has(p, 'sportervaring', 'Herintreder') && s.tags.includes('Herintreder') ? 3 : 0) + (s.tags.includes('algemeen') ? 1 : 0);
    return [...STORIES].sort((a, z) => score(z) - score(a)).slice(0, 3);
  }

  function workouts(p) {
    const bs = beperkingen(p), low = has(p, 'vertrouwen_sporten', 'Laag');
    const sc = w => (w.tags.some(t => bs.includes(t)) ? 2 : 0) + (low && w.tags.includes('Laag') ? 1 : 0);
    return [...WORKOUTS].sort((a, z) => sc(z) - sc(a)).slice(0, 3);
  }

  /* ================= UI helpers ================= */
  const tag = why => state.labels && why ? `<span class="pz-tag"><b>Gepersonaliseerd</b> ${esc(why)}</span>` : '';
  const pz = why => state.labels && why ? ' pz' : '';
  const show = v => Array.isArray(v) ? v.join(', ') : v;

  /* ================= Demobalk ================= */
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

  /* ================= Site ================= */
  function header(p) {
    return `
    <div class="us-top"><div class="wrap">
      <span class="us-top-l">◐ Toegankelijkheid</span>
      <span class="us-top-r"><span>Contact</span><span>📍 ${city(p) ? esc(city(p)) : 'Kies je gemeente'} ⌄</span></span>
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
      <div class="demo-note">Demo voor de jaarplansessie 2027 · Techonomy. Velden, waardes, klantreisfases en regels komen uit het 360-graden-datamodel. Verhalen, workouts en beelden komen van unieksporten.nl. Personas, clubs en afstanden zijn illustratief.</div>
    </div></footer>`;

  function home(p) {
    const h = hero(p), nk = nba(p), nc = nbaContent(nk, p);
    const known = p.key !== 'anon' || filledCount(p) > 0;
    const nbaWhy = `next_best_action = actie_${nk}`;

    const heroHtml = h ? `
      <section class="hero${pz(h.why)}">${tag(h.why)}<div class="wrap hero-grid">
        <div><p class="eyebrow">${esc(h.eyebrow)}</p><h1>${esc(h.t1)}<br><span>${esc(h.t2)}</span></h1><p class="lead">${esc(h.text)}</p>
        <div class="btns"><button class="btn or" data-go="${nc.go}">${esc(nc.cta)}</button><button class="btn nv" data-page="sportzoeker">Zoek je sport</button></div></div>
        <div class="hero-img"><img src="${h.img}" alt=""></div></div></section>` : `
      <section class="hero"><div class="wrap hero-grid">
        <div><h1 class="gray">Zoek je rot?<br>Hoeft niet meer.</h1><p class="lead">Een sport vinden hoeft geen marathon te zijn! Met onze nieuwe campagne Zoekjerot.nl laten we zien hoe makkelijk het kan zijn om antwoord te vinden op je vragen over sporten met een beperking. Met onze nieuwe online assistent kun je je vraag gewoon typen of inspreken en krijg je direct antwoord.</p>
        <div class="btns"><button class="btn or">Start onze AI-assistent</button><button class="btn nv">Uniek Sporten Blessurevrij</button></div></div>
        <div class="hero-img"><img src="${IMG.zoekjerot}" alt=""></div></div></section>`;

    const nbaHtml = known ? `
      <section class="nba-band"><div class="wrap"><div class="nba${pz(nbaWhy)}">${tag(nbaWhy)}
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
    const rank = t => !known ? 0 : (t.k === nk ? 3 : status(p, t.k) === 'gestart' ? 2 : isRel(status(p, t.k)) ? 1 : status(p, t.k) === 'afgerond' ? -1 : 0);
    const badge = t => {
      if (!known) return '';
      const s = status(p, t.k);
      if (t.k === nk) return '<span class="badge or">Jouw volgende stap</span>';
      if (s === 'gestart') return '<span class="badge nv">Ga verder</span>';
      if (isRel(s)) return '<span class="badge lt">Past bij jou</span>';
      return '';
    };
    const tilesHtml = `
      <section class="gray-sec"><div class="wrap${pz(known ? 'volgorde op actiestatussen' : '')}">${known ? tag('volgorde op actiestatussen') : ''}
        <h2 class="sec-t">Waarmee kunnen wij je helpen?</h2>
        <div class="tiles">${[...tiles].sort((a, z) => rank(z) - rank(a)).map(t => `<a class="tile ${t.k === nk && known ? 'hl' : ''}" ${t.go ? `data-page="${t.go}"` : ''}>${badge(t)}<h3>${t.t}</h3><img src="${t.img}" alt=""></a>`).join('')}</div>
      </div></section>`;

    const st = stories(p), b = mainB(p);
    const stWhy = b ? `type_beperking = ${b}` : '';
    const storiesHtml = `
      <section class="sec"><div class="wrap${pz(stWhy)}">${tag(stWhy)}
        <div class="sec-h"><h2 class="sec-t">${b ? 'Verhalen die bij jou passen' : 'Inspiratie en verhalen'}</h2><a class="btn or sm" href="${SITE}/actueel/nieuws" target="_blank" rel="noopener">Meer nieuws</a></div>
        <div class="stories">
          <a class="story big" href="${st[0].url}" target="_blank" rel="noopener"><img src="${st[0].img}" alt=""><span>${esc(st[0].title)}</span></a>
          <div class="stack">${st.slice(1).map(s => `<a class="story" href="${s.url}" target="_blank" rel="noopener"><img src="${s.img}" alt=""><span>${esc(s.title)}</span></a>`).join('')}</div>
        </div></div></section>`;

    const ts = status(p, 'thuisworkouts');
    const showW = isActive(ts) || ts === 'afgerond';
    const wo = workouts(p);
    const woWhy = `actie_thuisworkouts = ${STATUS_LABEL[ts]}${p.workoutsDone ? ' · ' + p.workoutsDone + ' workouts gedaan' : ''}`;
    const workoutHtml = showW ? `
      <section class="sec thuis"><div class="wrap${pz(woWhy)}">${tag(woWhy)}
        <div class="sec-h"><h2 class="sec-t">${p.workoutsDone ? `Nieuwe workouts voor jou, ${esc(p.first)}` : 'Alvast thuis beginnen?'}</h2><span class="muted">Uniek Sporten Thuis</span></div>
        <div class="workouts">${wo.map(w => `<div class="wo"><div class="wo-img"><img src="${w.img}" alt=""><span class="play">▶</span></div><b>${esc(w.title)}</b><small>⏱ ${w.min} min</small></div>`).join('')}</div>
      </div></section>` : '';

    const c = city(p);
    const loc = c ? LOCAL.filter(l => l.near.includes(c)) : [];
    const localItems = [...loc, ...LOCAL.filter(l => !loc.includes(l))].slice(0, 2);
    const localHtml = `
      <section class="gray-sec"><div class="wrap${pz(c ? 'woonplaats = ' + c : '')}">${c ? tag('woonplaats = ' + c) : ''}
        <h2 class="sec-t">${c ? 'Bij jou in de buurt' : 'Lokaal nieuws & agenda'}</h2>
        <div class="local">
          <div class="local-card">${c ? `<div class="pin">📍</div><p><b>Nieuws en agenda rond ${esc(c)}</b><br>We tonen sportnieuws uit jouw regio.</p><button class="btn or sm">Wijzig gemeente</button>` : `<div class="pin">📍</div><p><b>Kies jouw gemeente en lees hier het laatste nieuws bij jou in de buurt</b></p><button class="btn or sm">Kies je gemeente</button>`}</div>
          ${localItems.map(l => `<a class="local-item" href="${l.url}" target="_blank" rel="noopener"><img src="${l.img}" alt=""><div><span class="region">${esc(l.region)}</span><b>${esc(l.title)}</b></div></a>`).join('')}
        </div></div></section>`;

    const sz = szFields(p), auto = sz.some(x => x.auto);
    const szHtml = `
      <section class="sz-teaser"><div class="wrap sz-grid">
        <div class="${pz(auto ? 'velden uit het profiel' : '')}">${auto ? tag('velden uit het profiel') : ''}
          <h2 class="sec-t">Vind je Unieke Sport</h2>
          <div class="sz-form">${szForm(sz)}</div>
          <div class="btns"><button class="btn or" data-page="sportzoeker">Zoek je sportclub</button><button class="btn nv" data-page="sportzoeker">Zoeken op kaart</button></div>
        </div>
        <div class="map">${mapSvg(p)}</div>
      </div></section>`;

    return header(p) + heroHtml + nbaHtml + tilesHtml + workoutHtml + storiesHtml + localHtml + szHtml + footer();
  }

  function szFields(p) {
    const c = city(p), bs = beperkingen(p);
    const sport = arr(fld(p, 'sportvoorkeur')).filter(x => !['Thuis', 'Buiten', 'Vereniging', 'Sportschool'].includes(x)).join(', ');
    return [
      { label: 'Postcode/woonplaats', v: c, auto: !!c, ph: 'Geef een locatie op' },
      { label: 'Hoe ver wil je reizen?', v: '< 15 km', ph: '' },
      { label: 'Welke sport(en) vind je leuk?', v: sport, auto: !!sport, ph: 'Zoek en selecteer sporten', wide: true },
      { label: 'Wat is je leeftijdscategorie?', v: '', ph: 'Zoek en selecteer leeftijdscategorie', wide: true },
      { label: 'Welk type beperking of aandoening heb je?', v: bs.map(b => BEPERKING_LABEL[b]).join(', '), auto: bs.length > 0, ph: 'Zoek en selecteer beperking', wide: true },
    ];
  }
  const szForm = sz => sz.map(x => `<label class="${x.wide ? 'wide' : ''} ${x.auto ? 'auto' : ''}"><span>${x.label}</span><div>${x.v ? esc(x.v) : `<i>${x.ph}</i>`}</div></label>`).join('');

  function mapSvg(p) {
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

  function sportzoeker(p) {
    const res = RESULTS[p.key] || RESULTS.anon, personal = p.key !== 'anon';
    const sz = szFields(p), auto = sz.some(x => x.auto), nk = nba(p);
    return header(p) + `
      <section class="sec"><div class="wrap">
        <p class="crumbs">Home › Voor sporters › Sport zoeken</p>
        <div class="szp">
          <div class="szp-form${pz(auto ? 'ingevuld vanuit het profiel' : '')}">${auto ? tag('ingevuld vanuit het profiel') : ''}
            <h1 class="sec-t">Vind je Unieke Sport</h1>
            <div class="sz-form col">${szForm(sz)}</div>
            <button class="btn or full">Zoek je sportclub</button>
            ${!auto ? '<p class="muted small">Vul je woonplaats en beperking in, dan sorteren we op wat het best bij je past.</p>' : ''}
          </div>
          <div class="szp-res">
            <div class="sec-h"><h2 class="sec-t sm">${personal ? `${res.length} sporten die het best bij je passen` : 'Populaire sporten'}</h2>${personal ? '<span class="muted">gesorteerd op match</span>' : ''}</div>
            <div class="${pz(personal ? 'sortering op type_beperking, woonplaats en sportvoorkeur' : '')}">${personal ? tag('sortering op type_beperking, woonplaats en sportvoorkeur') : ''}
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

  function mail(p) {
    if (!p.optin) {
      return `<div class="mailbox"><div class="mb-empty"><div class="mb-ic">✉</div><h2>Nog geen e-mail</h2><p>Deze bezoeker zit in fase 1 (Bewustwording) en heeft nog geen opt-in gegeven. Zodra dat gebeurt, start welkomstmail 1 in ActiveCampaign, gevoed met wat BlueConic al weet: ${filledCount(p) ? `<b>${filledCount(p)} van 8 fundamentvelden</b>` : 'nu nog niets'}.</p><button class="btn or" data-page="home">Terug naar de website</button></div></div>`;
    }
    const nk = nba(p), nc = nbaContent(nk, p), st = stories(p).slice(0, 2), wo = workouts(p)[0], fz = fase(p);
    const subj = {
      beweegadvies: `${p.first}, zo zet je je eerste stap (gratis beweegadvies)`,
      proefles: `${p.first}, tijd voor je proefles`,
      vervoer: `${p.first}, zo kom je makkelijk bij de sport`,
      sportzoeker: `${p.first}, dit kan er in ${city(p)} voor jou`,
      maatje: `${p.first}, samen sporten in ${city(p)}?`,
      buurtsportcoach: `${p.first}, een coach die met je meedenkt`,
      financien: `${p.first}, sporten hoeft niet veel te kosten`,
      hulpmiddelen: `${p.first}, probeer een sporthulpmiddel`,
    }[nk] || `${p.first}, nieuwe verhalen voor jou`;
    const intro = {
      proefles: 'Tijd voor de leukste stap: gewoon een keer meedoen.',
      beweegadvies: 'Weer beginnen met sporten? Een beweegadviseur helpt je de eerste stap te kiezen die bij jou past.',
      maatje: 'Samen sporten is vaak net wat leuker. We helpen je graag op weg.',
      vervoer: 'Naar de training komen is niet altijd makkelijk. Daar denken we graag in mee.',
      sportzoeker: `In ${city(p)} zijn clubs met een groep speciaal voor mensen met Parkinson. Misschien is dat iets voor jou.`,
    }[nk] || 'We hebben iets voor je klaargezet.';
    const others = [{ from: 'Uniek Sporten', s: 'De nieuwste verhalen van november', d: '4 nov' }, { from: 'Uniek Sporten Thuis', s: 'Je volgende workout staat klaar', d: '28 okt' }];
    return `<div class="mailbox">
      <div class="mb-list"><div class="mb-h">Inbox · ${esc(p.name)}</div>
        <div class="mb-item on"><b>Uniek Sporten</b><span>${esc(subj)}</span><small>zojuist</small></div>
        ${others.map(o => `<div class="mb-item"><b>${o.from}</b><span>${o.s}</span><small>${o.d}</small></div>`).join('')}
        ${state.labels ? `<div class="mb-note${pz('flow in ActiveCampaign')}">${tag('flow in ActiveCampaign')}<b>Hoe deze mail ontstaat</b><br>BlueConic synct <code>next_best_action = actie_${nk}</code> en <code>klantreis_fase = ${fz.n}</code> naar ActiveCampaign. Flow: <b>${esc(nc.mail)}</b>. Eén stap per mail, dezelfde als op de website.</div>` : ''}
      </div>
      <div class="mb-read">
        <div class="mb-meta"><b>${esc(subj)}</b><small>Van: Uniek Sporten &lt;nieuws@unieksporten.nl&gt; · Aan: ${esc(p.first.toLowerCase())}@voorbeeld.nl</small></div>
        <div class="em">
          <div class="em-head"><img src="${IMG.logo}" alt="Uniek Sporten"></div>
          <div class="em-body">
            <p class="em-hi">Hoi ${esc(p.first)},</p>
            <p>${esc(intro)}</p>
            <div class="em-nba${pz('next_best_action = actie_' + nk)}">${tag('next_best_action = actie_' + nk)}<span class="em-ic">${nc.icon}</span><div><b>${esc(nc.title)}</b><p>${esc(nc.text)}</p><span class="btn or sm">${esc(nc.cta)}</span></div></div>
            <h3 class="em-h">Verhalen voor jou</h3>
            <div class="em-stories${pz('type_beperking = ' + (mainB(p) || ''))}">${tag('type_beperking = ' + (mainB(p) || ''))}${st.map(s => `<a href="${s.url}" target="_blank" rel="noopener"><img src="${s.img}" alt=""><span>${esc(s.title)}</span></a>`).join('')}</div>
            ${['relevant_gevraagd', 'relevant_signaal', 'gestart', 'afgerond'].includes(status(p, 'thuisworkouts')) ? `<div class="em-wo"><img src="${wo.img}" alt=""><div><small>Uniek Sporten Thuis · ${wo.min} min</small><b>${esc(wo.title)}</b></div></div>` : ''}
            <p class="em-foot">Je ontvangt deze mail omdat je je hebt aangemeld bij Uniek Sporten. <u>Voorkeuren aanpassen</u> · <u>Afmelden</u></p>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ================= Drempel oplossen ================= */
  function openFlow(key) {
    const p = state.p, saved = p.flowAnswers && p.flowAnswers[key];
    state.flow = { key, step: saved ? FLOWS[key].steps.length : 0, answers: saved ? { ...saved } : {} };
    state.page = 'drempel';
  }

  function drempel(p) {
    const F = state.flow, fl = FLOWS[F.key], s = status(p, F.key), done = F.step >= fl.steps.length;
    const dots = fl.steps.map((st, i) => `<span class="fd ${i < F.step ? 'done' : ''} ${i === F.step ? 'now' : ''}"></span>`).join('') + `<span class="fd ${done ? 'now' : ''}"></span>`;
    let main;
    if (!done) {
      const st = fl.steps[F.step];
      main = `<p class="muted">Vraag ${F.step + 1} van ${fl.steps.length}</p><h2 class="flow-q">${esc(st.q)}</h2>
        <div class="flow-opts">${st.options.map((o, i) => `<button class="flow-opt" data-fopt="${i}">${esc(o)}</button>`).join('')}</div>
        ${F.step ? '<button class="btn ghost sm" data-act="fback">← Terug</button>' : ''}`;
    } else {
      const adv = fl.advies(F.answers, p);
      const bar = s === 'afgerond'
        ? `<div class="flow-bar ok"><b>✓ ${esc(fl.afgerond)}</b><span>Mooi! Op naar je volgende stap: ${esc(nbaContent(nba(p), p).title.toLowerCase())}.</span><button class="btn or sm" data-page="home">Naar je volgende stap →</button></div>`
        : s === 'gestart'
          ? `<div class="flow-bar"><b>${esc(fl.gestart)}</b><span>Je aanvraag loopt. Laat het ons weten als het geregeld is.</span><button class="btn or sm" data-act="fdone">Het is geregeld</button></div>`
          : `<div class="flow-bar"><b>Klaar om te beginnen?</b><span>Start je aanvraag. We helpen je bij elke stap.</span><button class="btn or sm" data-act="fstart">Start aanvraag</button></div>`;
      main = `<h2 class="flow-q">Dit past bij jou</h2>
        <div class="advs">${adv.map((x, i) => `<div class="adv ${i === 0 ? 'top' : ''}">${i === 0 ? '<span class="badge or">Past het best</span>' : ''}<h3>${esc(x.t)}</h3><p>${esc(x.d)}</p><small>→ ${esc(x.how)}</small></div>`).join('')}</div>
        ${bar}
        <button class="btn ghost sm" data-act="frestart">Antwoorden aanpassen</button>`;
    }
    return header(p) + `
      <section class="sec"><div class="wrap">
        <p class="crumbs">Home › Voor sporters › ${esc(fl.title)}</p>
        <div class="flow">
          <div class="flow-main">
            <p class="eyebrow">Hulp bij sporten</p><h1 class="sec-t">${esc(fl.title)}</h1><p class="lead">${esc(fl.intro)}</p>
            <div class="fdots">${dots}</div>
            ${main}
          </div>
          <aside class="flow-side">
            <h3>Hulp nodig?</h3>
            <p>Kom je er niet uit? De buurtsportcoach${city(p) ? ' in ' + esc(city(p)) : ''} denkt kosteloos met je mee.</p>
            <button class="btn nv sm">Neem contact op</button>
          </aside>
        </div>
      </div></section>` + footer();
  }

  /* ================= Profielpaneel ================= */
  function renderPanel() {
    const p = state.p, fz = fase(p), nk = nba(p), nq = nextInteraction(p);
    const pill = v => v ? `<span class="src ${v.src}">${v.src === 'gevraagd' ? 'actief' : 'passief'}${v.when ? ' · ' + esc(v.when) : ''}</span>` : '';
    const row = (x, v) => `<tr class="${state.flash.has(x.key) ? 'flash' : ''}"><td>${x.label}${x.art9 ? ' <span class="lock" title="Art. 9 AVG: alleen met aparte, uitdrukkelijke toestemming">🔒</span>' : ''}${x.fase === 2 ? ' <span class="uf" title="Uitrolfase 2">F2</span>' : ''}<code>${x.key}</code></td><td>${v ? `<b>${esc(show(v.v))}</b>${pill(v)}` : '<span class="empty">leeg</span>'}</td></tr>`;
    $('#panel').innerHTML = `
      <div class="pp-h"><span class="av big av-${p.key}">${p.initials}</span><div><b>${esc(p.name)}</b><small>${esc(p.subtitle)}</small></div><button class="x" data-act="panel" aria-label="Sluit paneel">×</button></div>
      <div class="pp-src">BlueConic-profiel · ${p.known ? 'bekend (e-mail + opt-in), sync naar ActiveCampaign' : 'anoniem (cookie)'}</div>

      <div class="pp-sec nba-box ${state.flash.has('nba') ? 'flash' : ''}"><h4>D. Sturing · next_best_action</h4><b>${esc(nbaContent(nk, p).title)}</b><small><code>actie_${nk}</code> · eerste actie in Actiemodel-volgorde met status Relevant of Gestart</small></div>

      <div class="pp-sec ${state.flash.has('fase') ? 'flash' : ''}"><h4>B. Klantreis · klantreis_fase</h4>
        <div class="fase">${FASES.map(x => `<div class="fs ${x.n < fz.n ? 'done' : ''} ${x.n === fz.n ? 'now' : ''}" title="${x.naam}"><span></span><small>${x.n}. ${x.naam}</small></div>`).join('')}</div>
        <p class="pp-why"><b>Fase ${fz.n} · ${esc(FASES[fz.n - 1].naam)}</b>: ${esc(fz.why)}.<br><span class="muted">Focus: ${esc(FASES[fz.n - 1].focus)}</span></p>
        <table class="pf">${STURING.filter(x => x.blok === 'B').map(x => row(x, p.sturing[x.key])).join('')}</table></div>

      <div class="pp-sec"><h4>A. Fundament <span class="cnt">${filledCount(p)}/8</span></h4>
        <table class="pf">${FIELDS.map(x => row(x, p.fields[x.key])).join('')}</table></div>

      <div class="pp-sec"><h4>C. Acties <span class="cnt" title="Matrix Beperking x Actie">R / V / N</span></h4>
        <div class="acts">${ACTIONS.map(a => { const s = status(p, a.key), m = matrix(p, a.key); return `<div class="act ${a.key === nk ? 'nba' : ''} ${state.flash.has('a_' + a.key) ? 'flash' : ''}"><span>${a.label}${a.art9 ? ' 🔒' : ''}<code>actie_${a.key}</code></span><span class="act-r">${m ? `<span class="mx mx-${m}" title="${m === 'R' ? 'Altijd relevant, geen vraag' : m === 'V' ? 'Vraag stellen' : 'Vraag niet stellen'}">${m}</span>` : ''}<span class="st ${s}">${STATUS_LABEL[s]}</span></span></div>`; }).join('')}</div>
        <p class="pp-why muted">R/V/N uit de matrix Beperking x Actie${beperkingen(p).length > 1 ? ' (hoogste waarde over alle beperkingen)' : ''}.</p></div>

      <div class="pp-sec"><h4>D. Sturing</h4><table class="pf">${STURING.filter(x => x.blok === 'D').map(x => row(x, p.sturing[x.key])).join('')}</table></div>

      <div class="pp-sec"><h4>Volgende vraag in de wachtrij</h4>${nq ? `<p class="q-next">“${esc(nq.q)}”<br><small class="muted">${nq.kind === 'field' ? 'fundament: ' + nq.key : nq.kind === 'drempel' ? 'eerst de drempel: actie_' + nq.key + ' (spelregel 5, voorstel)' : nq.kind === 'followup' ? 'follow-up op actie_' + nq.key + ' = Gestart' : nq.kind === 'nba' ? 'vraag van de next best action (wachtrij leeg)' : 'V-vraag: is er nog een drempel? (actie_' + nq.key + ')'}</small></p>` : '<p class="muted">Geen open vragen.</p>'}</div>

      <div class="pp-sec"><h4>Recent gedrag</h4><ul class="log">${p.log.slice().reverse().map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`;
    document.body.classList.toggle('panel-open', state.panel);
  }

  /* ================= Verrijkingsvraag (BlueConic-dialoog) ================= */
  function renderToaster() {
    const p = state.p;
    if (state.page !== 'home' || state.toastClosed) { $('#toaster').innerHTML = ''; return; }
    const lbl = state.labels ? '<span class="pz-tag in"><b>BlueConic-dialoog</b> max. 1 vraag per bezoek</span>' : '';
    if (state.askedThisVisit) {
      const nq = nextInteraction(p);
      $('#toaster').innerHTML = `<div class="toast done">${lbl}<button class="x" data-act="closetoast" aria-label="Sluiten">×</button>
        <h3>Dank je wel!</h3><p>Zo kunnen we je beter op weg helpen.</p>${state.labels && nq ? '<p class="muted small">Demo: de volgende vraag komt bij het volgende bezoek (spelregel 3).</p>' : ''}
        ${nq ? '<button class="btn nv sm" data-act="nextvisit">Simuleer volgend bezoek →</button>' : ''}</div>`;
      return;
    }
    const q = nextInteraction(p);
    if (!q) { $('#toaster').innerHTML = ''; return; }
    if (q.kind === 'drempel') {
      $('#toaster').innerHTML = `<div class="toast">${state.labels ? '<span class="pz-tag in"><b>BlueConic-dialoog</b> eerst de drempel (spelregel 5)</span>' : ''}<button class="x" data-act="closetoast" aria-label="Sluiten">×</button>
        <img src="${IMG.logo}" alt="" class="toast-logo"><h3>${esc(q.q)}</h3><p>${esc(q.sub)}</p>
        <div class="opts"><button class="btn or sm" data-go="drempel">Start de check →</button></div></div>`;
      return;
    }
    const opts = q.multi
      ? `<div class="opts multi">${q.options.map(([l, v]) => `<label class="chk ${state.pick.includes(v) ? 'on' : ''}"><input type="checkbox" data-pick="${esc(v)}" ${state.pick.includes(v) ? 'checked' : ''}> ${esc(l)}</label>`).join('')}</div>
         <button class="btn or sm" data-act="savemulti" ${state.pick.length && state.consent ? '' : 'disabled'}>Opslaan</button>`
      : `<div class="opts">${q.options.map(([l], i) => `<button class="opt" data-ans="${i}" ${q.consent && !state.consent ? 'disabled' : ''}>${esc(l)}</button>`).join('')}</div>`;
    $('#toaster').innerHTML = `
      <div class="toast">${lbl}<button class="x" data-act="closetoast" aria-label="Sluiten">×</button>
        <img src="${IMG.logo}" alt="" class="toast-logo">
        <h3>${esc(q.q)}</h3><p>${esc(q.sub)}</p>
        ${q.consent ? `<label class="consent"><input type="checkbox" id="consent" ${state.consent ? 'checked' : ''}> Ik geef Uniek Sporten uitdrukkelijk toestemming om deze gezondheidsinformatie te gebruiken om mij passend aanbod te tonen. Je kunt dit altijd weer intrekken.</label>` : ''}
        ${opts}
      </div>`;
  }

  function commit(changes, asked = true) {
    const p = state.p, before = { nba: nba(p), fase: fase(p).n, st: Object.fromEntries(ACTIONS.map(a => [a.key, status(p, a.key)])) };
    state.flash = new Set();
    changes(p);
    ACTIONS.forEach(a => { if (status(p, a.key) !== before.st[a.key]) state.flash.add('a_' + a.key); });
    if (nba(p) !== before.nba) state.flash.add('nba');
    if (fase(p).n !== before.fase) state.flash.add('fase');
    p.sturing.laatste_interactie = { v: '2026-11-09', src: 'gedrag', when: 'zojuist' };
    if (asked) state.askedThisVisit = true;
    state.pick = []; state.consent = false;
    if (!state.panel && window.innerWidth >= 900) state.panel = true;
    render();
    setTimeout(() => { state.flash = new Set(); renderPanel(); }, 2800);
  }

  function answer(i) {
    const q = nextInteraction(state.p), [label, val, extra] = q.options[i];
    commit(p => {
      if (q.kind === 'field') { p.fields[q.key] = { v: val, src: 'gevraagd', when: 'zojuist' }; state.flash.add(q.key); }
      else if (val === 'help') p.progress.buurtsportcoach = 'relevant_gevraagd';
      else p.progress[q.key] = val;
      Object.entries(extra || {}).forEach(([k, v]) => { p.fields[k] = { v, src: 'gevraagd', when: 'zojuist' }; state.flash.add(k); });
      p.log.push(`Zojuist: “${q.q}” → ${label}`);
    });
  }

  function saveMulti() {
    const q = nextInteraction(state.p), vals = [...state.pick];
    commit(p => {
      p.fields[q.key] = { v: vals, src: 'gevraagd', when: 'zojuist' }; state.flash.add(q.key);
      p.log.push(`Zojuist: type_beperking → ${vals.join(', ')} (met aparte toestemming)`);
    });
  }

  /* ================= Rondleiding ================= */
  const TOUR = [
    { persona: 'anon', page: 'home', t: 'Zo ziet de site er vandaag voor iedereen uit', d: 'Een nieuwe bezoeker in fase 1, Bewustwording. Het profiel rechts is leeg: we weten niet wie het is of wat hij zoekt.' },
    { persona: 'anon', page: 'home', t: 'Eén vraag per bezoek vult het fundament', d: '“Voor wie kijk je vandaag?” Beantwoord de vraag en simuleer een paar bezoeken. Bij 4 velden schuift de bezoeker naar fase 2 en krijgt hij een eigen volgende stap.' },
    { persona: 'mark', page: 'home', t: 'Mark, 52: NAH, herintreder, fase 2 Interesse', d: 'Herintreder en inactief met sportwens: beweegadvies is relevant en staat bovenaan het Actiemodel. Zijn volgende vraag komt uit de matrix: zou hij samen willen sporten?' },
    { persona: 'kim', page: 'home', t: 'Kim, 27: rolstoel, fase 3 Oriëntatie', d: 'Sportzoeker en hulpmiddel zijn afgerond, dus de proefles is relevant. Antwoord “Soms” op de vervoersvraag: vervoer wordt de volgende stap. Doe de vervoerscheck, start de aanvraag en markeer hem als geregeld: dan is de proefles weer aan de beurt.' },
    { persona: 'kim', page: 'sportzoeker', t: 'De Sportzoeker staat al klaar', d: 'Woonplaats, sport en beperking komen uit het profiel. De resultaten zijn gesorteerd op match.' },
    { persona: 'henk', page: 'home', t: 'Henk, 63: Parkinson, fase 5 Actief deelnemen', d: 'Actief zonder club, met 4 thuisworkouts gedaan. Zijn volgende stap is een club. Kiest hij voor samen sporten, dan wordt een sportmaatje de volgende stap.' },
    { persona: 'henk', page: 'mail', t: 'Dezelfde stap in de mail', d: 'BlueConic synct de next best action en de klantreisfase naar ActiveCampaign. Site en mail vertellen hetzelfde verhaal, één stap tegelijk.' },
    { persona: 'anon', page: 'home', t: 'Eén profiel, overal dezelfde volgende stap', d: 'Velden, beperkingen, fases en regels komen uit ons datamodel en draaien op BlueConic en ActiveCampaign. De vraag voor vandaag: hoe ver willen we in 2027 komen?' },
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
    if (s.persona !== state.pkey || i === 0) setPersona(s.persona, false);
    state.page = s.page;
    if (window.innerWidth >= 900 && [1, 2, 3, 5].includes(i)) state.panel = true;
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ================= Render & events ================= */
  function setPersona(k, doRender = true) {
    Object.assign(state, { pkey: k, p: clone(PERSONAS[k]), flash: new Set(), toastClosed: false, askedThisVisit: false, pick: [], consent: false, flow: null });
    if (state.page === 'drempel') state.page = 'home';
    if (doRender) { render(); window.scrollTo({ top: 0 }); }
  }

  function render() {
    renderBar();
    const p = state.p;
    $('#app').innerHTML = `<div class="site">${state.page === 'home' ? home(p) : state.page === 'sportzoeker' ? sportzoeker(p) : state.page === 'drempel' && state.flow ? drempel(p) : mail(p)}</div>`;
    renderPanel(); renderToaster(); renderTour();
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-persona],[data-page],[data-go],[data-act],[data-ans],[data-fopt]');
    if (!t) return;
    if (t.dataset.persona) { state.tour = null; setPersona(t.dataset.persona); return; }
    if (t.dataset.page) { e.preventDefault(); state.page = t.dataset.page; render(); window.scrollTo({ top: 0 }); return; }
    if (t.dataset.go) {
      if (t.dataset.go === 'drempel') { openFlow(nba(state.p)); render(); window.scrollTo({ top: 0 }); }
      else if (t.dataset.go !== 'home') { state.page = t.dataset.go; render(); window.scrollTo({ top: 0 }); }
      return;
    }
    if (t.dataset.fopt !== undefined) {
      const F = state.flow, st = FLOWS[F.key].steps[F.step];
      F.answers[st.key] = st.options[+t.dataset.fopt]; F.step++;
      render(); return;
    }
    if (t.dataset.ans !== undefined) { answer(+t.dataset.ans); return; }
    const a = t.dataset.act;
    if (a === 'panel') { state.panel = !state.panel; render(); }
    if (a === 'labels') { state.labels = !state.labels; render(); }
    if (a === 'closetoast') { state.toastClosed = true; renderToaster(); }
    if (a === 'nextvisit') { state.askedThisVisit = false; state.p.log.push('Nieuw bezoek'); render(); }
    if (a === 'savemulti') saveMulti();
    if (a === 'fback') { state.flow.step--; render(); }
    if (a === 'frestart') { state.flow = { key: state.flow.key, step: 0, answers: {} }; render(); }
    if (a === 'fstart' || a === 'fdone') {
      const F = state.flow, val = a === 'fstart' ? 'gestart' : 'afgerond';
      commit(p => {
        p.progress[F.key] = val;
        p.flowAnswers = { ...(p.flowAnswers || {}), [F.key]: F.answers };
        p.log.push(`Zojuist: ${a === 'fstart' ? FLOWS[F.key].gestart : FLOWS[F.key].afgerond} (actie_${F.key} = ${STATUS_LABEL[val]})`);
      });
    }
    if (a === 'tour') goTour(state.tour === null ? 0 : state.tour);
    if (a === 'tnext') goTour(state.tour + 1);
    if (a === 'tprev') goTour(state.tour - 1);
    if (a === 'tclose') { state.tour = null; renderTour(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'consent') { state.consent = e.target.checked; renderToaster(); }
    if (e.target.dataset.pick) {
      const v = e.target.dataset.pick;
      state.pick = e.target.checked ? [...state.pick, v] : state.pick.filter(x => x !== v);
      renderToaster();
    }
  });
  document.addEventListener('keydown', e => {
    if (state.tour === null) return;
    if (e.key === 'ArrowRight') goTour(state.tour + 1);
    if (e.key === 'ArrowLeft' && state.tour > 0) goTour(state.tour - 1);
    if (e.key === 'Escape') { state.tour = null; renderTour(); }
  });

  render();
})();
