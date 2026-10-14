import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: prods, error } = await supabase.from('products').select('id, name, commercial_status, regulatory_status, category:categories(name, slug)').eq('regulatory_status', 'pendiente');

console.log(`Total pendientes: ${prods.length}`);
for (const [i, p] of prods.entries()) {
  console.log(`${i + 1}. [${p.category?.name || 'Sin Cat'}] ${p.name}`);
}
