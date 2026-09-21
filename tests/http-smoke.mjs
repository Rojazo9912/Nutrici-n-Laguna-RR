// Read-only checks against a running local app; never creates payments or users.
import { test } from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.SMOKE_URL || 'http://127.0.0.1:3100';
const request = (path, options = {}) => fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
test('catalog loads approved products without internal cost', async () => {
  const response = await request('/api/catalog');
  assert.equal(response.status, 200, 'Supabase catalog must be reachable');
  const catalog = await response.json();
  assert.ok(Array.isArray(catalog.products) && catalog.products.length > 0);
  assert.ok(catalog.products.every(product => product.commercial_status === 'activo' && product.regulatory_status === 'aprobado' && !('cost_internal' in product)));
});
test('admin page redirects anonymous visitors to account', async () => {
  const response = await request('/admin/productos', { redirect: 'manual' });
  assert.ok([307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get('location'), base).pathname, '/cuenta');
});
test('unknown product slugs return 404', async () => {
  const response = await request('/productos/producto-inexistente-smoke');
  assert.equal(response.status, 404, 'Requires an available catalog to distinguish missing products from database outages');
});
test('forged webhook never reports successful payment', async () => {
  const response = await request('/api/webhooks/pago?data.id=123', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-signature': 'test-sha256-signature' }, body: JSON.stringify({ status: 'approved' }) });
  assert.ok([401, 503].includes(response.status));
});
test('private orders are not exposed to an anonymous visitor', async () => {
  const response = await request('/api/orders/00000000-0000-0000-0000-000000000000');
  assert.equal(response.status, 404);
});
test('cross-origin order creation is denied', async () => {
  const response = await request('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' }, body: '{}' });
  assert.equal(response.status, 403);
});
test('anonymous admin writes are denied', async () => {
  const response = await request('/api/admin/products/30000000-0000-0000-0000-000000000001', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ status: 'aprobado', notes: 'Unauthorized' }) });
  assert.equal(response.status, 403);
});
test('cron requires its secret', async () => {
  const response = await request('/api/cron/expire-orders', { method: 'POST' });
  assert.equal(response.status, 401);
});
