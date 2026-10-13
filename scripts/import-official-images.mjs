import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

nextEnv.loadEnvConfig(process.cwd());
const input = process.argv[process.argv.indexOf('--input') + 1] || 'official_images.csv';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
function rows(text) { const out=[]; let r=[],c='',q=false; for(let i=0;i<text.length;i++){const x=text[i],n=text[i+1]; if(x==='"'&&q&&n==='"'){c+='"';i++;continue} if(x==='"'){q=!q;continue} if(!q&&x===','){r.push(c);c='';continue} if(!q&&(x==='\n'||x==='\r')){if(x==='\r'&&n==='\n')i++;r.push(c);c='';if(r.some(Boolean))out.push(r);r=[];continue} c+=x} if(r.length){r.push(c);out.push(r)} const h=out.shift().map(x=>x.replace(/^\uFEFF/,'')); return out.map(v=>Object.fromEntries(h.map((k,i)=>[k,(v[i]||'').trim()]))); }
const source = rows(await readFile(input,'utf8'));
let uploaded=0, skipped=0, unavailable=0;
for (const row of source) {
  const { data: variant } = await db.from('product_variants').select('product_id').eq('sku', `NE-EXT-${row.proid}`).maybeSingle();
  if (!variant) { unavailable++; continue; }
  const { count } = await db.from('product_images').select('id',{count:'exact',head:true}).eq('product_id',variant.product_id);
  if (count) { skipped++; continue; }
  try {
    const response = await fetch(row.url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    const type = (response.headers.get('content-type') || '').split(';')[0];
    if (!response.ok || !type.startsWith('image/')) { unavailable++; continue; }
    const ext = type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : '.jpg';
    const path = `${variant.product_id}/official-1${ext}`;
    const upload = await db.storage.from('products').upload(path, Buffer.from(await response.arrayBuffer()), { contentType:type, upsert:true });
    if (upload.error) { unavailable++; continue; }
    const { data: publicUrl } = db.storage.from('products').getPublicUrl(path);
    const linked = await db.from('product_images').insert({product_id:variant.product_id,image_url:publicUrl.publicUrl,alt_text:row.name,display_order:1,is_primary:true});
    if (linked.error) unavailable++; else uploaded++;
  } catch { unavailable++; }
}
console.log(`Fotos oficiales asociadas: ${uploaded}; ya tenían foto: ${skipped}; no disponibles: ${unavailable}.`);
