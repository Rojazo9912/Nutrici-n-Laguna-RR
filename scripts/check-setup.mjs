import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
nextEnv.loadEnvConfig(process.cwd());
const required = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','MERCADOPAGO_ACCESS_TOKEN','MERCADOPAGO_WEBHOOK_SECRET','APP_URL'];
const paymentModeReady = process.env.MERCADOPAGO_MODE === 'test' || process.env.MERCADOPAGO_MODE === 'live';
for (const key of required) console.log(`${key}: ${process.env[key] ? 'configurado' : 'pendiente'}`);
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) process.exit(1);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const [catalog, migration, policy] = await Promise.all([
  db.from('products').select('id', { count: 'exact', head: true }),
  db.rpc('commerce_ready'),
  db.from('site_content').select('content').eq('key','privacidad').maybeSingle(),
]);
console.log(`RESEND_API_KEY/EMAIL_FROM (correos): ${process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? 'configurado' : 'pendiente'}`);
console.log(`Catálogo: ${catalog.error ? 'no disponible' : `${catalog.count} productos`}`);
const [dashboard, bucket] = await Promise.all([db.rpc('admin_dashboard'), db.storage.getBucket('products')]);
console.log(`Migraciones 06-07 (operación administrativa): ${dashboard.error ? 'pendientes' : 'aplicadas'}`);
const restricted = await db.rpc('restricted_product_term', { p_text: 'testosterona' });
const restrictedReady = !restricted.error && !!restricted.data;
console.log(`Bloqueo de productos restringidos (migración 08): ${restrictedReady ? 'aplicado' : 'PENDIENTE — aplícala antes de vender'}`);
console.log(`Bucket de imágenes (migración 04): ${bucket.error ? 'pendiente' : 'listo'}`);
console.log(`Migración 03: ${migration.data === true ? 'aplicada' : 'pendiente'}`);
const privacyReady = !policy.error && !!policy.data?.content?.body?.trim() && !!policy.data.content.version;
console.log(`Aviso de privacidad versionado: ${privacyReady ? 'publicado' : 'pendiente'}`);
const configured = required.every(key => !!process.env[key]) && paymentModeReady && process.env.APP_URL?.startsWith('https://') && migration.data === true && privacyReady && restrictedReady;
console.log(configured ? 'Configuración lista para pruebas con Mercado Pago.' : 'Pagos deshabilitados hasta completar los pendientes.');
process.exitCode = configured ? 0 : 1;
