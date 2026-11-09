// Demo-data voor het 360 graden klantprofiel van Uniek Sporten.
// Fundament: sheet "Uniek_Sporten 360-graden klantprofiel" (velden, waardes, Actiemodel, Beperking x Actie, Klantreisfase).
// Verhalen, workouts en beelden komen van unieksporten.nl. Personas en clubs zijn illustratief.

const CDN = 'https://cdn.unieksporten.nl/unieksporten/uploadedimages/';
const SITE = 'https://www.unieksporten.nl';

const IMG = {
  logo: SITE + '/Content/images/img/logo2023.svg',
  zoekjerot: 'https://cdn.unieksporten.nl/unieksporten/userfiles/zoekjerot/afbeelding-voor-homepage-us.jpg',
  hulpmiddelHome: 'https://cdn.unieksporten.nl/unieksporten/userfiles/2026/homeslides/hulpmiddel-home-hoog.png',
  tileSport: SITE + '/Content/images/newhome/sportzoeken.png',
  tileThuis: SITE + '/Content/images/newhome/video-thuis-new.png',
  tileHulp: SITE + '/Content/images/newhome/hulpmiddelen.png',
  tileAdvies: SITE + '/Content/images/newhome/contact.png',
};

/* ---------- Datamodel uit de sheet ---------- */

// type_beperking: de 8 waardes uit de sheet (meerwaardig veld)
const BEPERKINGEN = ['Visueel', 'Auditief', 'Autisme', 'Chronisch', 'Lichamelijk met hulpmiddel behoefte', 'Lichamelijk zonder hulpmiddel behoefte', 'NAH', 'G-categorie'];
const BEPERKING_LABEL = {
  'Visueel': 'Visuele beperking', 'Auditief': 'Auditieve beperking', 'Autisme': 'Autisme', 'Chronisch': 'Chronische aandoening',
  'Lichamelijk met hulpmiddel behoefte': 'Lichamelijk, met hulpmiddel', 'Lichamelijk zonder hulpmiddel behoefte': 'Lichamelijk, zonder hulpmiddel',
  'NAH': 'NAH (hersenletsel)', 'G-categorie': 'G-categorie (verstandelijk)',
};
// Hoe we de beperking in een zin noemen
const BEPERKING_ZIN = {
  'Visueel': ['een visuele beperking', 'visuele beperkingen'], 'Auditief': ['een auditieve beperking', 'auditieve beperkingen'], 'Autisme': ['autisme', 'autisme'],
  'Chronisch': ['een chronische aandoening', 'chronische aandoeningen'], 'Lichamelijk met hulpmiddel behoefte': ['een lichamelijke beperking', 'lichamelijke beperkingen'],
  'Lichamelijk zonder hulpmiddel behoefte': ['een lichamelijke beperking', 'lichamelijke beperkingen'], 'NAH': ['NAH', 'NAH'], 'G-categorie': ['een verstandelijke beperking', 'G-sporters'],
};

// Blok A t/m D. Waardes in de datanotatie van de sheet.
const FIELDS = [
  { key: 'type_bezoeker', label: 'Type bezoeker', blok: 'A', fase: 1, values: ['Sporter', 'Zorgprofessional', 'Ouder', 'Buurtsportcoach', 'Club', 'Beleidsmaker'] },
  { key: 'type_beperking', label: 'Type beperking', blok: 'A', fase: 1, multi: true, art9: true, values: BEPERKINGEN },
  { key: 'sportervaring', label: 'Sportervaring', blok: 'A', fase: 1, values: ['Beginner', 'Gevorderd', 'Herintreder'] },
  { key: 'sportstatus', label: 'Sportstatus', blok: 'A', fase: 1, values: ['ActiefClub', 'ActiefZonderClub', 'InactiefMetSportwens', 'Inactief'] },
  { key: 'beweegambitie', label: 'Beweegambitie', blok: 'A', fase: 1, values: ['Fitter', 'Sociaal', 'Sterker', 'AlgemeenDagelijks', 'Preventie', 'Plezier'] },
  { key: 'vertrouwen_sporten', label: 'Vertrouwen sporten', blok: 'A', fase: 2, values: ['Laag', 'Gemiddeld', 'Hoog'] },
  { key: 'sportvoorkeur', label: 'Sportvoorkeur', blok: 'A', fase: 2, values: ['Thuis', 'Buiten', 'Vereniging', 'Sportschool'] },
  { key: 'woonplaats', label: 'Woonplaats', blok: 'A', fase: 1 },
];
const STURING = [
  { key: 'zoektocht_fase', label: 'Zoektocht-fase', blok: 'B' },
  { key: 'kanaal_voorkeur', label: 'Kanaalvoorkeur', blok: 'D' },
  { key: 'laatste_interactie', label: 'Laatste interactie', blok: 'D' },
];

