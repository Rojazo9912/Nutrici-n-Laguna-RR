import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Check admin profile
const { data: profiles, error: errProf } = await supabase.from('profiles').select('id, full_name, role');
const adminProfile = profiles?.find(p => p.role === 'admin' || p.role === 'compliance_officer');
console.log('Perfiles encontrados:', profiles?.length || 0);
if (adminProfile) {
  console.log(`Usando admin: ${adminProfile.full_name || 'Admin'} (${adminProfile.id})`);
}

// Fetch all pending products
const { data: pending, error: errPending } = await supabase
  .from('products')
  .select('id, name, commercial_status, regulatory_status')
  .eq('regulatory_status', 'pendiente');

if (errPending) {
  console.error('Error al obtener pendientes:', errPending.message);
  process.exit(1);
}

console.log(`Productos pendientes encontrados: ${pending.length}`);

if (pending.length === 0) {
  console.log('No hay productos pendientes por aprobar.');
  process.exit(0);
}

let approvedCount = 0;
const timestamp = new Date().toISOString();

for (const [i, p] of pending.entries()) {
  const { error: updateErr } = await supabase
    .from('products')
    .update({
      regulatory_status: 'aprobado',
      commercial_status: 'activo',
      updated_at: timestamp,
    })
    .eq('id', p.id);

  if (updateErr) {
    console.error(`[${i + 1}/${pending.length}] Error al actualizar ${p.name}: ${updateErr.message}`);
    continue;
  }

  // Insert history entry in product_regulatory_status
  await supabase.from('product_regulatory_status').insert({
    product_id: p.id,
    status: 'aprobado',
    notes: 'Aprobación autorizada por el responsable del catálogo.',
    reviewed_by: adminProfile?.id || null,
  });

  // Insert audit log if adminProfile exists
  if (adminProfile) {
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminProfile.id,
      action: 'review_product',
      entity_type: 'products',
      entity_id: p.id,
      payload: { status: 'aprobado', notes: 'Aprobación autorizada por el responsable del catálogo.' },
    });
  }

  approvedCount++;
  console.log(`[${i + 1}/${pending.length}] APROBADO: ${p.name}`);
}

console.log(`\n========================================`);
console.log(`PROCESO COMPLETADO: ${approvedCount} de ${pending.length} productos aprobados y activados.`);
console.log(`========================================`);

// Final state verification
const { data: allProds } = await supabase.from('products').select('regulatory_status, commercial_status');
const statusCounts = {};
for (const p of allProds || []) {
  const key = `${p.regulatory_status} / ${p.commercial_status}`;
  statusCounts[key] = (statusCounts[key] || 0) + 1;
}
console.log('\nResumen total de productos en la base de datos:');
console.table(statusCounts);
