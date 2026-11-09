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
  await db.exec(await readFile('supabase/migrations/05_order_fulfillment.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/06_privacy_and_limits.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/07_admin_operations.sql','utf8'));
  await db.exec(await readFile('supabase/migrations/08_restricted_products.sql','utf8'));
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
test('controlled, prescription and injectable products cannot be approved or activated by any path', async () => {
  await db.query(`UPDATE public.profiles SET role='admin' WHERE id=$1`,[user]);
  for (const name of ['TEST 350 Combinación de Testosteronas','Nolvedext Tamoxifeno 20 mg','HalopleX Fluoxymesterone','Procaína 10 ampolletas inyectables','Rosa Mosqueta 10 amp de 1ml','Clenbutrex 60 tabs','Ácido Hialurónico - 1 Vial de 10ml','Sib Svelt Tratamiento Reductivo','Lipodrene Hardcore 90 tabs']) {
    await db.query(`UPDATE public.products SET name=$2,commercial_status='borrador',regulatory_status='pendiente' WHERE id=$1`,[product,name]);
    await db.exec('SAVEPOINT s');
    await assert.rejects(db.query(`SELECT public.review_product($1,$2,'aprobado','Revisión de prueba')`,[product,user]),/RESTRICTED_PRODUCT/,name);
    await db.exec('ROLLBACK TO SAVEPOINT s');
    await assert.rejects(db.query(`UPDATE public.products SET regulatory_status='aprobado',commercial_status='activo' WHERE id=$1`,[product]),/RESTRICTED_PRODUCT/,name);
    await db.exec('ROLLBACK TO SAVEPOINT s');
  }
  // Rejecting or hiding a restricted product stays possible.
  await db.query(`SELECT public.review_product($1,$2,'rechazado','Sustancia controlada')`,[product,user]);
  // Ordinary supplements are not affected.
  for (const name of ['Gold Standard 100% Whey 5lb','Creatina monohidratada 500 g','Testrol Elite','Amino Build Next Gen','Colágeno hidrolizado con péptidos','Champ BCAA']) {
    assert.equal((await db.query<{ t: string | null }>('SELECT public.restricted_product_term($1) t',[name])).rows[0].t,null,name);
  }
});
test('migration 08 withdraws restricted products that were already published', async () => {
  const sql = await readFile('supabase/migrations/08_restricted_products.sql','utf8');
  await db.query(`ALTER TABLE public.products DISABLE TRIGGER products_block_restricted`);
  await db.query(`UPDATE public.products SET name='Arimidex 1 mg',regulatory_status='aprobado',commercial_status='activo' WHERE id=$1`,[product]);
  await db.query(`ALTER TABLE public.products ENABLE TRIGGER products_block_restricted`);
  await db.exec(sql.replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
  const row = (await db.query<{ r: string; c: string }>('SELECT regulatory_status r,commercial_status c FROM public.products WHERE id=$1',[product])).rows[0];
  assert.deepEqual(row,{ r:'rechazado',c:'oculto' });
  assert.match((await db.query<{ notes: string }>('SELECT notes FROM public.product_regulatory_status WHERE product_id=$1',[product])).rows[0].notes,/arimidex/);
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
test('admins fulfil paid orders in sequence, with tracking and audit; clients and skips are rejected', async () => {
  const order = await create();
  await db.query("UPDATE public.profiles SET role='admin' WHERE id=$1",[user]);
  const advance = async (status: string, actor = user, carrier: string | null = null, tracking: string | null = null) => {
    await db.exec('SAVEPOINT step');
    try { await db.query('SELECT public.advance_order($1,$2,$3,$4,$5)',[order.id,actor,status,carrier,tracking]); await db.exec('RELEASE SAVEPOINT step'); }
    catch (error) { await db.exec('ROLLBACK TO SAVEPOINT step'); throw error; }
  };
  await assert.rejects(advance('preparando'),/INVALID_TRANSITION/);
  await pay(order);
  await assert.rejects(advance('preparando',other),/FORBIDDEN/);
  await assert.rejects(advance('enviado'),/INVALID_TRANSITION/);
  await advance('preparando');
  await assert.rejects(advance('enviado'),/TRACKING_REQUIRED/);
  await advance('enviado',user,'DHL','1234567890');
  await advance('entregado');
  assert.equal((await db.query<{ status: string }>('SELECT status FROM public.orders WHERE id=$1',[order.id])).rows[0].status,'entregado');
  assert.deepEqual((await db.query('SELECT carrier,tracking_number,status FROM public.shipments WHERE order_id=$1',[order.id])).rows,[{ carrier:'DHL',tracking_number:'1234567890',status:'entregado' }]);
  assert.equal((await db.query("SELECT id FROM public.admin_audit_logs WHERE action='advance_order'")).rows.length,3);
});
test('orders held for payment review cannot be fulfilled', async () => {
  const order = await create();
  await pay(order); await pay(order,'payment-2');
  await db.query("UPDATE public.profiles SET role='admin' WHERE id=$1",[user]);
  await assert.rejects(db.query("SELECT public.advance_order($1,$2,'preparando',NULL,NULL)",[order.id,user]),/PAYMENT_REVIEW/);
});
test('rate limit allows the configured hits per window, then blocks, then resets', async () => {
  const hit = async () => (await db.query<{ ok: boolean }>("SELECT public.hit_rate_limit('k1',3,INTERVAL '1 hour') ok")).rows[0].ok;
  assert.deepEqual([await hit(),await hit(),await hit(),await hit()],[true,true,true,false]);
  await db.query("UPDATE public.rate_limits SET window_start = NOW() - INTERVAL '2 hours' WHERE key='k1'");
  assert.equal(await hit(),true);
  assert.equal((await db.query<{ ok: boolean }>("SELECT public.hit_rate_limit('k2',1,INTERVAL '1 hour') ok")).rows[0].ok,true);
});
test('consent history keeps every change and the latest row is the current state', async () => {
  await db.query("SELECT public.set_consent($1,'marketing',TRUE,'v1')",[user]);
  await db.query("SELECT public.set_consent($1,'marketing',FALSE,'v1')",[user]);
  const rows = (await db.query<{ is_granted: boolean; revoked_at: string | null }>("SELECT is_granted,revoked_at FROM public.privacy_consents WHERE user_id=$1 ORDER BY granted_at,id",[user])).rows;
  assert.equal(rows.length,2);
  assert.equal(rows[0].is_granted,true);
  assert.equal(rows[1].is_granted,false);
  assert.ok(rows[1].revoked_at);
  await assert.rejects(db.query("SELECT public.set_consent($1,'datos_sensibles',TRUE,'v1')",[user]),/INVALID_CONSENT/);
});
test('ARCO requests are private to staff and resolving one needs notes and leaves an audit trail', async () => {
  await db.query("INSERT INTO public.arco_requests(requester_name,requester_email,request_type,details) VALUES('Ana','ana@example.com','acceso','Quiero conocer mis datos')");
  const id = (await db.query<{ id: string }>('SELECT id FROM public.arco_requests')).rows[0].id;
  await db.query("UPDATE public.profiles SET role='admin' WHERE id=$1",[user]);
  await db.exec('SAVEPOINT a');
  await assert.rejects(db.query("SELECT public.update_arco_request($1,$2,'resuelta','')",[id,user]),/NOTES_REQUIRED/);
  await db.exec('ROLLBACK TO SAVEPOINT a');
  await db.exec('SAVEPOINT b');
  await assert.rejects(db.query("SELECT public.update_arco_request($1,$2,'resuelta','Entregado el reporte')",[id,other]),/FORBIDDEN/);
  await db.exec('ROLLBACK TO SAVEPOINT b');
  await db.query("SELECT public.update_arco_request($1,$2,'resuelta','Se envió la información al titular')",[id,user]);
  assert.equal((await db.query<{ status: string }>('SELECT status FROM public.arco_requests WHERE id=$1',[id])).rows[0].status,'resuelta');
  assert.equal((await db.query("SELECT id FROM public.admin_audit_logs WHERE action='update_arco_request'")).rows.length,1);
  assert.equal((await db.query<{ a: boolean; b: boolean }>("SELECT has_table_privilege('anon','public.arco_requests','SELECT') a,has_table_privilege('authenticated','public.arco_requests','SELECT') b")).rows[0].a,false);
});
async function rejects(sql: string, params: unknown[], pattern: RegExp) {
  await db.exec('SAVEPOINT guard');
  try { await assert.rejects(db.query(sql,params),pattern); } finally { await db.exec('ROLLBACK TO SAVEPOINT guard'); }
}
const asAdmin = () => db.query("UPDATE public.profiles SET role='admin' WHERE id=$1",[user]);

test('receiving stock requires lot and future expiry for consumables, and keeps stock, lots and movements consistent', async () => {
  await asAdmin();
  const before = await stock();
  await rejects("SELECT public.receive_stock($1,$2,NULL,NULL,5,'x')",[user,variant],/LOT_REQUIRED/);
  await rejects("SELECT public.receive_stock($1,$2,'L1',CURRENT_DATE,5,'x')",[user,variant],/LOT_REQUIRED/);
  await rejects("SELECT public.receive_stock($1,$2,'L1',CURRENT_DATE+90,5,'x')",[other,variant],/FORBIDDEN/);
  await db.query("SELECT public.receive_stock($1,$2,'NEW-LOT',CURRENT_DATE+90,10,'compra')",[user,variant]);
  await db.query("SELECT public.receive_stock($1,$2,'NEW-LOT',CURRENT_DATE+90,5,'compra')",[user,variant]);
  assert.equal((await stock()).stock_available,before.stock_available + 15);
  assert.equal((await db.query<{ q: number }>("SELECT quantity q FROM public.inventory_lots WHERE lot_number='NEW-LOT'")).rows[0].q,15);
  assert.equal((await db.query("SELECT id FROM public.inventory_movements WHERE movement_type='entrada'")).rows.length,2);
});
test('stock adjustments need a reason, cannot go below reservations, and are audited', async () => {
  await asAdmin();
  await create(randomUUID(),3);
  const lot = (await db.query<{ id: string }>('SELECT id FROM public.inventory_lots WHERE variant_id=$1 AND reserved_quantity>0',[variant])).rows[0].id;
  await rejects("SELECT public.adjust_stock($1,$2,$3,10,'')",[user,variant,lot],/NOTES_REQUIRED/);
  await rejects("SELECT public.adjust_stock($1,$2,$3,2,'conteo fisico')",[user,variant,lot],/BELOW_RESERVED/);
  await rejects("SELECT public.adjust_stock($1,$2,NULL,10,'conteo fisico')",[user,variant],/LOT_REQUIRED/);
  await db.query("SELECT public.adjust_stock($1,$2,$3,50,'conteo fisico')",[user,variant,lot]);
  assert.equal((await db.query("SELECT id FROM public.admin_audit_logs WHERE action='adjust_stock'")).rows.length,1);
});
test('catalog operations reject prohibited categories, invalid coupons and unchanged legal versions', async () => {
  await asAdmin();
  await rejects("SELECT public.upsert_category($1,NULL,'SARMs','sarms','x',TRUE)",[user],/PROHIBITED_CATEGORY|check_prohibited/);
  await rejects("SELECT public.upsert_category($1,NULL,'Vitaminas','vit-hormona-de-crecimiento','x',TRUE)",[user],/PROHIBITED_CATEGORY/);
  await db.query("SELECT public.upsert_category($1,NULL,'Vitaminas','vitaminas','Bienestar',TRUE)",[user]);
  await rejects("SELECT public.upsert_coupon($1,NULL,'BIG','percentage',150,0,NULL,NULL,TRUE)",[user],/INVALID_VALUE/);
  await rejects("SELECT public.upsert_coupon($1,NULL,'ab','fixed',10,0,NULL,NULL,TRUE)",[user],/INVALID_CODE/);
  await db.query("SELECT public.upsert_coupon($1,NULL,'ok-10','fixed',10,0,5,NULL,TRUE)",[user]);
  assert.equal((await db.query("SELECT code FROM public.coupons WHERE code='OK-10'")).rows.length,1);
  await rejects("SELECT public.save_site_content($1,'privacidad','test-v1','Otro texto')",[user],/VERSION_REQUIRED/);
  await rejects("SELECT public.save_site_content($1,'secreto','v1','x')",[user],/INVALID_KEY/);
  await db.query("SELECT public.save_site_content($1,'faq','2026-09-21','Preguntas frecuentes')",[user]);
  await db.query("SELECT public.save_site_content($1,'privacidad','test-v2','Otro texto')",[user]);
  assert.equal((await db.query<{ v: string }>("SELECT content->>'version' v FROM public.site_content WHERE key='privacidad'")).rows[0].v,'test-v2');
});
test('the dashboard summarizes sales, statuses and stock alerts', async () => {
  const order = await create(); await pay(order);
  await db.query('UPDATE public.product_variants SET stock_available=1,stock_reserved=0 WHERE id=$1',[variant]);
  const summary = (await db.query<{ d: { sales_30d: number; orders_30d: number; by_status: Record<string, number>; low_stock: unknown[]; top_products: unknown[] } }>('SELECT public.admin_dashboard() d')).rows[0].d;
  assert.equal(Number(summary.sales_30d),order.total);
  assert.equal(Number(summary.orders_30d),1);
  assert.equal(summary.by_status.pagado,1);
  assert.ok(summary.low_stock.length >= 1);
  assert.equal(summary.top_products.length,1);
});
