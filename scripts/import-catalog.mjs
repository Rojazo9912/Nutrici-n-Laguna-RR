import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

nextEnv.loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const inputIndex = process.argv.indexOf('--input');
const actorIndex = process.argv.indexOf('--actor');
const input = inputIndex >= 0 ? process.argv[inputIndex + 1] : 'catalogo_nutricionextrema/productos.csv';
const actor = actorIndex >= 0 ? process.argv[actorIndex + 1] : '';
const multiplier = 1.3;

if (!input || !actor) {
  console.error('Uso: node scripts/import-catalog.mjs --input <productos.csv> --actor <admin-uuid> [--apply]');
  process.exit(1);
}

if (apply && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. No se aplicaron cambios.');
  process.exit(1);
}

function csvRows(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i], next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && char === ',') { row.push(cell); cell = ''; continue; }
    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some(value => value.trim())) rows.push(row);
      row = []; continue;
    }
    cell += char;
  }
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  const headers = rows.shift().map(value => value.replace(/^\uFEFF/, '').trim());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()])));
}

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 110) || 'producto';
}

function money(value) {
  const amount = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * multiplier * 100) / 100 : null;
}

function safeSku(row) {
  return `NE-EXT-${row.proid}`;
}

const prohibited = /esteroide|sarm|hormona|prohormon|anabol|ciclo|mesoterapia|veterin|primobolan|parabolan|winstrol|sustanon|nandrol|thiomucase|hgh|dhea|anavar|clembu|oxa[- ]?clem|methyldrene|efedra|cocodrene|stimerex|red wasp|trenbol|bolden|testex|testoster|masteron|proviron|deca[- ]?durabolin|sostenon|equipoise|gonadotrop|hcg|tamox|clomifen|oxandrol|prasteron|botox|toxina|inyectable|ampolleta|lipostabil|lipofase|liposin|liposintrol/i;
const allRows = csvRows(await readFile(input, 'utf8')).filter(row => row.nombre && money(row.precio_normal));
const rows = allRows.filter(row => !prohibited.test(`${row.nombre} ${row.categoria}`));
console.log(`Excluidos por control regulatorio: ${allRows.length - rows.length}.`);
const seen = new Set();
const seenSkus = new Set();
const products = rows.map(row => {
  let base = slug(row.nombre), value = base, suffix = 2;
  while (seen.has(value)) value = `${base}-${suffix++}`;
  seen.add(value);
  let sku = safeSku(row);
  if (seenSkus.has(sku)) sku = `NE-${row.proid}`;
  while (seenSkus.has(sku)) sku = `${sku}-${row.proid}`.slice(0, 64);
  seenSkus.add(sku);
  return { row, slug: value, regular: money(row.precio_normal), promo: money(row.precio_oferta || row.precio_promocion), sku };
});

console.log(`${apply ? 'Importación' : 'Simulación'}: ${products.length} productos, precios x${multiplier}.`);
console.log('Todos se crean como borrador y con revisión regulatoria pendiente.');
if (!apply) {
  console.log(products.slice(0, 5).map(item => `${item.sku} | ${item.row.nombre} | ${item.regular} | ${item.promo ?? '-'}`).join('\n'));
  console.log('No se modificó Supabase. Usa --apply para ejecutar la carga.');
  process.exit(0);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const cache = { brands: new Map(), categories: new Map() };
async function upsertLookup(kind, name) {
  const map = cache[kind];
  if (map.has(name)) return map.get(name);
  const table = kind === 'brands' ? 'brands' : 'categories';
  const existing = await db.from(table).select('id').eq('name', name).maybeSingle();
  if (existing.error) throw new Error(`${kind} ${name}: ${existing.error.message}`);
  if (existing.data?.id) {
    map.set(name, existing.data.id);
    return existing.data.id;
  }
  const rpc = kind === 'brands' ? 'upsert_brand' : 'upsert_category';
  const payload = kind === 'brands'
    ? { p_actor: actor, p_id: null, p_name: name, p_slug: slug(name), p_description: null }
    : { p_actor: actor, p_id: null, p_name: name, p_slug: slug(name), p_description: null, p_active: true };
  const { data, error } = await db.rpc(rpc, payload);
  if (error) throw new Error(`${kind} ${name}: ${error.message}`);
  map.set(name, data);
  return data;
}

for (const item of products) {
  const existing = await db.from('products').select('id').eq('slug', item.slug).maybeSingle();
  if (existing.error) throw new Error(`${item.row.nombre}: ${existing.error.message}`);
  if (existing.data?.id) {
    console.log(`SKIP ${item.row.proid}: ya existe ${item.slug}`);
    continue;
  }
  const brand = item.row.marca ? await upsertLookup('brands', item.row.marca) : null;
  const category = item.row.categoria ? await upsertLookup('categories', item.row.categoria) : null;
  const { data: productId, error } = await db.rpc('create_product', {
    p_actor: actor, p_name: item.row.nombre, p_slug: item.slug,
    p_description_short: `Suplemento ${item.row.nombre}.`,
    p_description_long: item.row.url ? `Producto de referencia: ${item.row.url}` : null,
    p_brand: brand, p_category: category, p_is_consumable: true,
    p_price_regular: item.regular, p_price_promo: item.promo && item.promo < item.regular ? item.promo : null,
    p_stock_minimum: 5, p_weight_grams: 0, p_dimensions: null, p_sku: item.sku,
  });
  if (error || !productId) throw new Error(`${item.row.nombre}: ${error?.message || 'no se creó el producto'}`);
  const images = String(item.row.imagenes || '').split(';').filter(Boolean);
  for (const [index, filename] of images.entries()) {
    const filePath = path.resolve(path.dirname(input), 'imagenes', filename);
    const bytes = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const storagePath = `${productId}/${index + 1}${ext || '.jpg'}`;
    const upload = await db.storage.from('products').upload(storagePath, bytes, { contentType, upsert: false });
    if (upload.error) throw new Error(`${item.row.nombre}: no se subió ${filename}: ${upload.error.message}`);
    const { data: publicUrl } = db.storage.from('products').getPublicUrl(storagePath);
    const linked = await db.from('product_images').insert({ product_id: productId, image_url: publicUrl.publicUrl, alt_text: item.row.nombre, display_order: index + 1, is_primary: index === 0 });
    if (linked.error) throw new Error(`${item.row.nombre}: no se asoció ${filename}: ${linked.error.message}`);
  }
  console.log(`OK ${item.row.proid}: ${item.row.nombre}`);
}

console.log(`Importación completada: ${products.length} productos borrador.`);
