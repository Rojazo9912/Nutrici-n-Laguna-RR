import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';

nextEnv.loadEnvConfig(process.cwd());

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const productsToUpdate = [
  {
    product_id: 'ae485514-6732-42d9-bd21-9c88cad3c4aa',
    producto: "Isopure 20 Sobres Proteina 0 grasa 0 carbohidratos en varios sabores Nature's Best",
    url: 'https://cdn.shopify.com/s/files/1/0133/8576/0826/products/natures-best-isopure-packets-760007-402188.jpg?v=1741898506',
    source_name: 'Tiger Fitness (distribuidor oficial de Nature\'s Best / Isopure)'
  },
  {
    product_id: '86a6b1a7-42af-481b-b7d8-53c91f99d234',
    producto: 'Lean Body 20 Sobres - Delicioso sabor, Sin maltodextrina, libre de aspartamo. Labrada',
    url: 'https://cdn.shopify.com/s/files/1/0588/1996/9210/products/store_choc-20packmrp.png?v=1652331455',
    source_name: 'Labrada / LeanBody.com (tienda oficial)'
  },
  {
    product_id: '694ea021-cf53-4e36-8319-811b447f6ab9',
    producto: 'Lean Body 42 Sobres - Delicioso sabor chocolate, Sin maltodextrina, libre de aspartamo. Labrada',
    url: 'https://cdn.shopify.com/s/files/1/0588/1996/9210/products/store_choco-42packmrp.png?v=1652332243',
    source_name: 'Labrada / LeanBody.com (tienda oficial)'
  },
  {
    product_id: 'e9624a4a-5c53-4a64-9b3d-933189ba66be',
    producto: 'Best Aminos - Apoya la recuperación, más glutamina e hidratacion sostenida. BPI Sport',
    url: 'https://cdn.shopify.com/s/files/1/0561/9761/1672/files/BESTAMINOS-25SERVS-COTTONCANDY-TS.webp?v=1730184940',
    source_name: 'BPI Sports (tienda oficial)'
  },
  {
    product_id: 'd57fee37-2d4e-4438-a6c9-7f83263301d6',
    producto: 'Platinum L-Carnitine 1500 - Carnitina Bebible para tus Post-Entrenos. Muscle-Tech.',
    url: 'https://cdn.nutrabay.com/wp-content/uploads/2019/06/NB-MUT-1048-01-01-800x800.jpg',
    source_name: 'Nutrabay (distribuidor autorizado MuscleTech)'
  },
  {
    product_id: '5049b446-9f4b-41ac-8b0a-97dc3a3c07c3',
    producto: 'Xenadrine NextGen 60 caps - Quemador de Grasa Súper Efectivo de última generación.',
    url: 'https://nutritiondepot.com.mx/wp-content/uploads/2023/10/xenadrine-next-gen-dual-cap-60-caps.jpeg',
    source_name: 'Nutrition Depot México (distribuidor autorizado Xenadrine)'
  }
];

console.log('=== PASO 1: RESPALDO DE REGISTROS ACTUALES ===');
const backupPath = 'image_backup_watermark.json';
const existingBackup = JSON.parse(await readFile(backupPath, 'utf8'));
const existingBackupIds = new Set(existingBackup.map(item => item.id));

let newBackedUpCount = 0;
for (const item of productsToUpdate) {
  const { data: rows, error } = await db.from('product_images').select('*').eq('product_id', item.product_id);
  if (error) {
    throw new Error(`Error leyendo product_images para ${item.product_id}: ${error.message}`);
  }
  console.log(`Producto ${item.product_id}: ${rows?.length || 0} imágenes actuales encontradas.`);
  for (const row of rows || []) {
    if (!existingBackupIds.has(row.id)) {
      existingBackup.push(row);
      existingBackupIds.add(row.id);
      newBackedUpCount++;
    }
  }
}

await writeFile(backupPath, JSON.stringify(existingBackup, null, 1), 'utf8');
console.log(`Respaldo actualizado. Registros nuevos agregados: ${newBackedUpCount}. Total en respaldo: ${existingBackup.length}`);

console.log('\n=== PASO 2: DESCARGA, STORAGE Y ACTUALIZACIÓN EN DB ===');
const appliedResults = [];

