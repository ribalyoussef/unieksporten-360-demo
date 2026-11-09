// Demo-data voor het 360 graden klantprofiel van Uniek Sporten.
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

// Echte verhalen van unieksporten.nl, met tags voor personalisatie
const STORIES = [
  { id: 'stefan', title: 'Vijf jaar na herseninfarct loopt Stefan Barrett marathon onder vier uur', img: CDN + '6ed495e0-33a2-48b2-948b-77fe49257cf1.jpeg', url: SITE + '/actueel/nieuws/17456/vijf-jaar-na-herseninfarct-loopt-stefan-barrett-marathon-onder-vier-uu', tags: ['NAH', 'herintreder'] },
  { id: 'yolanda', title: 'Yolanda legt triatlons af met een halfzijdige verlamming: "Door te bewegen vergeet ik mijn beperking"', img: CDN + '5f490210-927b-41ed-af83-3728739a555d.jpg', url: SITE + '/actueel/nieuws/17443/yolanda-legt-triatlons-af--met-een-halfzijdige-verlamming-door-te-bewegen-vergeet-ik-mijn-beperking', tags: ['NAH', 'herintreder'] },
  { id: 'bloem', title: 'Wereldberoemde Parkinsonexpert Bas Bloem naar Eindhoven: wat kan klimmen betekenen bij Parkinson?', img: CDN + '3079a6cf-91bc-48b9-940e-0ca704b0dc94.jpg', url: SITE + '/actueel/nieuws/17445/wereldberoemde-parkinsonexpert-bas-bloem-naar-eindhoven-wat-kan-klimmen-betekenen-bij-parkinson', tags: ['Chronisch', 'Eindhoven'] },
  { id: 'wk', title: 'Zes medailles voor Nederland op WK Para-baanwielrennen in Apeldoorn', img: CDN + 'b1c48049-dda8-494b-a05e-387cf4f471e0.png', url: SITE + '/actueel/nieuws/17448/zes-medailles-voor-nederland-op-wk-para-baanwielrennen-in-apeldoorn', tags: ['Lichamelijk', 'topsport'] },
  { id: 'rolstoel', title: 'Handbewogen rolstoelvaardigheidstraining in Vianen', img: CDN + 'bf5c47ec-d371-4d53-9451-4cdff803262d.jpg', url: SITE + '/actueel/nieuws/17454/handbewogen-rolstoelvaardigheidstraining--vianen--14-11-2026', tags: ['Lichamelijk', 'rolstoel'] },
  { id: 'salsa', title: 'Blinde liefde voor salsa eindigt het jaar met nog 3 swingende lessen', img: CDN + 'cede9cfb-9dad-4e5a-9700-5998c07f8322.jpeg', url: SITE + '/actueel/nieuws/17451/blinde-liefde-voor-salsa-eindigt-het-jaar-met-nog-3-swingende-lessen', tags: ['Visueel'] },
  { id: 'marathon', title: 'Een sport vinden hoeft geen marathon te zijn', img: CDN + '97891847-9e52-44e6-be8b-97f152beb6dd.png', url: SITE + '/actueel/nieuws/17452/een-sport-vinden-hoeft-geen-marathon-te-zijn', tags: ['algemeen'] },
  { id: 'tennis', title: 'Inclusief tennistoernooi bij NRC De Wiltsangh in Nunspeet', img: CDN + '4936fa3e-86ec-45c5-840d-19ab3de58de9.jpeg', url: SITE + '/actueel/nieuws/17442/inclusief-tennis-toernooi-bij-nrc-de-wiltsangh-in-nunspeet', tags: ['algemeen'] },
];

