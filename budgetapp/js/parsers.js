/* Potje — inlezen van bankexports (ING, Rabobank, ABN AMRO, bunq, generiek CSV).
   Alles draait in de browser: bankgegevens verlaten het apparaat niet. */
(function (global) {
  'use strict';

  function detectDelimiter(line) {
    const counts = { ';': 0, ',': 0, '\t': 0 };
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (!inQ && ch in counts) counts[ch]++;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  function parseCSV(text, delim) {
    const rows = [];
    let row = [], field = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === delim) { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(f => f.trim() !== '')) rows.push(row);
        row = [];
      } else field += ch;
    }
    row.push(field);
    if (row.some(f => f.trim() !== '')) rows.push(row);
    return rows;
  }

  // "1.234,56" | "-12,50" | "12.50" | "+1,234.56" | "€ 12,00"
  function parseAmount(raw) {
    if (raw == null) return NaN;
    let s = String(raw).replace(/[€\s]/g, '').replace(/^\+/, '');
    if (!s) return NaN;
    const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    return parseFloat(s);
  }

  // Geeft "YYYY-MM-DD" terug, of null.
  function parseDate(raw) {
    const s = String(raw || '').trim();
    let m;
    if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return `${m[1]}-${m[2]}-${m[3]}`;
    if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return null;
  }

  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

  // ABN AMRO zet de tegenpartij in de omschrijving.
  function nameFromAbnDescription(desc) {
    const d = String(desc || '');
    let m = d.match(/\/NAME\/([^/]+)/i);
    if (m) return clean(m[1]);
    m = d.match(/Naam:\s*(.+?)(?:\s{2,}|Omschrijving:|Kenmerk:|Machtiging:|IBAN:|$)/i);
    if (m) return clean(m[1]);
    m = d.match(/^(?:BEA|GEA|eCom)[^,]*,\s*(?:[^,]*?(?:Apple Pay|Google Pay|Betaalpas)\s+)?(.+?)(?:,PAS|\s{2,}|$)/i);
    if (m) return clean(m[1]);
    return clean(d).slice(0, 40);
  }

  function headerIndex(headers, ...patterns) {
    for (const p of patterns) {
      const i = headers.findIndex(h => p.test(h));
      if (i !== -1) return i;
    }
    return -1;
  }

  function parseBankFile(text) {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/).find(l => l.trim()) || '';
    const delim = detectDelimiter(firstLine);
    const rows = parseCSV(text, delim);
    if (!rows.length) throw new Error('Het bestand is leeg.');

    const head = rows[0].map(h => clean(h).toLowerCase());
    const out = [];
    let bank = 'Onbekend';

    const push = (date, amount, name, desc) => {
      if (!date || !isFinite(amount) || amount === 0) return;
      out.push({ date, amount: Math.round(amount * 100) / 100, name: clean(name) || clean(desc).slice(0, 40) || 'Onbekend', desc: clean(desc) });
    };

    // ABN AMRO TXT/TAB: geen kopregel, 8 kolommen, datum als YYYYMMDD in kolom 3.
    if (delim === '\t' && /^\d{8}$/.test(clean(rows[0][2])) && rows[0].length >= 8) {
      bank = 'ABN AMRO';
      for (const r of rows) push(parseDate(r[2]), parseAmount(r[6]), nameFromAbnDescription(r[7]), r[7]);
      return { bank, transactions: out };
    }

    const rest = rows.slice(1);

    if (head.includes('af bij') && head.some(h => h.startsWith('bedrag'))) {
      bank = 'ING';
      const iD = headerIndex(head, /^datum/), iN = headerIndex(head, /naam/), iA = headerIndex(head, /^bedrag/),
        iAB = headerIndex(head, /^af bij/), iM = headerIndex(head, /mededelingen/);
      for (const r of rest) {
        const sign = /^af$/i.test(clean(r[iAB])) ? -1 : 1;
        push(parseDate(r[iD]), sign * Math.abs(parseAmount(r[iA])), r[iN], r[iM]);
      }
      return { bank, transactions: out };
    }

    if (head.includes('naam tegenpartij') && head.some(h => h.startsWith('omschrijving-1'))) {
      bank = 'Rabobank';
      const iD = headerIndex(head, /^datum$/), iA = headerIndex(head, /^bedrag$/), iN = head.indexOf('naam tegenpartij');
      const descCols = head.map((h, i) => (/^omschrijving-\d/.test(h) ? i : -1)).filter(i => i >= 0);
      for (const r of rest) push(parseDate(r[iD]), parseAmount(r[iA]), r[iN], descCols.map(i => r[i]).join(' '));
      return { bank, transactions: out };
    }

    if (head.includes('counterparty') && head.includes('amount')) {
      bank = 'bunq';
      const iD = headerIndex(head, /^date$/), iA = head.indexOf('amount'), iN = headerIndex(head, /^name$/), iDe = headerIndex(head, /^description$/);
      for (const r of rest) push(parseDate(r[iD]), parseAmount(r[iA]), r[iN], r[iDe]);
      return { bank, transactions: out };
    }

    // Generiek: zoek zelf de kolommen.
    const iD = headerIndex(head, /^(transactie)?datum$/, /date/, /datum/);
    const iA = headerIndex(head, /^bedrag$/, /amount/, /bedrag/);
    const iN = headerIndex(head, /tegenpartij/, /naam/, /^name$/, /counterparty/, /payee/);
    const iDe = headerIndex(head, /omschrijving/, /mededeling/, /description/, /memo/);
    const iSign = headerIndex(head, /af.?bij/, /debet.?credit/, /^d\/c$/);
    if (iD === -1 || iA === -1) {
      throw new Error('We herkennen dit bestand niet. Exporteer je transacties als CSV via je bank en probeer het opnieuw.');
    }
    bank = 'CSV';
    for (const r of rest) {
      let amount = parseAmount(r[iA]);
      if (iSign !== -1) {
        const s = clean(r[iSign]).toLowerCase();
        if (/^(af|d|debet|debit)$/.test(s)) amount = -Math.abs(amount);
        else if (/^(bij|c|credit)$/.test(s)) amount = Math.abs(amount);
      }
      push(parseDate(r[iD]), amount, iN !== -1 ? r[iN] : '', iDe !== -1 ? r[iDe] : '');
    }
    return { bank, transactions: out };
  }

  global.PotjeParsers = { parseBankFile, parseAmount, parseDate, parseCSV, nameFromAbnDescription };
})(typeof window !== 'undefined' ? window : globalThis);
