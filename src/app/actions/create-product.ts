'use server';
import { randomUUID } from 'node:crypto';
import { staffUser, serviceDatabase, uploadImage } from '@/lib/supabase/server';
import { UUID } from '@/lib/commerce';

export type CreateProductState = { errors?: Record<string, string>; error?: string; success?: boolean; productId?: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMAGE = 3 * 1024 * 1024;

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

export async function createProduct(_previous: CreateProductState, form: FormData): Promise<CreateProductState> {
  const staff = await staffUser();
  if (!staff || staff.role !== 'admin') return { error: 'No autorizado.' };

  const errors: Record<string, string> = {};
  const name = text(form, 'name'), slug = text(form, 'slug'), sku = text(form, 'sku');
  const short = text(form, 'description_short'), long = text(form, 'description_long'), dimensions = text(form, 'dimensions_cm');
  const brand = text(form, 'brand_id'), category = text(form, 'category_id');
  const price = Number(text(form, 'price_regular')), promoText = text(form, 'price_promo'), promo = promoText === '' ? null : Number(promoText);
  const minimum = Number(text(form, 'stock_minimum') || 5), weight = Number(text(form, 'weight_grams') || 0);
  if (name.length < 2 || name.length > 200) errors.name = 'El nombre es obligatorio (máx. 200 caracteres).';
  if (!SLUG.test(slug) || slug.length > 120) errors.slug = 'Usa minúsculas, números y guiones.';
  if (!/^[A-Za-z0-9._-]{2,64}$/.test(sku)) errors.sku = 'SKU de 2 a 64 caracteres (letras, números, . _ -).';
  if (short.length < 10 || short.length > 500) errors.description_short = 'Entre 10 y 500 caracteres.';
  if (long.length > 10000) errors.description_long = 'Máximo 10,000 caracteres.';
  if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) errors.price_regular = 'Precio mayor a 0.';
  if (promo !== null && (!Number.isFinite(promo) || promo <= 0 || promo > price)) errors.price_promo = 'Debe ser mayor a 0 y no superar el precio regular.';
  if (!Number.isInteger(minimum) || minimum < 0) errors.stock_minimum = 'Entero mayor o igual a 0.';
  if (!Number.isInteger(weight) || weight < 0) errors.weight_grams = 'Entero mayor o igual a 0.';
  if (brand && !UUID.test(brand)) errors.brand_id = 'Marca inválida.';
  if (category && !UUID.test(category)) errors.category_id = 'Categoría inválida.';
  const image = form.get('image');
  const file = image instanceof File && image.size > 0 ? image : null;
  if (file && (!IMAGE_TYPES[file.type] || file.size > MAX_IMAGE)) errors.image = 'Imagen JPG, PNG o WebP de máximo 3 MB.';
  if (Object.keys(errors).length) return { errors };

  const db = serviceDatabase();
  const { data: productId, error } = await db.rpc('create_product', {
    p_actor: staff.id, p_name: name, p_slug: slug, p_description_short: short, p_description_long: long || null,
    p_brand: brand || null, p_category: category || null, p_is_consumable: form.get('is_consumable') === 'on',
    p_price_regular: price, p_price_promo: promo, p_stock_minimum: minimum, p_weight_grams: weight,
    p_dimensions: dimensions || null, p_sku: sku,
  });
  if (error || !productId) {
    return error?.code === '23505' ? { errors: { slug: 'El slug o el SKU ya existen.' } } : { error: 'No fue posible crear el producto.' };
  }

  if (file) {
    const path = `${productId}/${randomUUID()}.${IMAGE_TYPES[file.type]}`;
    const upload = await uploadImage(file, path);
    if (upload.error) return { success: true, productId, error: 'Producto creado, pero la imagen no se pudo subir.' };
    const { error: linkError } = await db.from('product_images').insert({ product_id: productId, image_url: upload.url, alt_text: name, display_order: 1, is_primary: true });
    if (linkError) return { success: true, productId, error: 'Producto creado, pero la imagen no se pudo asociar.' };
  }
  return { success: true, productId };
}