const LOCAL = [
  { id: 'eigenwijs', region: 'Midden-Holland', title: 'EigenWIJS 12+: sporten, chillen, nieuwe mensen ontmoeten en vooral veel plezier! Start 14 november in Gouda', img: CDN + 'ec915554-17a2-4f36-999d-c5140513daa3.jpg', url: SITE + '/actueel/nieuws/17455/eigenwijs-12--sporten--chillen--nieuwe-mensen-ontmoeten-en-vooral-veel-plezier---start-14-november-in-gouda', near: [] },
  { id: 'vianen', region: 'Lekstroom', title: 'Handbewogen rolstoelvaardigheidstraining | Vianen | 14-11-2026', img: CDN + 'bf5c47ec-d371-4d53-9451-4cdff803262d.jpg', url: SITE + '/actueel/nieuws/17454/handbewogen-rolstoelvaardigheidstraining--vianen--14-11-2026', near: ['Amsterdam', 'Utrecht'] },
  { id: 'woerden', region: 'Woerden', title: 'Klauterkooi Woerden, zondag 15 november', img: CDN + 'f7e46419-b5bc-4dbb-b493-e1440e08f357.png', url: SITE + '/actueel/nieuws/17439/klauterkooi-woerden--zondag-15-november', near: ['Utrecht'] },
  { id: 'bloem-local', region: 'Eindhoven', title: 'Parkinsonexpert Bas Bloem naar Eindhoven: wat kan klimmen betekenen bij Parkinson?', img: CDN + '3079a6cf-91bc-48b9-940e-0ca704b0dc94.jpg', url: SITE + '/actueel/nieuws/17445/wereldberoemde-parkinsonexpert-bas-bloem-naar-eindhoven-wat-kan-klimmen-betekenen-bij-parkinson', near: ['Eindhoven'] },
];

// Echte workouts uit Uniek Sporten Thuis
const WORKOUTS = [
  { id: 'adem', title: 'Ademhalingsoefeningen voor rust in je lijf én in je hoofd', min: 7, img: CDN + 'f64b6ce1-28c4-45a1-8398-d472faeb412a', tags: ['NAH', 'Chronisch', 'laag'] },
  { id: 'aletta', title: 'Ademhalingsoefeningen met Aletta voor een ontspannen en licht gevoel', min: 6, img: CDN + '883e8ab4-f091-42cf-9941-ff24cc84df20', tags: ['Chronisch', 'laag'] },
  { id: 'tafel', title: 'Oefeningen aan tafel', min: 11, img: CDN + '6d3a9a87-e172-4869-b097-7113a4f0bacd', tags: ['NAH', 'laag'] },
  { id: 'kracht', title: 'Kracht en mobiliteit', min: 13, img: CDN + '21ef0e98-73f7-46a7-b4fa-e7b833d55d2b', tags: ['Lichamelijk', 'Chronisch'] },
  { id: 'arm', title: 'Arm- en handoefeningen', min: 10, img: CDN + '316cd704-1ebc-4616-9d76-e3d605d8fc63', tags: ['NAH', 'Lichamelijk'] },
];

// Profielvelden uit het datamodel (blok A. Fundament + sturing)
const FIELDS = [
  { key: 'type_bezoeker', label: 'Type bezoeker' },
  { key: 'type_beperking', label: 'Type beperking', sensitive: true },
  { key: 'sportervaring', label: 'Sportervaring' },
  { key: 'sportstatus', label: 'Sportstatus' },
  { key: 'beweegambitie', label: 'Beweegambitie' },
  { key: 'vertrouwen_sporten', label: 'Vertrouwen in sporten' },
  { key: 'sportvoorkeur', label: 'Sportvoorkeur' },
  { key: 'woonplaats', label: 'Woonplaats' },
];

// Diensten (blok C), in prioriteitsvolgorde voor de next best action
const ACTIONS = [
  { key: 'beweegadvies', label: 'Beweegadvies' },
  { key: 'financien', label: 'Financiën' },
  { key: 'vervoer', label: 'Vervoer' },
  { key: 'hulpmiddelen', label: 'Hulpmiddelen' },
  { key: 'maatje', label: 'Sportmaatje' },
  { key: 'buurtsportcoach', label: 'Buurtsportcoach' },
  { key: 'sportzoeker', label: 'Sportzoeker' },
  { key: 'proefles', label: 'Proefles' },
  { key: 'thuisworkouts', label: 'Thuis workouts' },
  { key: 'inspiratie', label: 'Inspiratie' },
];

const FASES = ['Bewustwording', 'Interesse', 'Oriëntatie', 'Proberen', 'Actief deelnemen', 'Duurzaam actief'];

const STATUS_LABEL = { onbekend: 'Onbekend', nietrelevant: 'Niet relevant', relevant: 'Relevant', gestart: 'Gestart', afgerond: 'Afgerond' };