// Blok C: de 10 diensten, in de volgorde van het Actiemodel (= prioriteit voor de next best action)
const ACTIONS = [
  { key: 'beweegadvies', label: 'Beweegadvies', q: { q: 'Wil je gratis persoonlijk beweegadvies?', options: [['Ja', 'relevant_gevraagd'], ['Nee', 'nietrelevant']] } },
  { key: 'financien', label: 'Financiën', terughoudend: true, q: { q: 'Zou financiële ondersteuning je helpen om te (blijven) sporten?', options: [['Ja', 'relevant_gevraagd'], ['Nee', 'nietrelevant'], ['Weet niet', 'relevant_gevraagd']] } },
  { key: 'vervoer', label: 'Vervoer', q: { q: 'Kun je zelf naar een sportlocatie komen?', options: [['Ja', 'nietrelevant'], ['Nee', 'relevant_gevraagd'], ['Soms', 'relevant_gevraagd']] } },
  { key: 'hulpmiddelen', label: 'Hulpmiddelen', art9: true, q: { q: 'Gebruik je een sporthulpmiddel of zou je er een willen proberen?', options: [['Ja, ik gebruik er een', 'relevant_gevraagd'], ['Ik wil er een proberen', 'relevant_gevraagd'], ['Nee', 'nietrelevant']] } },
  { key: 'maatje', label: 'Maatje', q: { q: 'Zou je liever samen met iemand sporten?', options: [['Ja, graag', 'relevant_gevraagd'], ['Misschien', 'relevant_gevraagd'], ['Liever alleen', 'nietrelevant']] } },
  { key: 'buurtsportcoach', label: 'Buurtsportcoach', q: { q: 'Wil je dat een buurtsportcoach met je meedenkt?', options: [['Ja', 'relevant_gevraagd'], ['Nee', 'nietrelevant']] } },
  { key: 'sportzoeker', label: 'Sportzoeker', q: { q: 'Zullen we kijken wat er bij jou in de buurt kan?', options: [['Ja', 'relevant_gevraagd'], ['Nu niet', 'nietrelevant']] } },
  { key: 'proefles', label: 'Proefles', q: { q: 'Klaar om het gewoon eens te proberen?', options: [['Plan proefles', 'gestart'], ['Nog niet', 'nietrelevant']] } },
  { key: 'thuisworkouts', label: 'Thuis workouts', q: { q: 'Wil je thuis alvast beginnen met korte workouts?', options: [['Ja', 'relevant_gevraagd'], ['Nee', 'nietrelevant']] } },
  { key: 'inspiratie', label: 'Inspiratie', q: null },
];

const STATUS_LABEL = { onbekend: 'Onbekend', nietrelevant: 'NietRelevant', relevant_gevraagd: 'Relevant (gevraagd)', relevant_signaal: 'Relevant (signaal)', gestart: 'Gestart', afgerond: 'Afgerond' };

// Tab "Beperking x Actie". R = altijd relevant (geen vraag), V = vraag stellen, N = vraag niet stellen.
// NAH staat niet in de matrix; het Actiemodel noemt NAH bij hulpmiddelen als V. In de demo volgt NAH daarom de rij van Chronisch.
const MATRIX_COLS = ['beweegadvies', 'sportzoeker', 'proefles', 'maatje', 'hulpmiddelen', 'vervoer', 'financien', 'thuisworkouts', 'buurtsportcoach', 'inspiratie'];
const MATRIX = {
  'Visueel': 'RRRVVVVVVR', 'Auditief': 'RRRVNVVVVR', 'Autisme': 'RRRVNVVVVR', 'Chronisch': 'RRRVVVVVVR',
  'Lichamelijk met hulpmiddel behoefte': 'RRRVVVVVVR', 'Lichamelijk zonder hulpmiddel behoefte': 'RRRVNVVVVR', 'G-categorie': 'RRRVNVVVVR',
  'NAH': 'RRRVVVVVVR',
};

