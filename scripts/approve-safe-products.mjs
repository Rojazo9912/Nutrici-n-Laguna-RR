import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
nextEnv.loadEnvConfig(process.cwd());
const actorIndex = process.argv.indexOf('--actor');
const actor = actorIndex >= 0 ? process.argv[actorIndex + 1] : '1f30c9d8-c36e-4be4-b682-60d3f9d312b6';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const prohibited = /esteroide|sarm|hormona|prohormon|anabol|ciclo|mesoterapia|veterin|primobolan|parabolan|winstrol|sustanon|nandrol|hgh|dhea|anavar|clembu|oxa[- ]?clem|methyldrene|efedra|cocodrene|stimerex|red\s*wasp|trenbol|bolden|testex|testoster|masteron|proviron|deca[- ]?durabolin|sostenon|equipoise|gonadotrop|hcg|tamox|clomifen|oxandrol|prasteron|botox|toxina|inyectable|ampolleta|lipostabil|lipofase|liposin|liposintrol/i;
const start = Number(process.argv[process.argv.indexOf('--start') + 1] || 0);
const limit = Number(process.argv[process.argv.indexOf('--limit') + 1] || 50);
const { data: allData, error } = await db.from('products').select('id,name,description_short,category:categories(name)').eq('regulatory_status','pendiente');
const safeData = (allData || []).filter((product) => !prohibited.test(String(product.name) + ' ' + String(product.description_short || '')));
const data = safeData.slice(start, start + limit);
if (error) throw error;
let approved=0, skipped=0;
for (const product of data || []) {
  const category = Array.isArray(product.category) ? product.category[0]?.name : product.category?.name;
  if (prohibited.test(`${product.name} ${product.description_short || ''} ${category || ''}`)) { skipped++; continue; }
  const result = await db.rpc('review_product', { p_product: product.id, p_actor: actor, p_status: 'aprobado', p_notes: 'Revisión inicial de catálogo: producto sin señales automáticas de restricción.' });
  if (result.error) throw new Error(`${product.name}: ${result.error.message}`);
  approved++;
}
console.log(`Productos aprobados: ${approved}; pendientes para revisión manual: ${skipped}.`);
