const fs = require('fs'), path = require('path'), assert = require('assert');
require('../js/parsers.js'); require('../js/categorize.js'); require('../js/sample.js');
const { parseBankFile, parseAmount } = globalThis.PotjeParsers;
const { categorize, summarize, buildTips, findRecurring } = globalThis.PotjeCore;
const read = f => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');
const cat = t => categorize(t, {});

assert.strictEqual(parseAmount('1.234,56'), 1234.56);
assert.strictEqual(parseAmount('-12,50'), -12.5);
assert.strictEqual(parseAmount('+1,234.56'), 1234.56);

let r = parseBankFile(read('ing.csv'));
assert.strictEqual(r.bank, 'ING'); assert.strictEqual(r.transactions.length, 3);
assert.deepStrictEqual(r.transactions.map(t => t.amount), [-42.17, -13.99, 2940]);
assert.deepStrictEqual(r.transactions.map(cat), ['boodschappen', 'abonnementen', 'inkomen']);
assert.strictEqual(r.transactions[0].date, '2026-11-15');

r = parseBankFile(read('rabo.csv'));
assert.strictEqual(r.bank, 'Rabobank');
assert.deepStrictEqual(r.transactions.map(t => [t.amount, t.name, cat(t)]), [[-29.99, 'Basic-Fit Nederland', 'vrijetijd'], [18.5, 'J. de Vries', 'inkomen']]);

r = parseBankFile(read('abn.TAB'));
assert.strictEqual(r.bank, 'ABN AMRO');
assert.deepStrictEqual(r.transactions.map(t => [t.date, t.amount, t.name, cat(t)]), [['2026-11-13', -40, 'Thuisbezorgd.nl', 'uiteten'], ['2026-11-01', -1185, 'Woonstichting De Key', 'wonen']]);

r = parseBankFile(read('bunq.csv'));
assert.strictEqual(r.bank, 'bunq');
assert.deepStrictEqual(r.transactions.map(t => [t.amount, cat(t)]), [[-189, 'shopping']]);

assert.throws(() => parseBankFile('foo;bar\n1;2'), /herkennen/);

// Voorbeelddata: alles gecategoriseerd, tips en terugkerende lasten gevonden.
const txs = globalThis.PotjeSample.makeSampleTransactions(new Date('2026-11-19')).map(t => ({ ...t, category: cat(t) }));
const overig = txs.filter(t => t.category === 'overig');
assert.deepStrictEqual([...new Set(overig.map(t => t.name))], [], 'onbekende categorie: ' + overig.map(t => t.name));
const s = summarize(txs.filter(t => t.date.startsWith('2026-10')));
assert.strictEqual(s.income, 2940 + 18.5);
const rec = findRecurring(txs).map(x => x.name);
['Netflix International B.V.', 'Spotify AB', 'Basic-Fit Nederland', 'Woonstichting De Key'].forEach(n => assert(rec.includes(n), 'mist ' + n));
assert(!rec.some(n => /Albert|Jumbo|NS Groep/.test(n)), 'boodschappen als vaste last: ' + rec);
const tips = buildTips(txs, '2026-10');
console.log('tips okt:', tips.map(t => `${t.title} (${Math.round(t.yearly)}/jr)`));
console.log('vaste lasten:', rec.join(', '));
console.log('alle parser-tests geslaagd');
assert.strictEqual(cat({ name: 'Disney Plus', desc: '', amount: -10.99 }), 'abonnementen');
assert.strictEqual(cat({ name: 'PLUS Jansen', desc: '', amount: -23 }), 'boodschappen');
assert(rec.includes('Disney Plus'));
console.log('extra checks ok');
