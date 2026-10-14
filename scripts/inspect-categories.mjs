import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: cats, error: errCats } = await supabase.from('categories').select('id, name, slug, is_active').order('name');
if (errCats) {
  console.error('Error fetching categories:', errCats);
  process.exit(1);
}

const { data: prods, error: errProds } = await supabase.from('products').select('id, name, category_id, commercial_status, regulatory_status');
if (errProds) {
  console.error('Error fetching products:', errProds);
  process.exit(1);
}

console.log(`Total categorias en DB: ${cats.length}`);
console.log(`Total productos en DB: ${prods.length}`);

const approvedProds = prods.filter(p => p.commercial_status === 'activo' && p.regulatory_status === 'aprobado');
console.log(`Productos activos y aprobados: ${approvedProds.length}`);

const counts = {};
const approvedCounts = {};
for (const p of prods) {
  counts[p.category_id] = (counts[p.category_id] || 0) + 1;
}
for (const p of approvedProds) {
  approvedCounts[p.category_id] = (approvedCounts[p.category_id] || 0) + 1;
}

const list = cats.map(c => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  totalProds: counts[c.id] || 0,
  approvedProds: approvedCounts[c.id] || 0
}));

console.log('\n--- CATEGORIAS CON PRODUCTOS ACTIVOS Y APROBADOS ---');
for (const c of list.filter(c => c.approvedProds > 0)) {
  console.log(`${c.approvedProds} prods | ${c.name} (${c.slug})`);
}

console.log('\n--- CATEGORIAS SIN PRODUCTOS APROBADOS (o con 0 prods) ---');
for (const c of list.filter(c => c.approvedProds === 0)) {
  console.log(`${c.totalProds} total / 0 aprobados | ${c.name} (${c.slug})`);
}
