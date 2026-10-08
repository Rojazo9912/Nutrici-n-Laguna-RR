import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

nextEnv.loadEnvConfig(process.cwd());
const input = process.argv[process.argv.indexOf('--input') + 1] || 'catalogo_nutricionextrema/productos.csv';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
function rows(text) { const out=[]; let r=[],c='',q=false; for(let i=0;i<text.length;i++){const x=text[i],n=text[i+1]; if(x==='"'&&q&&n==='"'){c+='"';i++;continue} if(x==='"'){q=!q;continue} if(!q&&x===','){r.push(c);c='';continue} if(!q&&(x==='\n'||x==='\r')){if(x==='\r'&&n==='\n')i++;r.push(c);c='';if(r.some(Boolean))out.push(r);r=[];continue} c+=x} if(r.length){r.push(c);out.push(r)} const h=out.shift().map(x=>x.replace(/^\uFEFF/,'')); return out.map(v=>Object.fromEntries(h.map((k,i)=>[k,(v[i]||'').trim()]))); }
const source = rows(await readFile(input,'utf8'));
let repaired=0, skipped=0;
for (const row of source) {
  const sku = `NE-EXT-${row.proid}`;
  const { data: variant } = await db.from('product_variants').select('product_id').eq('sku', sku).maybeSingle();
  if (!variant) continue;
  const { count } = await db.from('product_images').select('id',{count:'exact',head:true}).eq('product_id',variant.product_id);
  if (count) { skipped++; continue; }
  const urls = String(row.imagen_url_original||'').split(';').filter(Boolean);
  for (let i=0;i<urls.length;i++) {
    const response = await fetch(urls[i], { signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image')) continue;
    const type = response.headers.get('content-type').split(';')[0];
    const ext = type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : '.jpg';
    const path = `${variant.product_id}/${i+1}${ext}`;
    const upload = await db.storage.from('products').upload(path, Buffer.from(await response.arrayBuffer()), { contentType:type, upsert:false });
    if (upload.error && !upload.error.message.includes('already exists')) continue;
    const { data: publicUrl } = db.storage.from('products').getPublicUrl(path);
    const linked = await db.from('product_images').insert({product_id:variant.product_id,image_url:publicUrl.publicUrl,alt_text:row.nombre,display_order:i+1,is_primary:i===0});
    if (!linked.error) repaired++;
  }
}
console.log(`Fotos asociadas: ${repaired}; productos que ya tenían foto: ${skipped}.`);
