import { before, after, beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';

const db = new PGlite({ extensions: { uuid_ossp } });
const variant = '40000000-0000-0000-0000-000000000001';
const product = '30000000-0000-0000-0000-000000000001';
const user = '90000000-0000-0000-0000-000000000001';
const other = '90000000-0000-0000-0000-000000000002';
const items = (qty = 1) => JSON.stringify([{ variantId: variant, quantity: qty }]);
type Order = { id: string; total: number; subtotal: number; discount: number; status: string };

before(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT,raw_user_meta_data JSONB DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::UUID $$;
    CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql AS $$ SELECT '{}'::JSONB $$;
    GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon,authenticated,service_role;`);
  await db.exec(await readFile('supabase/migrations/00_schema.sql','utf8'));
  await db.exec(`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon,authenticated,service_role;`);
  await db.exec(await readFile('supabase/migrations/01_rls_policies.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/02_seed_data.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/03_secure_commerce.sql','utf8'));
  await db.exec(`UPDATE public.inventory_lots SET expiration_date = CURRENT_DATE + 365;
    INSERT INTO auth.users(id,email) VALUES('${user}','one@example.com'),('${other}','two@example.com');
    INSERT INTO public.site_content(key,content) VALUES('privacidad','{"version":"test-v1","body":"Aviso de prueba local"}');
    INSERT INTO public.coupons(code,discount_type,discount_value,usage_limit) VALUES('TEST10','percentage',10,1);`);
});
beforeEach(async () => { await db.exec('BEGIN'); });
afterEach(async () => { await db.exec('ROLLBACK'); });
after(async () => { await db.close(); });

async function create(key = randomUUID(), qty = 1, coupon = '', hash = 'request') {
  const result = await db.query<{ value: Order }>('SELECT public.create_checkout_order($1,$2,$3,$4,$5::JSONB,$6::JSONB,$7,$8) value',[key,hash,'guest',null,items(qty),JSON.stringify({ fullName:'Test',email:'test@example.com',phone:'5512345678',street:'Test',city:'Test',state:'Test',postalCode:'27000' }),coupon,'test-v1']);
  return result.rows[0].value;
}
async function pay(order: Order, tx = 'payment-1', updated = '2026-09-19T12:00:00Z', amount = order.total, status = 'approved') {
  const result = await db.query<{ value: string }>('SELECT public.apply_verified_payment($1,$2,$3,$4,$5,$6) value',[order.id,tx,status,amount,'MXN',updated]);
  return result.rows[0].value;
}
async function stock() { return (await db.query<{ stock_available: number; stock_reserved: number }>('SELECT stock_available,stock_reserved FROM public.product_variants WHERE id=$1',[variant])).rows[0]; }

test('migrations restrict anonymous access to costs, draft products, carts and privileged RPCs', async () => {
  await db.query(`UPDATE public.products SET regulatory_status='pendiente',commercial_status='borrador' WHERE id=$1`,[product]);
  await db.query(`INSERT INTO public.carts(session_id) VALUES('another-session')`);
  await db.exec('SET LOCAL ROLE anon');
  assert.equal((await db.query('SELECT id FROM public.products WHERE id=$1',[product])).rows.length,0);
  assert.equal((await db.query('SELECT * FROM public.product_images WHERE product_id=$1',[product])).rows.length,0);
  assert.equal((await db.query('SELECT * FROM public.carts')).rows.length,0);
  // A permission error aborts this transaction; test the privilege metadata without executing it.
  assert.equal((await db.query<{ allowed: boolean }>(`SELECT has_column_privilege('anon','public.products','cost_internal','SELECT') allowed`)).rows[0].allowed,false);
  assert.equal((await db.query<{ allowed: boolean }>(`SELECT has_function_privilege('anon','public.expire_orders()','EXECUTE') allowed`)).rows[0].allowed,false);
});
test('customers can change their name but cannot change roles or insert paid orders', async () => {
  await db.query(`SELECT set_config('request.jwt.claim.sub',$1,true)`,[user]);
  await db.exec('SET LOCAL ROLE authenticated');
  await db.query(`UPDATE public.profiles SET full_name='New name' WHERE id=$1`,[user]);
  assert.equal((await db.query('SELECT id FROM public.profiles')).rows.length,1);
  assert.equal((await db.query<{ allowed: boolean }>(`SELECT has_column_privilege('authenticated','public.profiles','role','UPDATE') allowed`)).rows[0].allowed,false);
  assert.equal((await db.query<{ allowed: boolean }>(`SELECT has_table_privilege('authenticated','public.orders','INSERT') allowed`)).rows[0].allowed,false);
});
test('orders reserve stock and allocate live lots; duplicate creation is idempotent', async () => {
  const key = randomUUID();
  const order = await create(key,2);
  assert.equal(order.total,2598);
  assert.deepEqual(await stock(),{ stock_available:45,stock_reserved:2 });
  assert.equal((await create(key,2)).id,order.id);
  assert.deepEqual(await stock(),{ stock_available:45,stock_reserved:2 });
  assert.equal((await db.query<{ qty: number }>('SELECT SUM(quantity)::INT qty FROM public.order_lot_allocations WHERE order_id=$1',[order.id])).rows[0].qty,2);
});
test('approved payments commit inventory once, including redelivery with a newer provider timestamp', async () => {
  const order = await create();
  assert.equal(await pay(order),'paid');
  assert.equal(await pay(order),'duplicate');
  assert.equal(await pay(order,'payment-1','2026-09-19T12:01:00Z'),'duplicate');
  assert.deepEqual(await stock(),{ stock_available:44,stock_reserved:0 });
  assert.equal((await db.query('SELECT id FROM public.inventory_movements')).rows.length,1);
});
test('forged amounts do not commit stock', async () => {
  const order = await create();
  await assert.rejects(pay(order,'payment-1','2026-09-19T12:00:00Z',0.01),/PAYMENT_MISMATCH/);
});
test('overselling fails atomically', async () => {
  await create(randomUUID(),40);
  await assert.rejects(create(randomUUID(),6),/INSUFFICIENT_STOCK/);
});
test('expired lots cannot satisfy an order', async () => {
  await db.query('UPDATE public.inventory_lots SET expiration_date=CURRENT_DATE WHERE variant_id=$1',[variant]);
  await assert.rejects(create(),/INSUFFICIENT_LOTS/);
});
test('coupon use is reserved and released when an unpaid order expires', async () => {
  const order = await create(randomUUID(),1,'TEST10');
  assert.equal(order.discount,129.9);
  assert.equal(order.total,1319.1);
  await db.query(`UPDATE public.orders SET reserved_until=NOW()-INTERVAL '1 minute' WHERE id=$1`,[order.id]);
  await db.exec('SELECT public.expire_orders()');
  assert.deepEqual(await stock(),{ stock_available:45,stock_reserved:0 });
  assert.equal((await db.query<{ uses: number }>(`SELECT times_used uses FROM public.coupons WHERE code='TEST10'`)).rows[0].uses,0);
  assert.equal(await pay(order),'review_required');
  assert.deepEqual(await stock(),{ stock_available:45,stock_reserved:0 });
});
test('a second approved payment for one order is flagged without a second stock deduction', async () => {
  const order = await create();
  await pay(order);
  assert.equal(await pay(order,'payment-2'),'review_required');
  assert.deepEqual(await stock(),{ stock_available:44,stock_reserved:0 });
});
test('an admin review persists product state and audit in one transaction', async () => {
  await db.query(`UPDATE public.profiles SET role='admin' WHERE id=$1`,[user]);
  await db.query(`SELECT public.review_product($1,$2,'rechazado','Documento incompleto')`,[product,user]);
  assert.equal((await db.query<{ status: string }>('SELECT commercial_status status FROM public.products WHERE id=$1',[product])).rows[0].status,'borrador');
  assert.equal((await db.query('SELECT id FROM public.admin_audit_logs')).rows.length,1);
});
test('ordinary clients cannot review products', async () => {
  await assert.rejects(db.query(`SELECT public.review_product($1,$2,'aprobado','Falsa revisión')`,[product,other]),/FORBIDDEN/);
});

test('an idempotency key cannot be reused with different contents', async () => {
  const key = randomUUID();
  const order = await create(key);
  await db.exec('SAVEPOINT invalid_request');
  await assert.rejects(create(key,2,'','different-request'),/IDEMPOTENCY_CONFLICT/);
  await db.exec('ROLLBACK TO SAVEPOINT invalid_request');
  assert.equal((await db.query('SELECT id FROM public.orders')).rows.length,1);
  assert.deepEqual(await stock(),{ stock_available:45,stock_reserved:1 });
  assert.ok(order.id);
});
test('a single-use coupon cannot be reserved by a second order', async () => {
  await create(randomUUID(),1,'TEST10');
  await db.exec('SAVEPOINT second_coupon');
  await assert.rejects(create(randomUUID(),1,'TEST10'),/INVALID_COUPON/);
  await db.exec('ROLLBACK TO SAVEPOINT second_coupon');
  assert.equal((await db.query('SELECT id FROM public.orders')).rows.length,1);
  assert.deepEqual(await stock(),{ stock_available:45,stock_reserved:1 });
});
test('authenticated clients cannot read or modify another customer cart or order', async () => {
  const order = await create();
  await db.query('UPDATE public.orders SET user_id=$1 WHERE id=$2',[other,order.id]);
  await db.query('INSERT INTO public.carts(user_id) VALUES($1)',[other]);
  await db.query(`SELECT set_config('request.jwt.claim.sub',$1,true)`,[user]);
  await db.exec('SET LOCAL ROLE authenticated');
  assert.equal((await db.query('SELECT id FROM public.orders')).rows.length,0);
  assert.equal((await db.query('SELECT id FROM public.carts')).rows.length,0);
  assert.equal((await db.query("UPDATE public.carts SET status='changed' RETURNING id")).rows.length,0);
});
test('out-of-order payment notifications cannot roll back an approval', async () => {
  const order = await create();
  await pay(order,'payment-1','2026-09-19T12:02:00Z');
  assert.equal(await pay(order,'payment-1','2026-09-19T12:01:00Z',order.total,'pending'),'duplicate');
  assert.equal((await db.query<{ status: string }>('SELECT status FROM public.orders WHERE id=$1',[order.id])).rows[0].status,'pagado');
  assert.deepEqual(await stock(),{ stock_available:44,stock_reserved:0 });
});
test('a product withdrawn after reservation holds its payment for review', async () => {
  const order = await create();
  await db.query("UPDATE public.products SET commercial_status='borrador',regulatory_status='rechazado' WHERE id=$1",[product]);
  assert.equal(await pay(order),'review_required');
  assert.deepEqual(await stock(),{ stock_available:45,stock_reserved:1 });
});