const f = (v, src, when) => ({ v, src, when: when || '' });
const acts = o => Object.fromEntries(ACTIONS.map(a => [a.key, o[a.key] || 'onbekend']));

// De personas: sporters, één met een chronische aandoening
const PERSONAS = {
  anon: {
    key: 'anon', name: 'Nieuwe bezoeker', first: null, initials: '?', subtitle: 'Eerste bezoek, nog anoniem',
    known: false, optin: false,
    profile: {},
    acties: acts({ inspiratie: 'relevant' }),
    questions: ['type', 'beperking', 'woonplaats'],
    log: ['Eerste bezoek via Google ("sporten met een beperking")'],
  },
  mark: {
    key: 'mark', name: 'Mark de Vries', first: 'Mark', age: 52, initials: 'MV', subtitle: '52 jaar · herseninfarct (NAH) · Utrecht',
    known: true, optin: true,
    profile: {
      type_bezoeker: f('Sporter', 'gevraagd', '14 sep'),
      type_beperking: f('NAH', 'gevraagd', '14 sep'),
      sportervaring: f('Herintreder', 'gevraagd', '21 sep'),
      sportstatus: f('Inactief met sportwens', 'gevraagd', '21 sep'),
      beweegambitie: f('Fitter', 'gevraagd', '2 okt'),
      sportvoorkeur: f('Thuis, buiten', 'gedrag', '4 nov'),
      woonplaats: f('Utrecht', 'gevraagd', '14 sep'),
    },
    acties: acts({ beweegadvies: 'relevant', maatje: 'onbekend', sportzoeker: 'relevant', thuisworkouts: 'relevant', inspiratie: 'gestart', vervoer: 'nietrelevant', financien: 'onbekend' }),
    questions: ['vertrouwen'],
    log: ['3 verhalen over NAH gelezen', 'Beweegadvies-pagina 2x bezocht, nog geen aanvraag', 'Nieuwsbrief geopend (4 nov)'],
  },
  kim: {
    key: 'kim', name: 'Kim Jansen', first: 'Kim', age: 27, initials: 'KJ', subtitle: '27 jaar · dwarslaesie, rolstoel · Amsterdam',
    known: true, optin: true,
    profile: {
      type_bezoeker: f('Sporter', 'gevraagd', '2 okt'),
      type_beperking: f('Lichamelijk met hulpmiddel', 'gevraagd', '2 okt'),
      sportervaring: f('Gevorderd', 'gevraagd', '2 okt'),
      sportstatus: f('Actief zonder club', 'gevraagd', '9 okt'),
      beweegambitie: f('Sociaal', 'gevraagd', '9 okt'),
      vertrouwen_sporten: f('Hoog', 'gevraagd', '16 okt'),
      sportvoorkeur: f('Vereniging · rolstoelbasketbal', 'gedrag', '7 nov'),
      woonplaats: f('Amsterdam', 'gevraagd', '2 okt'),
    },
    acties: acts({ beweegadvies: 'nietrelevant', hulpmiddelen: 'afgerond', sportzoeker: 'afgerond', proefles: 'relevant', inspiratie: 'gestart', financien: 'nietrelevant', maatje: 'nietrelevant' }),
    questions: ['vervoer'],
    log: ['Sportzoeker: rolstoelbasketbal, Amsterdam, < 15 km', 'Clubpagina bekeken (7 nov)', 'Sportrolstoel geleend via Hulpmiddelen'],
  },
  henk: {
    key: 'henk', name: 'Henk Bosman', first: 'Henk', age: 63, initials: 'HB', subtitle: '63 jaar · Parkinson (chronisch) · Eindhoven',
    known: true, optin: true,
    profile: {
      type_bezoeker: f('Sporter', 'gevraagd', '20 aug'),
      type_beperking: f('Chronisch', 'gevraagd', '20 aug'),
      sportervaring: f('Gevorderd', 'gevraagd', '27 aug'),
      sportstatus: f('Actief zonder club', 'gevraagd', '27 aug'),
      beweegambitie: f('Preventie, sociaal', 'gevraagd', '3 sep'),
      vertrouwen_sporten: f('Gemiddeld', 'gevraagd', '10 sep'),
      sportvoorkeur: f('Vereniging · klimmen', 'gedrag', '6 nov'),
      woonplaats: f('Eindhoven', 'gevraagd', '20 aug'),
    },
    acties: acts({ beweegadvies: 'afgerond', sportzoeker: 'relevant', thuisworkouts: 'gestart', inspiratie: 'gestart', vervoer: 'nietrelevant', hulpmiddelen: 'nietrelevant' }),
    questions: ['maatje'],
    log: ['Artikel "klimmen bij Parkinson" gelezen (6 nov)', '4 thuisworkouts gedaan in oktober', 'Beweegadvies gehad (sep)'],
  },
};

