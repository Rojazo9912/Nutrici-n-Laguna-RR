import { HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';

type Body = Record<string, unknown>;
type Params = Record<string, unknown>;
export type AdminAction = { rpc: string; params: (body: Body, actor: string) => Params };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fail = (message: string): never => { throw new HttpError(400, message); };
const str = (body: Body, key: string, max: number, min = 0) => {
  const value = body[key] === undefined || body[key] === null ? '' : body[key];
  if (typeof value !== 'string') return fail('Datos inválidos.');
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return fail('Datos inválidos.');
  return trimmed;
};
const uuid = (body: Body, key: string, optional = false) => {
  const value = body[key];
  if ((value === undefined || value === null || value === '') && optional) return null;
  return typeof value === 'string' && UUID.test(value) ? value : fail('Identificador inválido.');
};
const int = (body: Body, key: string, min: number, max: number) => {
  const value = Number(body[key]);
  return Number.isInteger(value) && value >= min && value <= max ? value : fail('Cantidad inválida.');
};
const money = (body: Body, key: string, optional = false) => {
  const raw = body[key];
  if ((raw === undefined || raw === null || raw === '') && optional) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value <= 1_000_000 ? value : fail('Importe inválido.');
};
const slug = (body: Body, key: string) => { const value = str(body, key, 120, 1); return SLUG.test(value) ? value : fail('Slug inválido: usa minúsculas, números y guiones.'); };
const date = (body: Body, key: string, optional = false) => {
  const value = body[key];
  if ((value === undefined || value === null || value === '') && optional) return null;
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) ? value : fail('Fecha inválida.');
};

export const ACTIONS: Record<string, AdminAction> = {
  receive_stock: { rpc: 'receive_stock', params: (b, a) => ({ p_actor: a, p_variant: uuid(b, 'variantId'), p_lot: str(b, 'lot', 60) || null, p_expiration: date(b, 'expiration', true), p_qty: int(b, 'quantity', 1, 100000), p_notes: str(b, 'notes', 500) || null }) },
  adjust_stock: { rpc: 'adjust_stock', params: (b, a) => ({ p_actor: a, p_variant: uuid(b, 'variantId'), p_lot: uuid(b, 'lotId', true), p_new_quantity: int(b, 'quantity', 0, 1000000), p_notes: str(b, 'notes', 500, 5) }) },
  upsert_variant: { rpc: 'upsert_variant', params: (b, a) => ({ p_actor: a, p_product: uuid(b, 'productId'), p_id: uuid(b, 'id', true), p_sku: /^[A-Za-z0-9._-]{2,64}$/.test(str(b, 'sku', 64, 2)) ? str(b, 'sku', 64, 2) : fail('SKU inválido.'), p_flavor: str(b, 'flavor', 80) || null, p_size: str(b, 'size', 80) || null, p_presentation: str(b, 'presentation', 80) || null, p_price_override: money(b, 'priceOverride', true), p_barcode: str(b, 'barcode', 64) || null }) },
  upsert_brand: { rpc: 'upsert_brand', params: (b, a) => ({ p_actor: a, p_id: uuid(b, 'id', true), p_name: str(b, 'name', 120, 2), p_slug: slug(b, 'slug'), p_description: str(b, 'description', 1000) || null }) },
  upsert_category: { rpc: 'upsert_category', params: (b, a) => ({ p_actor: a, p_id: uuid(b, 'id', true), p_name: str(b, 'name', 120, 2), p_slug: slug(b, 'slug'), p_description: str(b, 'description', 1000) || null, p_active: b.active !== false }) },
  upsert_coupon: { rpc: 'upsert_coupon', params: (b, a) => ({ p_actor: a, p_id: uuid(b, 'id', true), p_code: str(b, 'code', 32, 3), p_type: b.type === 'fixed' ? 'fixed' : b.type === 'percentage' ? 'percentage' : fail('Tipo de descuento inválido.'), p_value: money(b, 'value'), p_min: b.minPurchase ? money(b, 'minPurchase') : 0, p_limit: b.usageLimit ? int(b, 'usageLimit', 1, 1000000) : null, p_valid_until: b.validUntil ? (date(b, 'validUntil') + 'T23:59:59-06:00') : null, p_active: b.active !== false }) },
  save_site_content: { rpc: 'save_site_content', params: (b, a) => ({ p_actor: a, p_key: str(b, 'key', 40, 1), p_version: str(b, 'version', 80, 1), p_body: str(b, 'body', 100000, 1) }) },
};

const DATABASE_MESSAGES: [string, number, string][] = [
  ['FORBIDDEN', 403, 'No autorizado.'], ['LOT_REQUIRED', 400, 'Los productos consumibles requieren lote y una fecha de caducidad futura.'],
  ['BELOW_RESERVED', 409, 'La cantidad no puede quedar por debajo de lo reservado por pedidos.'], ['NOTES_REQUIRED', 400, 'Indica el motivo del ajuste.'],
  ['VARIANT_NOT_FOUND', 404, 'Variante no encontrada.'], ['LOT_NOT_FOUND', 404, 'Lote no encontrado.'], ['PRODUCT_NOT_FOUND', 404, 'Producto no encontrado.'], ['NOT_FOUND', 404, 'Registro no encontrado.'],
  ['PROHIBITED_CATEGORY', 400, 'Esa categoría no está permitida en este catálogo.'], ['VERSION_REQUIRED', 409, 'Cambia el número de versión al modificar el texto.'],
  ['INVALID_', 400, 'Datos inválidos.'],
];
export function adminDatabaseError(error: { message: string; code?: string }) {
  if (error.code === '23505') return new HttpError(409, 'Ya existe un registro con ese código, slug o SKU.');
  if (error.code === '23514') return new HttpError(400, 'Los datos no cumplen las reglas del catálogo.');
  const known = DATABASE_MESSAGES.find(([key]) => error.message.includes(key));
  return known ? new HttpError(known[1], known[2]) : new HttpError(503, 'No fue posible completar la operación.');
}
