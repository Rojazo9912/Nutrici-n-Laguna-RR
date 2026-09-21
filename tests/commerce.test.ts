import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { availableStock, parseCart, unitPrice, validateCheckout, validateItems } from '../src/lib/commerce';
import { verifyMercadoSignature } from '../src/lib/payment-signature';
import type { Product, ProductVariant } from '../src/types/database.types';

const id = '40000000-0000-0000-0000-000000000001';
test('cart storage rejects corruption and merges duplicate IDs within limits', () => {
  assert.deepEqual(parseCart(null), []);
  assert.deepEqual(parseCart([{ variantId: id, quantity: 60 },{ variantId: id, quantity: 60 },{ variantId: 'bad', quantity: 5 },{ variantId: id, quantity: -2 }]), [{ variantId: id, quantity: 99 }]);
});
test('server rejects duplicate, fractional, excessive, empty and malformed cart lines', () => {
  for (const items of [[],[{ variantId: id, quantity: 0 }],[{ variantId: id, quantity: 1.5 }],[{ variantId: id, quantity: 100 }],[{ variantId: id, quantity: 1 },{ variantId: id, quantity: 2 }],[{ variantId: 'v1', quantity: 1 }]]) assert.throws(() => validateItems(items));
});
test('price override zero is retained and reserved stock cannot be sold', () => {
  const product = { price_regular: 100, price_promo: 80 } as Product;
  const variant = { price_override: 0, stock_available: 5, stock_reserved: 5 } as ProductVariant;
  assert.equal(unitPrice(product,variant),0);
  assert.equal(availableStock(variant),0);
  assert.equal(availableStock(undefined),0);
});
test('checkout requires explicit consent and valid customer fields; ignores client totals', () => {
  const input = { items: [{ variantId: id, quantity: 1 }], coupon: ' abc ', privacyConsent: true, total: 0.01, customer: { fullName: ' Ana ', email: 'ANA@example.com', phone: '5512345678', street: 'Calle 1', city: 'Torreón', state: 'Coahuila', postalCode: '27000' } };
  assert.equal(validateCheckout(input).customer.email,'ana@example.com');
  assert.equal(validateCheckout(input).coupon,'ABC');
  assert.equal('total' in validateCheckout(input),false);
  assert.throws(() => validateCheckout({ ...input, privacyConsent: false }));
  assert.throws(() => validateCheckout({ ...input, customer: { ...input.customer, postalCode: 'x' } }));
});
test('webhook verifies the signed payment ID and rejects forged/replayed signatures', () => {
  const now = 1800000000000;
  const ts = String(now / 1000);
  const secret = 'local-test-secret';
  const hash = createHmac('sha256', secret).update(`id:123;request-id:request-1;ts:${ts};`).digest('hex');
  const signature = `ts=${ts},v1=${hash}`;
  assert.equal(verifyMercadoSignature(signature,'request-1','123',secret,now),true);
  assert.equal(verifyMercadoSignature(signature,'request-1','999',secret,now),false);
  assert.equal(verifyMercadoSignature(signature,'request-2','123',secret,now),false);
  assert.equal(verifyMercadoSignature(signature,'request-1','123',secret,now + 301000),false);
  assert.equal(verifyMercadoSignature('test-sha256-signature','request-1','123',secret,now),false);
  assert.equal(verifyMercadoSignature(`ts=${ts},v1=xx`,'request-1','123',secret,now),false);
  assert.equal(verifyMercadoSignature(null,null,'123',secret,now),false);
});
