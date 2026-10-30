import 'server-only';
import { publicDatabase } from '@/lib/supabase/server';
import type { Product, Category, Brand } from '@/types/database.types';

// Explicit public fields: never send internal cost or privileged rows to the browser.
export const PRODUCT_FIELDS = 'id,name,slug,description_short,description_long,brand_id,category_id,is_consumable,price_regular,price_promo,stock_minimum,weight_grams,dimensions_cm,commercial_status,regulatory_status,created_at,updated_at,brand:brands(*),category:categories(*),variants:product_variants(*),images:product_images(*)';

const PAGE_SIZE = 1000;

async function fetchAllActiveProducts(db: ReturnType<typeof publicDatabase>): Promise<Product[]> {
  const allProducts: Product[] = [];
  let page = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await db
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('commercial_status', 'activo')
      .eq('regulatory_status', 'aprobado')
      .order('name')
      .range(from, to);

    if (error) throw new Error('No fue posible cargar el catálogo.');
    const batch = (data ?? []) as unknown as Product[];
    allProducts.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    page += 1;
  }

  return allProducts;
}

export async function getCatalog() {
  const db = publicDatabase();
  const [products, categories, brands] = await Promise.all([
    fetchAllActiveProducts(db),
    db.from('categories').select('*').eq('is_active', true).order('name'),
    db.from('brands').select('*').order('name'),
  ]);
  if (categories.error || brands.error) throw new Error('No fue posible cargar el catálogo.');
  return { products, categories: categories.data as Category[], brands: brands.data as Brand[] };
}
