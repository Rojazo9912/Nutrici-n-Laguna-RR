import { readFile, writeFile } from 'node:fs/promises';

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

const restrictedReasons = [];
const packageItems = [];
const candidateItems = [];

function checkRestricted(name) {
  const lower = name.toLowerCase();

  // 1. Esteroides / anabolicos
  if (
    lower.includes('trembolona') || lower.includes('boldenona') || lower.includes('masteron') ||
    lower.includes('primobolan') || lower.includes('oxymetolona') || lower.includes('oxymetalona') ||
    lower.includes('oximetolona') || lower.includes('oxynadrol') || lower.includes('equipoise') ||
    lower.includes('equi-gan') || lower.includes('proviron') || lower.includes('masterolona') ||
    lower.includes('sten -') || lower.includes('testosterona') || lower.includes('test 250') ||
    lower.includes('trenabull') || lower.includes('trenboplex') || lower.includes('oxy strong') ||
    lower.includes('oxyplex')
  ) {
    return 'Esteroide / anabólico';
  }

  // 2. Medicamentos con receta
  if (
    lower.includes('tamoxifeno') || lower.includes('taxus') || lower.includes('anastrozol') ||
    lower.includes('arimidext') || lower.includes('tadalafil') || lower.includes('tadalaplex') ||
    lower.includes('viagra') || lower.includes('viagrex') || lower.includes('sildenafil') ||
    lower.includes('dapoxetina') || lower.includes('samyr') || lower.includes('legalon') ||
    lower.includes('novatafil') || lower.includes('nova tafil')
  ) {
    return 'Medicamento con receta';
  }

  // 3. Péptidos, IGF y HCG
  if (
    lower.includes('gonadotropina') || lower.includes('gonadotrofina') || lower.includes('gonaforte') ||
    lower.includes('choriomon') || lower.includes('hcg') || lower.includes('igf') ||
    lower.includes('dynalan') || lower.includes('polipéptidos') || lower.includes('polipeptidos')
  ) {
    return 'Péptido / IGF / HCG';
  }

  // 4. Toxina botulínica
  if (lower.includes('botox') || lower.includes('botulínica') || lower.includes('botulinica') || lower.includes('otesaly')) {
    return 'Toxina botulínica';
  }

  // 5. Ampolletas, viales o inyectables de mesoterapia
  // (Mesoestetic Mesohyal/NCTC, Armesso, Mesofrance, IT-Pharma, etc.)
  if (
    lower.includes('mesoestetic') || lower.includes('mesofrance') || lower.includes('mesofrace') ||
    lower.includes('mesofance') || lower.includes('armesso') || lower.includes('it-pharma') ||
    lower.includes('simildiet') || lower.includes('inbiozyme') || lower.includes('dermastabilon') ||
    lower.includes('liposucción sin') || lower.includes('liposuccion sin') ||
    lower.includes('liporeductora') || lower.includes('fostatidilcolina') || lower.includes('fosfatidilcolina') ||
    lower.includes('phosphatidylcholine') || lower.includes('dermaheal') || lower.includes('glúteox') ||
    lower.includes('gluteox') || lower.includes('gluteofirm') || lower.includes('triac') ||
    lower.includes('ampolleta') || lower.includes('amp.') || lower.includes('vial') ||
    lower.includes('inyectable') || lower.includes('lipoplus') || lower.includes('grascontrol') ||
    lower.includes('energy c') || lower.includes('cell therapy') || lower.includes('elixir antiedad') ||
    lower.includes('dmae antiarrugas')
  ) {
    return 'Mesoterapia / ampolleta / vial / inyectable';
  }

  // 6. Tratamientos reductivos SBS / Sib Svelt
  if (
    lower.includes('sbs') || lower.includes('sib svelt') || lower.includes('coffe svelt')
  ) {
    return 'Tratamiento reductivo SBS / Sib Svelt';
  }

  return null;
}

function checkPackage(name) {
  const lower = name.toLowerCase();
  if (
    lower.startsWith('stack ') || lower.includes(' stack') ||
    lower.startsWith('kit ') || lower.includes(' kit ') || lower.startsWith('kit de ') ||
    lower.startsWith('combo ') || lower.includes(' combo') ||
    lower.startsWith('crossfit-pack') || lower.startsWith('esteticdiet pack') ||
    (lower.includes('pack ') && !lower.includes('40 pack') && !lower.includes('pack suplem') && !lower.includes('home pack')) ||
    lower.includes('super pack')
  ) {
    return 'Paquete / stack / kit';
  }
  return null;
}

for (const row of rows) {
  const restricted = checkRestricted(row.producto);
  if (restricted) {
    restrictedReasons.push({ ...row, reason: restricted });
    continue;
  }
  const isPkg = checkPackage(row.producto);
  if (isPkg) {
    packageItems.push({ ...row, reason: isPkg });
    continue;
  }
  candidateItems.push(row);
}

console.log(`Total: ${rows.length}`);
console.log(`Restringidos: ${restrictedReasons.length}`);
console.log(`Paquetes/Stacks: ${packageItems.length}`);
console.log(`Candidatos válidos: ${candidateItems.length}`);

console.log('\n--- CANDIDATOS VÁLIDOS ---');
for (const [i, c] of candidateItems.entries()) {
  console.log(`${i + 1}. [${c.product_id}] ${c.producto}`);
}

await writeFile('outputs/categorization.json', JSON.stringify({
  restricted: restrictedReasons,
  packages: packageItems,
  candidates: candidateItems
}, null, 2), 'utf8');