// Tab "Klantreisfase"
const FASES = [
  { n: 1, naam: 'Bewustwording', focus: 'Vertrouwen opbouwen en fundament verrijken. Geen conversiedruk.' },
  { n: 2, naam: 'Interesse', focus: 'Richting geven: beweegadvies of sportzoeker als eerste concrete stap.' },
  { n: 3, naam: 'Oriëntatie', focus: 'Drempels één voor één wegnemen, in NBA-volgorde.' },
  { n: 4, naam: 'Proberen', focus: 'Aanmoedigen en afronden: verwachtingen en follow-up na de proefles.' },
  { n: 5, naam: 'Actief deelnemen', focus: 'Van een paar keer sporten naar een vaste plek.' },
  { n: 6, naam: 'Duurzaam actief', focus: 'Behoud en verdieping: events, community, maatje voor een ander.' },
];

/* ---------- Content van unieksporten.nl ---------- */

const STORIES = [
  { id: 'stefan', title: 'Vijf jaar na herseninfarct loopt Stefan Barrett marathon onder vier uur', img: CDN + '6ed495e0-33a2-48b2-948b-77fe49257cf1.jpeg', url: SITE + '/actueel/nieuws/17456/vijf-jaar-na-herseninfarct-loopt-stefan-barrett-marathon-onder-vier-uu', tags: ['NAH', 'Herintreder'] },
  { id: 'yolanda', title: 'Yolanda legt triatlons af met een halfzijdige verlamming: "Door te bewegen vergeet ik mijn beperking"', img: CDN + '5f490210-927b-41ed-af83-3728739a555d.jpg', url: SITE + '/actueel/nieuws/17443/yolanda-legt-triatlons-af--met-een-halfzijdige-verlamming-door-te-bewegen-vergeet-ik-mijn-beperking', tags: ['NAH', 'Herintreder'] },
  { id: 'bloem', title: 'Wereldberoemde Parkinsonexpert Bas Bloem naar Eindhoven: wat kan klimmen betekenen bij Parkinson?', img: CDN + '3079a6cf-91bc-48b9-940e-0ca704b0dc94.jpg', url: SITE + '/actueel/nieuws/17445/wereldberoemde-parkinsonexpert-bas-bloem-naar-eindhoven-wat-kan-klimmen-betekenen-bij-parkinson', tags: ['Chronisch', 'Eindhoven'] },
  { id: 'wk', title: 'Zes medailles voor Nederland op WK Para-baanwielrennen in Apeldoorn', img: CDN + 'b1c48049-dda8-494b-a05e-387cf4f471e0.png', url: SITE + '/actueel/nieuws/17448/zes-medailles-voor-nederland-op-wk-para-baanwielrennen-in-apeldoorn', tags: ['Lichamelijk met hulpmiddel behoefte', 'Lichamelijk zonder hulpmiddel behoefte', 'Visueel'] },
  { id: 'rolstoel', title: 'Handbewogen rolstoelvaardigheidstraining in Vianen', img: CDN + 'bf5c47ec-d371-4d53-9451-4cdff803262d.jpg', url: SITE + '/actueel/nieuws/17454/handbewogen-rolstoelvaardigheidstraining--vianen--14-11-2026', tags: ['Lichamelijk met hulpmiddel behoefte'] },
  { id: 'salsa', title: 'Blinde liefde voor salsa eindigt het jaar met nog 3 swingende lessen', img: CDN + 'cede9cfb-9dad-4e5a-9700-5998c07f8322.jpeg', url: SITE + '/actueel/nieuws/17451/blinde-liefde-voor-salsa-eindigt-het-jaar-met-nog-3-swingende-lessen', tags: ['Visueel'] },
  { id: 'eigenwijs', title: 'EigenWIJS 12+: sporten, chillen, nieuwe mensen ontmoeten en vooral veel plezier', img: CDN + 'ec915554-17a2-4f36-999d-c5140513daa3.jpg', url: SITE + '/actueel/nieuws/17455/eigenwijs-12--sporten--chillen--nieuwe-mensen-ontmoeten-en-vooral-veel-plezier---start-14-november-in-gouda', tags: ['Autisme', 'G-categorie'] },
  { id: 'marathon', title: 'Een sport vinden hoeft geen marathon te zijn', img: CDN + '97891847-9e52-44e6-be8b-97f152beb6dd.png', url: SITE + '/actueel/nieuws/17452/een-sport-vinden-hoeft-geen-marathon-te-zijn', tags: ['algemeen'] },
  { id: 'tennis', title: 'Inclusief tennistoernooi bij NRC De Wiltsangh in Nunspeet', img: CDN + '4936fa3e-86ec-45c5-840d-19ab3de58de9.jpeg', url: SITE + '/actueel/nieuws/17442/inclusief-tennis-toernooi-bij-nrc-de-wiltsangh-in-nunspeet', tags: ['algemeen'] },
];

