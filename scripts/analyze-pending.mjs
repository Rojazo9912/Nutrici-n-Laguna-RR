import { readFile } from 'node:fs/promises';

function parseCSV(text) {
  const out = [];
  let r = [], c = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const x = text[i], n = text[i + 1];
    if (x === '"' && q && n === '"') { c += '"'; i++; continue; }
    if (x === '"') { q = !q; continue; }
    if (!q && x === ',') { r.push(c); c = ''; continue; }
    if (!q && (x === '\n' || x === '\r')) {
      if (x === '\r' && n === '\n') i++;
      r.push(c); c = '';
      if (r.some(Boolean)) out.push(r);
      r = [];
      continue;
    }
    c += x;
  }
  if (r.length) { r.push(c); out.push(r); }
  const h = out.shift().map(x => x.replace(/^\uFEFF/, '').trim());
  return out.map(v => Object.fromEntries(h.map((k, i) => [k, (v[i] || '').trim()])));
}

const csvText = await readFile('pendientes_marca_agua.csv', 'utf8');
const rows = parseCSV(csvText);

console.log('Total pendientes:', rows.length);
for (const [i, row] of rows.entries()) {
  console.log(`${i + 1}. [${row.product_id}] ${row.producto}`);
}
