import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsappCatalog } from '../src/lib/whatsapp-catalog';
import type { Product } from '../src/types/database.types';

const host = 'abc.supabase.co';
const own = `https://${host}/storage/v1/object/public/products/whey.png`;
const make = (over: Partial<Product> = {}, variant: Record<string, unknown> = {}): Product => ({
  id: 'p1', name: 'Gold Standard 100% Whey', slug: 'gold-whey', description_short: 'Proteína de suero', description_long: null,
  brand_id: 'b1', category_id: 'c1', is_consumable: true, price_regular: 1299, price_promo: 1099, stock_minimum: 5, weight_grams: 0,
  dimensions_cm: null, commercial_status: 'activo', regulatory_status: 'aprobado', created_at: '', updated_at: '',
  brand: { id: 'b1', name: 'Optimum Nutrition' } as Product['brand'],
  category: { id: 'c1', name: 'Proteínas' } as Product['category'],
  images: [{ id: 'i1', product_id: 'p1', image_url: own, display_order: 0, is_primary: true, created_at: '' }],
  variants: [{ id: 'v1', product_id: 'p1', sku: 'ON-WHEY-5LB-CHOC', flavor: 'Chocolate', size: '5 lb', stock_available: 3, stock_reserved: 0, created_at: '', ...variant }],
  ...over,
});
const build = (products: Product[]) => buildWhatsappCatalog(products, { baseUrl: 'https://tienda.mx/', storageHost: host });

test('an approved product with brand and own image becomes one row per variant in Meta format', () => {
  const { rows, excluded } = build([make()]);
  assert.equal(excluded.length, 0);
  assert.deepEqual(rows[0], {
    id: 'ON-WHEY-5LB-CHOC', item_group_id: 'gold-whey', title: 'Gold Standard 100% Whey - Chocolate · 5 lb', description: 'Proteína de suero',
    availability: 'in stock', condition: 'new', price: '1299.00 MXN', sale_price: '1099.00 MXN',
    link: 'https://tienda.mx/productos/gold-whey', image_link: own, brand: 'Optimum Nutrition',
  });
  assert.equal(build([make({}, { stock_reserved: 3 })]).rows[0].availability, 'out of stock');
});

test('risky, unbranded, unapproved or third-party-image products are excluded with a reason', () => {
  const cases: [Partial<Product>, RegExp][] = [
    [{ name: 'Lipo-6 Black Ultraconcentrado' }, /peso/],
    [{ name: 'Quemador Thermo X', description_short: 'Termogénico' }, /peso/],
    [{ name: 'SBS Man', description_short: 'Tratamiento para la disfunción sexual masculina' }, /sexual/],
    [{ name: 'DHEA 50 mg' }, /inseguro/],
    [{ brand: { id: 'b', name: 'Desconocida' } as Product['brand'] }, /marca/],
    [{ regulatory_status: 'pendiente', commercial_status: 'borrador' }, /aprobado/],
    [{ images: [{ id: 'i', product_id: 'p1', image_url: 'https://shop.bodybuilding.com/x.png', display_order: 0, is_primary: true, created_at: '' }] }, /imagen propia/],
    [{ images: [] }, /imagen propia/],
  ];
  for (const [over, reason] of cases) {
    const { rows, excluded } = build([make(over)]);
    assert.equal(rows.length, 0, JSON.stringify(over));
    assert.match(excluded[0].motivo, reason);
  }
});
