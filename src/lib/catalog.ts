import 'server-only';
import { publicDatabase } from '@/lib/supabase/server';
import type { Product, Category, Brand } from '@/types/database.types';

// Explicit public fields: never send internal cost or privileged rows to the browser.
export const PRODUCT_FIELDS = 'id,name,slug,description_short,description_long,brand_id,category_id,is_consumable,price_regular,price_promo,stock_minimum,weight_grams,dimensions_cm,commercial_status,regulatory_status,created_at,updated_at,brand:brands(*),category:categories(*),variants:product_variants(*),images:product_images(*)';

export async function getCatalog() {
  const db = publicDatabase();
  const [products, categories, brands] = await Promise.all([
    db.from('products').select(PRODUCT_FIELDS).eq('commercial_status', 'activo').eq('regulatory_status', 'aprobado').order('name'),
    db.from('categories').select('*').eq('is_active', true).order('name'),
    db.from('brands').select('*').order('name'),
  ]);
  if (products.error || categories.error || brands.error) throw new Error('No fue posible cargar el catálogo.');
  return { products: products.data as unknown as Product[], categories: categories.data as Category[], brands: brands.data as Brand[] };
}