const LOCAL = [
  { id: 'eigenwijs', region: 'Midden-Holland', title: 'EigenWIJS 12+: sporten, chillen, nieuwe mensen ontmoeten en vooral veel plezier! Start 14 november in Gouda', img: CDN + 'ec915554-17a2-4f36-999d-c5140513daa3.jpg', url: SITE + '/actueel/nieuws/17455/eigenwijs-12--sporten--chillen--nieuwe-mensen-ontmoeten-en-vooral-veel-plezier---start-14-november-in-gouda', near: [] },
  { id: 'vianen', region: 'Lekstroom', title: 'Handbewogen rolstoelvaardigheidstraining | Vianen | 14-11-2026', img: CDN + 'bf5c47ec-d371-4d53-9451-4cdff803262d.jpg', url: SITE + '/actueel/nieuws/17454/handbewogen-rolstoelvaardigheidstraining--vianen--14-11-2026', near: ['Amsterdam', 'Utrecht'] },
  { id: 'woerden', region: 'Woerden', title: 'Klauterkooi Woerden, zondag 15 november', img: CDN + 'f7e46419-b5bc-4dbb-b493-e1440e08f357.png', url: SITE + '/actueel/nieuws/17439/klauterkooi-woerden--zondag-15-november', near: ['Utrecht'] },
  { id: 'bloem-local', region: 'Eindhoven', title: 'Parkinsonexpert Bas Bloem naar Eindhoven: wat kan klimmen betekenen bij Parkinson?', img: CDN + '3079a6cf-91bc-48b9-940e-0ca704b0dc94.jpg', url: SITE + '/actueel/nieuws/17445/wereldberoemde-parkinsonexpert-bas-bloem-naar-eindhoven-wat-kan-klimmen-betekenen-bij-parkinson', near: ['Eindhoven'] },
];

const WORKOUTS = [
  { id: 'adem', title: 'Ademhalingsoefeningen voor rust in je lijf én in je hoofd', min: 7, img: CDN + 'f64b6ce1-28c4-45a1-8398-d472faeb412a', tags: ['NAH', 'Chronisch', 'Laag'] },
  { id: 'aletta', title: 'Ademhalingsoefeningen met Aletta voor een ontspannen en licht gevoel', min: 6, img: CDN + '883e8ab4-f091-42cf-9941-ff24cc84df20', tags: ['Chronisch', 'Laag'] },
  { id: 'tafel', title: 'Oefeningen aan tafel', min: 11, img: CDN + '6d3a9a87-e172-4869-b097-7113a4f0bacd', tags: ['NAH', 'Laag'] },
  { id: 'kracht', title: 'Kracht en mobiliteit', min: 13, img: CDN + '21ef0e98-73f7-46a7-b4fa-e7b833d55d2b', tags: ['Lichamelijk met hulpmiddel behoefte', 'Chronisch'] },
  { id: 'arm', title: 'Arm- en handoefeningen', min: 10, img: CDN + '316cd704-1ebc-4616-9d76-e3d605d8fc63', tags: ['NAH', 'Lichamelijk met hulpmiddel behoefte'] },
];

/* ---------- Personas (sporters; Henk heeft een chronische aandoening) ---------- */
// fields: waarde + bron (gevraagd = actief, gedrag = passief) + moment
// progress: expliciete actiestatussen (Gestart/Afgerond, of antwoord op een V-vraag), signals: passieve signalen (zet Relevant (signaal))
const f = (v, src, when) => ({ v, src, when });