for (const item of productsToUpdate) {
  console.log(`\nProcesando: [${item.product_id}] ${item.producto}`);
  
  // 1. Descargar imagen
  const res = await fetch(item.url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) {
    throw new Error(`Error descargando ${item.url}: HTTP ${res.status}`);
  }
  const contentType = (res.headers.get('content-type') || '').split(';')[0];
  if (!contentType.startsWith('image/')) {
    throw new Error(`Contenido no es imagen: ${contentType}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = contentType === 'image/png' ? '.png' : contentType === 'image/webp' ? '.webp' : '.jpg';
  const storagePath = `${item.product_id}/web-1${ext}`;

  // 2. Subir a Storage
  console.log(`Subiendo a Storage: products/${storagePath} (${buffer.length} bytes, ${contentType})...`);
  const { error: uploadErr } = await db.storage
    .from('products')
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (uploadErr) {
    throw new Error(`Error subiendo a storage ${storagePath}: ${uploadErr.message}`);
  }

  const { data: pubUrlData } = db.storage.from('products').getPublicUrl(storagePath);
  const publicUrl = pubUrlData.publicUrl;
  console.log(`URL pública generada: ${publicUrl}`);

  // 3. Borrar filas anteriores en product_images
  console.log('Borrando filas anteriores de product_images...');
  const { error: delErr } = await db.from('product_images').delete().eq('product_id', item.product_id);
  if (delErr) {
    throw new Error(`Error borrando imágenes anteriores de ${item.product_id}: ${delErr.message}`);
  }

  // 4. Insertar fila única
  console.log('Insertando nueva fila principal...');
  const { error: insertErr } = await db.from('product_images').insert({
    product_id: item.product_id,
    image_url: publicUrl,
    alt_text: item.producto,
    display_order: 1,
    is_primary: true
  });
  if (insertErr) {
    throw new Error(`Error insertando nueva imagen para ${item.product_id}: ${insertErr.message}`);
  }

  appliedResults.push({
    product_id: item.product_id,
    producto: item.producto,
    image_url: publicUrl,
    source_url: item.url,
    source_name: item.source_name
  });
  console.log('-> Actualizado con éxito.');
}

console.log('\n=== PASO 3: VERIFICACIÓN DE URLs Y PRODUCT_IMAGES ===');
for (const item of appliedResults) {
  // Verificar respuesta HTTP de la imagen en Supabase
  const res = await fetch(item.image_url, { signal: AbortSignal.timeout(5000) });
  const type = res.headers.get('content-type') || '';
  console.log(`Verificación HTTP [${item.product_id}]: status=${res.status}, type=${type}`);
  if (!res.ok || !type.startsWith('image/')) {
    throw new Error(`Fallo de verificación en ${item.image_url}`);
  }

  // Verificar filas en DB
  const { data: dbRows, error: checkErr } = await db.from('product_images').select('*').eq('product_id', item.product_id);
  if (checkErr || !dbRows || dbRows.length !== 1 || !dbRows[0].is_primary) {
    throw new Error(`Fallo de verificación en DB para ${item.product_id}: filas=${dbRows?.length}`);
  }
}
console.log('Todas las URLs responden OK y tienen exactamente una imagen is_primary=true.');

console.log('\n=== PASO 4: ACTUALIZAR PENDIENTES_MARCA_AGUA.CSV ===');
const csvText = await readFile('pendientes_marca_agua.csv', 'utf8');
const lines = csvText.split(/\r?\n/);
const header = lines[0];
const remainingLines = [header];
const resolvedIds = new Set(productsToUpdate.map(p => p.product_id));

let removedFromCsvCount = 0;
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  const commaIdx = line.indexOf(',');
  const pid = line.slice(0, commaIdx).trim();
  if (resolvedIds.has(pid)) {
    removedFromCsvCount++;
  } else {
    remainingLines.push(line);
  }
}
await writeFile('pendientes_marca_agua.csv', remainingLines.join('\n') + '\n', 'utf8');
console.log(`pendientes_marca_agua.csv actualizado: ${removedFromCsvCount} productos removidos. Quedan: ${remainingLines.length - 1}`);

console.log('\n=== PASO 5: ACTUALIZAR IMAGE_REVIEW_VERIFICAR.CSV ===');
const reviewCsv = await readFile('image_review_verificar.csv', 'utf8');
const reviewLines = reviewCsv.split(/\r?\n/).filter(Boolean);
for (const res of appliedResults) {
  const newLine = `${res.product_id},"${res.producto.replace(/"/g, '""')}","foto reemplazada limpia","${res.source_url.replace(/"/g, '""')}"`;
  reviewLines.push(newLine);
}
await writeFile('image_review_verificar.csv', reviewLines.join('\n') + '\n', 'utf8');
console.log(`image_review_verificar.csv actualizado con los ${appliedResults.length} cambios.`);

console.log('\nProceso completado exitosamente.');
