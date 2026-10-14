import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

nextEnv.loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const updateExisting = args.includes('--update-existing');

function getArgValue(flag, defaultValue = null) {
  const index = args.indexOf(flag);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : defaultValue;
}

const input = getArgValue('--input', 'catalogo_nutricionextrema/productos.csv');
const actor = getArgValue('--actor', '');
const multiplier = Math.max(0.1, Number(getArgValue('--multiplier', '1.3')) || 1.3);
const concurrency = Math.max(1, Math.min(10, Number(getArgValue('--concurrency', '3')) || 3));

if (args.includes('--help') || (apply && !actor)) {
  console.log(`
Uso: node scripts/import-catalog.mjs [opciones]

Opciones obligatorias para aplicar:
  --actor <admin-uuid>       UUID del usuario administrador/compliance que ejecuta la importación.
  --apply                    Aplica los cambios en Supabase (por defecto es simulación dry-run).

Opciones adicionales:
  --input <path>             Ruta al archivo CSV de productos (por defecto: catalogo_nutricionextrema/productos.csv).
  --multiplier <num>         Factor multiplicador sobre precio de costo/base (por defecto: 1.3).
  --update-existing          Actualiza precios si el producto ya existe en lugar de omitirlo.
  --concurrency <num>        Número de productos procesados en paralelo (1 a 10, por defecto: 3).
  --help                     Muestra esta ayuda.
`);
  process.exit(0);
}

if (apply && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('ERROR: Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno (.env.local).');
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
  if (rows.length === 0) return [];
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

async function fileExists(filePath) {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

// Lista ampliada de sustancias prohibidas o controladas (COFEPRIS y Ley General de Salud)
const prohibited = new RegExp(
  [
    'esteroide', 'sarm', 'hormona', 'prohormon', 'anabol', 'ciclo', 'mesoterapia', 'veterin',
    'primobolan', 'parabolan', 'winstrol', 'sustanon', 'nandrol', 'thiomucase', 'hgh', 'dhea',
    'anavar', 'clembu', 'oxa[- ]?clem', 'methyldrene', 'efedra', 'cocodrene', 'stimerex',
    'red wasp', 'trenbol', 'bolden', 'testex', 'testoster', 'masteron', 'proviron',
    'deca[- ]?durabolin', 'sostenon', 'equipoise', 'gonadotrop', 'hcg', 'tamox', 'clomifen',
    'clomid', 'oxandrol', 'oximetolona', 'oxymetholone', 'prasteron', 'botox', 'toxina',
    'inyectable', 'ampolleta', 'lipostabil', 'lipofase', 'liposin', 'liposintrol', 'sib svelt',
    'sbs', 'melfin', 'orlistat', 'tadalafil', 'sildenafil', 'arimidex', 'anastrozol',
    'letrozol', 'enclomifeno', 'tamoxifeno', 'cardarine', 'rad[- ]?140', 'mk[- ]?677',
    'ibutamoren', 'ligandrol', 'ostarine', 'yk[- ]?11', 'somatropin', 'somatropina',
    'insulina', 'igf', 'stanozolol'
  ].join('|'),
  'i'
);

let rawCsv = '';
try {
  rawCsv = await readFile(input, 'utf8');
} catch (err) {
  console.error(`ERROR: No se pudo leer el archivo de entrada "${input}": ${err.message}`);
  process.exit(1);
}

const allRows = csvRows(rawCsv).filter(row => row.nombre && money(row.precio_normal));
const rows = allRows.filter(row => {
  const content = `${row.nombre || ''} ${row.categoria || ''} ${row.descripcion || ''}`;
  return !prohibited.test(content);
});

const excludedCount = allRows.length - rows.length;
console.log(`Filas leídas: ${allRows.length} | Excluidos por control regulatorio: ${excludedCount}`);

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
  return {
    row,
    slug: value,
    regular: money(row.precio_normal),
    promo: money(row.precio_oferta || row.precio_promocion),
    sku,
  };
});

console.log(`${apply ? 'MODO IMPORTACIÓN REAL' : 'MODO SIMULACIÓN (DRY-RUN)'}: ${products.length} productos procesables.`);
console.log(`Configuración: Multiplicador = x${multiplier} | Concurrencia = ${concurrency} workers`);
console.log('Regulación: Todos los productos se crean en estado borrador con revisión sanitaria pendiente.');

