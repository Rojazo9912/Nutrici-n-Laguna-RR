import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderOrderEmail, type OrderRow } from '../src/lib/email-template';

const order: OrderRow = {
  order_number: 42, customer_email: 'a@example.com', subtotal: 1299, discount: 0, shipping_cost: 99, total: 1398,
  order_items: [{ product_name: '<img src=x onerror=alert(1)>', variant_name: 'Vainilla', quantity: 2, price_at_purchase: 649.5 }],
  shipments: { carrier: 'DHL', tracking_number: 'ABC123' },
};
test('order emails escape product names and never embed markup from data', () => {
  const { html, text, subject } = renderOrderEmail('paid', order);
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.match(subject, /#42/);
  assert.match(text, /Total: .*1,398/);
});
test('shipping emails include carrier and tracking number; delivery emails do not require them', () => {
  assert.match(renderOrderEmail('shipped', order).text, /DHL.*ABC123/);
  assert.doesNotThrow(() => renderOrderEmail('delivered', { ...order, shipments: null }));
});
import { csvCell } from '../src/lib/csv';
test('CSV cells neutralize spreadsheet formulas and escape quotes', () => {
  assert.equal(csvCell('=HYPERLINK("x")'),`"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('+52 33'),`"'+52 33"`);
  assert.equal(csvCell(null),'""');
  assert.equal(csvCell('a "b"'),'"a ""b"""');
});
