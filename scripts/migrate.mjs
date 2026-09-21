import nextEnv from '@next/env';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd());
// Applied in order; each file is recorded with its checksum and never re-applied.
const files = [
  'supabase/migrations/03_secure_commerce.sql',
  'supabase/migrations/04_admin_products.sql',
  'supabase/migrations/05_order_fulfillment.sql',
  'supabase/migrations/06_privacy_and_limits.sql',
  'supabase/migrations/07_admin_operations.sql',
];
if (!process.env.DATABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Falta DATABASE_URL o NEXT_PUBLIC_SUPABASE_URL en .env.local. No se aplicaron cambios.');
  process.exit(1);
}
let connection;
let project;
try {
  connection = new URL(process.env.DATABASE_URL);
  project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
} catch {
  console.error('Las variables de conexión no tienen un formato URL válido. No se aplicaron cambios.');
  process.exit(1);
}
const direct = connection.hostname === `db.${project}.supabase.co`;
const pooler = connection.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(connection.username) === `postgres.${project}`;
if (!['postgres:', 'postgresql:'].includes(connection.protocol) || (!direct && !pooler)) {
  console.error('DATABASE_URL no corresponde al proyecto Supabase configurado. No se aplicaron cambios.');
  process.exit(1);
}
// Explicit TLS certificate validation; connection-string flags must not weaken it.
for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) connection.searchParams.delete(key);
const client = new pg.Client({ connectionString: connection.toString(), ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000, query_timeout: 60000 });

const sha = sql => createHash('sha256').update(sql).digest('hex');
async function ensureTracker() {
  await client.query('CREATE TABLE IF NOT EXISTS public.commerce_migrations(name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await client.query('ALTER TABLE public.commerce_migrations ENABLE ROW LEVEL SECURITY');
  await client.query('REVOKE ALL ON public.commerce_migrations FROM PUBLIC, anon, authenticated');
}

// One transaction per file: the migration and its checksum commit atomically.
async function apply(filename) {
  const sql = await readFile(filename, 'utf8');
  const checksum = sha(sql);
  let transaction = false;
  try {
    await client.query('BEGIN'); transaction = true;
    await client.query("SET LOCAL lock_timeout = '15s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query('SELECT pg_advisory_xact_lock(7142026)');
    const tracker = (await client.query("SELECT to_regclass('public.commerce_migrations') AS tracker")).rows[0].tracker;
    const record = tracker ? await client.query('SELECT checksum FROM public.commerce_migrations WHERE name=$1', [filename]) : { rows: [] };
    if (record.rows[0]) {
      if (record.rows[0].checksum !== checksum) throw Object.assign(new Error(`${filename} ya se aplicó con otro contenido. Requiere revisión; no se reaplicó.`), { safe: true });
      await client.query('ROLLBACK'); transaction = false;
      console.log(`${filename}: ya aplicada y verificada.`);
      return;
    }
    if (filename.includes('03_')) {
      const legacy = (await client.query("SELECT to_regprocedure('public.commerce_ready()') AS ready")).rows[0].ready;
      if (legacy) throw Object.assign(new Error('La migración 03 ya existe sin registro de checksum. Requiere revisión; no se reaplicó.'), { safe: true });
    }
    const before = await client.query('SELECT COUNT(*)::INT AS count FROM public.products');
    await client.query(sql.replace(/^BEGIN;$/m, '').replace(/^COMMIT;$/m, ''));
    await ensureTracker();
    await client.query('INSERT INTO public.commerce_migrations(name,checksum) VALUES($1,$2)', [filename, checksum]);
    const after = await client.query('SELECT COUNT(*)::INT AS count FROM public.products');
    if (before.rows[0].count !== after.rows[0].count) throw Object.assign(new Error('El conteo de productos cambió; se revirtió la migración.'), { safe: true });
    await client.query('COMMIT'); transaction = false;
    console.log(`${filename}: aplicada. Productos conservados: ${after.rows[0].count}.`);
  } catch (error) {
    if (transaction) await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

try {
  await client.connect();
  for (const filename of files) await apply(filename);
} catch (error) {
  console.error(error.safe ? error.message : `No fue posible aplicar la migración. Código: ${error.code || 'CONNECTION_ERROR'}. Los cambios de esa migración se revirtieron.`);
  process.exitCode = 1;
} finally { await client.end().catch(() => {}); }