if (!apply) {
  console.log('\nMuestra de los primeros 5 productos a procesar:');
  console.table(
    products.slice(0, 5).map(item => ({
      SKU: item.sku,
      Nombre: item.row.nombre.slice(0, 40),
      PrecioLista: item.regular,
      PrecioPromo: item.promo ?? 'N/A',
      Slug: item.slug,
    }))
  );
  console.log('\n[INFO] Simulación completada sin cambios. Usa --apply --actor <admin-uuid> para aplicar en Supabase.');
  process.exit(0);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

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

const stats = {
  total: products.length,
  created: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  imageWarnings: 0,
  errors: [],
};

async function processProduct(item, index) {
  const prefix = `[${index + 1}/${stats.total}]`;
  try {
    const existing = await db.from('products').select('id, name').eq('slug', item.slug).maybeSingle();
    if (existing.error) throw new Error(`Consulta de existencia falló: ${existing.error.message}`);

    let productId = existing.data?.id;

    if (productId) {
      if (!updateExisting) {
        stats.skipped += 1;
        console.log(`${prefix} SKIP ${item.row.proid}: ya existe ${item.slug}`);
        return;
      }
      // Actualizar precios si se especificó --update-existing
      const { error: updateErr } = await db.from('products')
        .update({
          price_regular: item.regular,
          price_promo: item.promo && item.promo < item.regular ? item.promo : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
      if (updateErr) throw new Error(`Actualización falló: ${updateErr.message}`);
      stats.updated += 1;
      console.log(`${prefix} UPDATED ${item.row.proid}: ${item.row.nombre}`);
    } else {
      const brand = item.row.marca ? await upsertLookup('brands', item.row.marca) : null;
      const category = item.row.categoria ? await upsertLookup('categories', item.row.categoria) : null;

      const { data: newId, error: createErr } = await db.rpc('create_product', {
        p_actor: actor,
        p_name: item.row.nombre,
        p_slug: item.slug,
        p_description_short: `Suplemento ${item.row.nombre}.`,
        p_description_long: item.row.url ? `Producto de referencia: ${item.row.url}` : null,
        p_brand: brand,
        p_category: category,
        p_is_consumable: true,
        p_price_regular: item.regular,
        p_price_promo: item.promo && item.promo < item.regular ? item.promo : null,
        p_stock_minimum: 5,
        p_weight_grams: 0,
        p_dimensions: null,
        p_sku: item.sku,
      });

      if (createErr || !newId) {
        throw new Error(createErr?.message || 'No se recibió ID del producto creado');
      }

      productId = newId;
      stats.created += 1;
      console.log(`${prefix} CREATED ${item.row.proid}: ${item.row.nombre}`);
    }

    // Procesamiento resiliente de imágenes
    const images = String(item.row.imagenes || '').split(';').map(f => f.trim()).filter(Boolean);
    if (images.length > 0) {
      const imageRecords = [];
      for (const [imgIdx, filename] of images.entries()) {
        const filePath = path.resolve(path.dirname(input), 'imagenes', filename);
        const exists = await fileExists(filePath);
        if (!exists) {
          stats.imageWarnings += 1;
          console.warn(`  ↳ WARN: Imagen "${filename}" no encontrada en disco.`);
          continue;
        }

        try {
          const bytes = await readFile(filePath);
          const ext = path.extname(filename).toLowerCase();
          const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          const storagePath = `${productId}/${imgIdx + 1}${ext || '.jpg'}`;

          const { error: uploadErr } = await db.storage.from('products').upload(storagePath, bytes, {
            contentType,
            upsert: true,
          });

          if (uploadErr) {
            stats.imageWarnings += 1;
            console.warn(`  ↳ WARN: Error al subir imagen "${filename}": ${uploadErr.message}`);
            continue;
          }

          const { data: publicUrl } = db.storage.from('products').getPublicUrl(storagePath);
          imageRecords.push({
            product_id: productId,
            image_url: publicUrl.publicUrl,
            alt_text: item.row.nombre,
            display_order: imgIdx + 1,
            is_primary: imgIdx === 0,
          });
        } catch (imgErr) {
          stats.imageWarnings += 1;
          console.warn(`  ↳ WARN: Excepción al procesar imagen "${filename}": ${imgErr.message}`);
        }
      }

      if (imageRecords.length > 0) {
        // Inserción en bloque para eficiencia de red
        const { error: insertImgErr } = await db.from('product_images').insert(imageRecords);
        if (insertImgErr) {
          stats.imageWarnings += 1;
          console.warn(`  ↳ WARN: No se pudieron asociar las imágenes a la BD: ${insertImgErr.message}`);
        }
      }
    }
  } catch (err) {
    stats.failed += 1;
    stats.errors.push({ proid: item.row.proid, nombre: item.row.nombre, error: err.message });
    console.error(`${prefix} ERROR ${item.row.proid}: ${err.message}`);
  }
}

// Pool de concurrencia controlada
let currentIdx = 0;
async function worker() {
  while (currentIdx < products.length) {
    const idx = currentIdx++;
    await processProduct(products[idx], idx);
  }
}

const workers = Array.from({ length: concurrency }, () => worker());
await Promise.all(workers);

console.log('\n=============================================');
console.log('REPORTE FINAL DE IMPORTACIÓN DE CATÁLOGO');
console.log('=============================================');
console.log(`- Total analizados en CSV:     ${allRows.length}`);
console.log(`- Excluidos por regulación:    ${excludedCount}`);
console.log(`- Procesables:                 ${stats.total}`);
console.log(`- Creados exitosamente:        ${stats.created}`);
console.log(`- Actualizados:                ${stats.updated}`);
console.log(`- Omitidos (ya existían):      ${stats.skipped}`);
console.log(`- Fallos de producto:          ${stats.failed}`);
console.log(`- Alertas en imágenes:         ${stats.imageWarnings}`);

if (stats.errors.length > 0) {
  const errorLogPath = path.resolve(process.cwd(), 'import-errors.json');
  await writeFile(errorLogPath, JSON.stringify(stats.errors, null, 2), 'utf8');
  console.log(`\n[!] Se guardó el registro de fallos en: ${errorLogPath}`);
}