const PERSONAS = {
  anon: {
    key: 'anon', name: 'Nieuwe bezoeker', first: null, initials: '?', subtitle: 'Eerste bezoek, nog anoniem', known: false, optin: false,
    fields: {}, sturing: { zoektocht_fase: f('Orienterend', 'gedrag', 'nu'), laatste_interactie: f('2026-11-09', 'gedrag', 'nu') },
    progress: {}, signals: {}, workoutsDone: 0,
    log: ['Eerste bezoek via Google: "sporten met een beperking"'],
  },
  mark: {
    key: 'mark', name: 'Mark de Vries', first: 'Mark', initials: 'MV', subtitle: '52 jaar · NAH na herseninfarct · Utrecht', known: true, optin: true,
    fields: {
      type_bezoeker: f('Sporter', 'gevraagd', '14 sep'), type_beperking: f(['NAH'], 'gevraagd', '14 sep'), sportervaring: f('Herintreder', 'gevraagd', '21 sep'),
      sportstatus: f('InactiefMetSportwens', 'gevraagd', '21 sep'), beweegambitie: f('Fitter', 'gevraagd', '2 okt'), sportvoorkeur: f(['Thuis'], 'gedrag', '4 nov'),
      woonplaats: f('Utrecht', 'gevraagd', '14 sep'),
    },
    sturing: { zoektocht_fase: f('Orienterend', 'gedrag', '7 nov'), kanaal_voorkeur: f('Mail', 'gedrag', 'okt'), laatste_interactie: f('2026-11-07', 'gedrag', '7 nov') },
    progress: { financien: 'nietrelevant', vervoer: 'nietrelevant', hulpmiddelen: 'nietrelevant', inspiratie: 'gestart' },
    signals: { beweegadvies: 'Beweegadvies-pagina 2x bezocht zonder vervolgstap' },
    workoutsDone: 0,
    log: ['3 verhalen over NAH gelezen (inspiratie gestart)', 'Beweegadvies-pagina 2x bezocht, geen aanvraag', 'Antwoorden op vragen financiën, vervoer en hulpmiddelen: nee'],
  },
  kim: {
    key: 'kim', name: 'Kim Jansen', first: 'Kim', initials: 'KJ', subtitle: '27 jaar · rolstoel · Amsterdam', known: true, optin: true,
    fields: {
      type_bezoeker: f('Sporter', 'gevraagd', '2 okt'), type_beperking: f(['Lichamelijk met hulpmiddel behoefte'], 'gevraagd', '2 okt'), sportervaring: f('Gevorderd', 'gevraagd', '2 okt'),
      sportstatus: f('ActiefZonderClub', 'gevraagd', '9 okt'), beweegambitie: f('Sociaal', 'gevraagd', '9 okt'), vertrouwen_sporten: f('Hoog', 'gevraagd', '16 okt'),
      sportvoorkeur: f(['Vereniging', 'rolstoelbasketbal'], 'gedrag', '7 nov'), woonplaats: f('Amsterdam', 'gevraagd', '2 okt'),
    },
    sturing: { zoektocht_fase: f('NietOrienterend', 'gedrag', '7 nov'), kanaal_voorkeur: f('App', 'gevraagd', 'okt'), laatste_interactie: f('2026-11-07', 'gedrag', '7 nov') },
    progress: { financien: 'nietrelevant', hulpmiddelen: 'afgerond', sportzoeker: 'afgerond', inspiratie: 'gestart' },
    signals: {},
    workoutsDone: 0,
    log: ['Sportrolstoel in gebruik via Hulpmiddelen (afgerond)', 'Sportzoeker: rolstoelbasketbal Amsterdam, club opgeslagen (afgerond)', 'Clubpagina bekeken (7 nov)'],
  },
  henk: {
    key: 'henk', name: 'Henk Bosman', first: 'Henk', initials: 'HB', subtitle: '63 jaar · Parkinson (chronisch) · Eindhoven', known: true, optin: true,
    fields: {
      type_bezoeker: f('Sporter', 'gevraagd', '20 aug'), type_beperking: f(['Chronisch'], 'gevraagd', '20 aug'), sportervaring: f('Gevorderd', 'gevraagd', '27 aug'),
      sportstatus: f('ActiefZonderClub', 'gevraagd', '27 aug'), beweegambitie: f('Sociaal', 'gevraagd', '3 sep'), vertrouwen_sporten: f('Gemiddeld', 'gevraagd', '10 sep'),
      sportvoorkeur: f(['Vereniging', 'klimmen'], 'gedrag', '6 nov'), woonplaats: f('Eindhoven', 'gevraagd', '20 aug'),
    },
    sturing: { zoektocht_fase: f('Orienterend', 'gedrag', '6 nov'), kanaal_voorkeur: f('Mail', 'gedrag', 'sep'), laatste_interactie: f('2026-11-06', 'gedrag', '6 nov') },
    progress: { beweegadvies: 'afgerond', financien: 'nietrelevant', vervoer: 'nietrelevant', hulpmiddelen: 'nietrelevant', thuisworkouts: 'afgerond', inspiratie: 'gestart' },
    signals: {},
    workoutsDone: 4,
    log: ['Beweegadvies gehad (sep, afgerond)', '4 thuisworkouts gedaan in oktober (afgerond)', 'Artikel "klimmen bij Parkinson" gelezen (6 nov)'],
  },
};

