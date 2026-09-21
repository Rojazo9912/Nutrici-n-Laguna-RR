import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
nextEnv.loadEnvConfig(process.cwd());
const required = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','MERCADOPAGO_ACCESS_TOKEN','MERCADOPAGO_WEBHOOK_SECRET','APP_URL'];
for (const key of required) console.log(`${key}: ${process.env[key] ? 'configurado' : 'pendiente'}`);
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) process.exit(1);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const [catalog, migration, policy] = await Promise.all([
  db.from('products').select('id', { count: 'exact', head: true }),
  db.rpc('commerce_ready'),
  db.from('site_content').select('content').eq('key','privacidad').maybeSingle(),
]);
console.log(`Catálogo: ${catalog.error ? 'no disponible' : `${catalog.count} productos`}`);
console.log(`Migración 03: ${migration.data === true ? 'aplicada' : 'pendiente'}`);
const privacyReady = !policy.error && !!policy.data?.content?.body?.trim() && !!policy.data.content.version;
console.log(`Aviso de privacidad versionado: ${privacyReady ? 'publicado' : 'pendiente'}`);
const configured = required.every(key => !!process.env[key]) && process.env.APP_URL?.startsWith('https://') && migration.data === true && privacyReady;
console.log(configured ? 'Configuración lista para pruebas con Mercado Pago.' : 'Pagos deshabilitados hasta completar los pendientes.');
process.exitCode = configured ? 0 : 1;