// Verrijkingsvragen (BlueConic-dialogen). Elk antwoord zet profielvelden en actiestatussen.
const QUESTIONS = {
  type: {
    q: 'Voor wie kijk je vandaag?', sub: 'Dan laten we je zien wat bij jou past.',
    options: [
      { label: 'Voor mezelf', set: { type_bezoeker: 'Sporter' } },
      { label: 'Voor mijn kind of naaste', set: { type_bezoeker: 'Ouder of naaste' } },
      { label: 'Ik ben professional', set: { type_bezoeker: 'Professional' } },
    ],
  },
  beperking: {
    q: 'Met welke beperking of aandoening wil je sporten?', sub: 'Dan tonen we sporten en verhalen die passen.', consent: true,
    options: [
      { label: 'Lichamelijk', set: { type_beperking: 'Lichamelijk' } },
      { label: 'NAH', set: { type_beperking: 'NAH' } },
      { label: 'Chronisch', set: { type_beperking: 'Chronisch' } },
      { label: 'Visueel', set: { type_beperking: 'Visueel' } },
    ],
    acties: { sportzoeker: 'relevant' },
  },
  woonplaats: {
    q: 'Zullen we kijken wat er bij jou in de buurt kan?', sub: 'Kies je woonplaats.',
    options: ['Amsterdam', 'Utrecht', 'Eindhoven', 'Rotterdam'].map(c => ({ label: c, set: { woonplaats: c } })),
  },
  vertrouwen: {
    q: 'Hoe zeker voel je je over (weer) sporten?', sub: 'Er is geen goed of fout antwoord.',
    options: [
      { label: 'Nog onzeker', set: { vertrouwen_sporten: 'Laag' }, acties: { buurtsportcoach: 'relevant' } },
      { label: 'Gaat wel', set: { vertrouwen_sporten: 'Gemiddeld' } },
      { label: 'Ik heb er zin in', set: { vertrouwen_sporten: 'Hoog' } },
    ],
  },
  vervoer: {
    q: 'Kun je zelf naar een sportlocatie komen?', sub: 'Dan kijken we of vervoer een drempel is.',
    options: [
      { label: 'Ja', acties: { vervoer: 'nietrelevant' } },
      { label: 'Soms', acties: { vervoer: 'relevant' } },
      { label: 'Nee', acties: { vervoer: 'relevant' } },
    ],
  },
  maatje: {
    q: 'Zou je liever samen met iemand sporten?', sub: 'Een sportmaatje maakt de eerste stap vaak makkelijker.',
    options: [
      { label: 'Ja, graag', acties: { maatje: 'relevant' } },
      { label: 'Misschien', acties: { maatje: 'relevant' } },
      { label: 'Liever alleen', acties: { maatje: 'nietrelevant' } },
    ],
  },
};

// Sportzoeker-resultaten (illustratief) per situatie
const RESULTS = {
  mark: [
    { sport: 'Fitness onder begeleiding', place: 'Utrecht Overvecht', km: 2.4, tags: ['NAH-ervaring', 'Kleine groep', 'Proefles gratis'], match: 94 },
    { sport: 'Aangepast zwemmen', place: 'Utrecht Zuilen', km: 3.1, tags: ['Rustig tempo', 'Begeleiding in het water'], match: 88 },
    { sport: 'Wandelgroep "Weer op pad"', place: 'Utrecht Maximapark', km: 5.0, tags: ['Buiten', 'Samen', 'Herintreders'], match: 85 },
  ],
  kim: [
    { sport: 'Rolstoelbasketbal', place: 'Amsterdam Nieuw-West', km: 3.2, tags: ['Teamsport', 'Sportrolstoel te leen', 'Proefles gratis'], match: 97 },
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