// Vragen voor het fundament (blok A), in de volgorde waarin we ze stellen bij een nieuwe bezoeker
const FIELD_QUESTIONS = {
  type_bezoeker: { q: 'Voor wie kijk je vandaag?', sub: 'Dan laten we je zien wat bij jou past.', options: [['Voor mezelf', 'Sporter'], ['Voor mijn kind', 'Ouder'], ['Ik ben zorgprofessional', 'Zorgprofessional'], ['Ik ben buurtsportcoach', 'Buurtsportcoach'], ['Ik ben van een club', 'Club'], ['Ik ben beleidsmaker', 'Beleidsmaker']] },
  type_beperking: { q: 'Met welke beperking of aandoening wil je sporten?', sub: 'Kies er één of meer. Dan tonen we sporten en verhalen die passen.', multi: true, consent: true, options: BEPERKINGEN.map(b => [BEPERKING_LABEL[b], b]) },
  sportstatus: { q: 'Sport je op dit moment?', sub: 'Dan weten we waar we kunnen beginnen.', options: [['Ja, bij een club', 'ActiefClub'], ['Ja, maar niet bij een club', 'ActiefZonderClub'], ['Nee, maar ik wil wel', 'InactiefMetSportwens'], ['Nee', 'Inactief']] },
  woonplaats: { q: 'Waar woon je?', sub: 'Dan zoeken we mee bij jou in de buurt.', options: ['Amsterdam', 'Utrecht', 'Eindhoven', 'Rotterdam'].map(c => [c, c]) },
};
const FIELD_ORDER = ['type_bezoeker', 'type_beperking', 'sportstatus', 'woonplaats'];

// Sportzoeker-resultaten (illustratief)
const RESULTS = {
  mark: [
    { sport: 'Fitness onder begeleiding', place: 'Utrecht Overvecht', km: 2.4, tags: ['Ervaring met NAH', 'Kleine groep', 'Proefles gratis'], match: 94 },
    { sport: 'Aangepast zwemmen', place: 'Utrecht Zuilen', km: 3.1, tags: ['Rustig tempo', 'Begeleiding in het water'], match: 88 },
    { sport: 'Wandelgroep', place: 'Utrecht Maximapark', km: 5.0, tags: ['Buiten', 'Samen', 'Herintreders'], match: 85 },
  ],
  kim: [
    { sport: 'Rolstoelbasketbal', place: 'Amsterdam Nieuw-West', km: 3.2, tags: ['Teamsport', 'Sportrolstoel welkom', 'Proefles gratis'], match: 97 },
    { sport: 'Rolstoelhandbal', place: 'Amsterdam Oost', km: 6.8, tags: ['Teamsport', 'Gemengd team'], match: 89 },
    { sport: 'Rolstoeltennis', place: 'Amstelveen', km: 11.5, tags: ['Individueel', 'Competitie'], match: 78 },
  ],
  henk: [
    { sport: 'Klimmen voor mensen met Parkinson', place: 'Eindhoven Strijp', km: 2.9, tags: ['Parkinson-groep', 'Samen', 'Begeleid'], match: 96 },
    { sport: 'Boksen bij Parkinson', place: 'Eindhoven Woensel', km: 4.2, tags: ['Parkinson-groep', 'Conditie'], match: 90 },
    { sport: 'Nordic walking', place: 'Eindhoven Genneper Parken', km: 3.6, tags: ['Buiten', 'Samen'], match: 84 },
  ],
  anon: [
    { sport: 'Rolstoelbasketbal', place: 'Diverse locaties', km: null, tags: ['Teamsport'], match: null },
    { sport: 'Aangepast zwemmen', place: 'Diverse locaties', km: null, tags: ['Individueel'], match: null },
    { sport: 'Fitness onder begeleiding', place: 'Diverse locaties', km: null, tags: ['Individueel'], match: null },
  ],
};
