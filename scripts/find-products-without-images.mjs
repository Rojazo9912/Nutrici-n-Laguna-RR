import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';

nextEnv.loadEnvConfig(process.cwd());

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function fetchAll(table, selectStr) {
  let all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await db
      .from(table)
      .select(selectStr)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

async function run() {
  console.log('Obteniendo datos de Supabase con paginación...');
  const [brands, products, images] = await Promise.all([
    fetchAll('brands', 'id, name'),
    fetchAll('products', 'id, name, slug, brand_id, regulatory_status, commercial_status, price_regular, price_promo'),
    fetchAll('product_images', 'id, product_id, image_url')
  ]);

  const brandMap = new Map(brands.map(b => [b.id, b.name]));
  const imagesByProduct = new Map();
  for (const img of images) {
    if (!imagesByProduct.has(img.product_id)) {
      imagesByProduct.set(img.product_id, []);
    }
    imagesByProduct.get(img.product_id).push(img.image_url);
  }

  const withoutImages = [];
  const withImages = [];

  for (const p of products) {
    const brandName = brandMap.get(p.brand_id) || 'Desconocida';
    const pImgs = imagesByProduct.get(p.id) || [];
    if (pImgs.length === 0) {
      withoutImages.push({
        ...p,
        brand_name: brandName
      });
    } else {
      withImages.push({
        ...p,
        brand_name: brandName,
        images_count: pImgs.length,
        primary_image: pImgs[0]
      });
    }
  }

  console.log(`\n========================================`);
  console.log(`Total de productos en base de datos: ${products.length}`);
  console.log(`Productos CON imagen: ${withImages.length}`);
  console.log(`Productos SIN imagen: ${withoutImages.length}`);
  console.log(`========================================\n`);

  console.log(`Listado completo de productos sin imagen (${withoutImages.length}):`);
  withoutImages.forEach((p, i) => {
    console.log(`${(i + 1).toString().padStart(2, ' ')}. [${p.id}] [${p.brand_name}] ${p.name} (Status: ${p.regulatory_status}/${p.commercial_status})`);
  });

  await writeFile(
    'outputs/productos_sin_imagen.json',
    JSON.stringify(withoutImages, null, 2),
    'utf8'
  );
  console.log(`\nGuardado en outputs/productos_sin_imagen.json`);
}

run().catch(console.error);
