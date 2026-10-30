import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';

nextEnv.loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const doUpload = args.includes('--upload');
const isWatermarks = args.includes('--watermarks');
const limit = Number(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100');

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function cleanSearchTerm(name, brandName) {
  let raw = String(name || '');
  // Extract brand from trailing ". Brand" if brandName is Desconocida
  let inferredBrand = brandName && brandName !== 'Desconocida' ? brandName : '';
  if (!inferredBrand) {
    const dotParts = raw.split(/\.\s+/);
    if (dotParts.length > 1) {
      const lastPart = dotParts[dotParts.length - 1].replace(/\.$/, '').trim();
      if (lastPart.length >= 3 && lastPart.length <= 30) inferredBrand = lastPart;
    }
  }

  // Take only the core product name before " - " (promotional description) and remove parenthetical chemical names
  let core = raw.split(/\s+-\s+/)[0].split(/\.\s+/)[0];
  core = core.replace(/\([^)]*\)/g, ' ').replace(/[®™!]/g, ' ').replace(/\s+/g, ' ').trim();

  if (inferredBrand && !core.toLowerCase().includes(inferredBrand.toLowerCase().split(/[\s-]/)[0])) {
    core = `${core} ${inferredBrand}`;
  }

  return core.trim();
}

function stemToken(token) {
  const map = {
    vitamina: 'vitamin',
    vitaminas: 'vitamin',
    creatina: 'creatin',
    glutamina: 'glutamin',
    carnitina: 'carnitin',
    cartinina: 'carnitin',
    arginina: 'arginin',
    cafeina: 'caffein',
    carnivoro: 'carnivor'
  };
  return map[token] || token;
}

function getRequiredTokens(searchTerm) {
  const stopWords = new Set([
    'para', 'con', 'del', 'las', 'los', 'una', 'uno', 'por', 'sin', 'mas', 'más',
    'caps', 'capsulas', 'tabs', 'tabletas', 'tablets', 'amp', 'ampollas', 'ampolletas',
    'lbs', 'grs', 'gr', 'mg', 'ml', 'kg', 'oz', 'srv', 'servicios', 'piezas', 'sobres',
    'pack', 'caja', 'vial', 'viales', 'plus', 'pro', 'max', 'ultra', 'super', '100',
    'nutrition', 'labs', 'labz', 'sport', 'sports', 'original', 'essentials', 'series',
    'desconocida', 'suplemento', 'proteina', 'aminoacidos', 'gold', 'brown', 'red', 'bronze',
    'polvo', 'powder', 'liquid', 'liquida', 'bebible', 'tableta', 'capsula', 'natural',
    'crema', 'complex', 'hardcore', 'advanced', 'pure', 'platinum', 'whey'
  ]);
  const allTokens = searchTerm
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !/^\d+[a-z]*$/.test(t) && !stopWords.has(t))
    .map(stemToken);

  const unique = [...new Set(allTokens)];
  if (unique.length <= 2) return unique;
  // Keep first token (product name) and last token (brand name)
  return [unique[0], unique[unique.length - 1]].filter((v, i, a) => a.indexOf(v) === i);
}

function candidateMatchesProduct(candidate, requiredTokens) {
  if (!requiredTokens.length) return false;
  const cleanImg = String(candidate.image || '').split('?')[0];
  const cleanPage = String(candidate.pageUrl || '').split('?')[0];
  const haystack = `${candidate.title || ''} ${cleanImg} ${cleanPage}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Require ALL required tokens to appear at word boundaries (exact word for short tokens <= 4 chars)
  return requiredTokens.every(token => {
    const pattern = token.length <= 4
      ? new RegExp(`(?:^|[^a-z0-9])${token}(?:$|[^a-z0-9])`, 'i')
      : new RegExp(`(?:^|[^a-z0-9])${token}`, 'i');
    return pattern.test(haystack);
  });
}

const SHOPIFY_DOMAINS = {
  'Gaspari Nutrition': 'gasparinutrition.com',
  'MDN Sports': 'mdnsports.com',
  'Muscletech': 'shop.muscletech.com',
  'Muscle-Tech': 'shop.muscletech.com',
  'Insane Labz': 'insanelabz.com',
  'BPI Sports': 'bpisports.com',
  'BPI': 'bpisports.com',
  'Labrada': 'labrada.com',
  'Nutrex': 'nutrex.com',
  'MusclePharm': 'musclepharm.com',
  'MuscleMeds': 'iamcarnivor.com'
};

const MULTI_BRAND_SHOPIFY_DOMAINS = [
  'www.tigerfitness.com',
  'www.bestpricenutrition.com'
];

async function queryShopify(domain, query, requiredTokens = []) {
  try {
    const url = `https://${domain}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const prods = data?.resources?.results?.products || [];
    for (const p of prods) {
      const img = p.image || p.featured_image?.url;
      if (img) {
        const fullUrl = img.startsWith('//') ? `https:${img}` : img;
        if (requiredTokens.length === 0 || candidateMatchesProduct({ title: p.title, image: fullUrl, pageUrl: p.url }, requiredTokens)) {
          return {
            title: p.title,
            url: fullUrl,
            source: `Shopify (${domain})`
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function getVqd(query) {
  try {
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(7000)
    });
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-_]+)/) || html.match(/vqd=["']([0-9-_]+)["']/);
    if (vqdMatch) {
      return vqdMatch[1];
    }
  } catch {}
  return null;
}

const BLOCKED_HOSTS = [
  'nutricionextrema',
  'facebook.com',
  'lookaside.fbsbx.com',
  'tiktok.com',
  'instagram.com',
  'pinterest.com',
  'pinimg.com',
  'youtube.com',
  'ytimg.com',
  'fondosmil.',
  'wallpaper',
  'freepik.com',
  'vecteezy.com',
  'dreamstime.com',
  'depositphotos.com',
  'shutterstock.com',
  'alamy.com',
  'flaticon.com',
  'scribdassets.com',
  'studylib.',
  'udocz-assets.com',
  'docsity.com',
  'omegawatches.com',
  'crunchyroll.com',
  'pixabay.com'
];

async function searchBingImages(query) {
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1&scenario=ImageBasicHover`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,es-MX;q=0.8'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const text = await res.text();
    const blocks = [...text.matchAll(/m="(\{[^"]+\})"/g)];
    const results = [];
    for (const b of blocks) {
      try {
        const jsonStr = b[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'");
        const parsed = JSON.parse(jsonStr);
        if (parsed.murl && parsed.murl.startsWith('http')) {
          results.push({
            image: parsed.murl,
            title: `${parsed.t || ''} ${parsed.desc || ''}`.trim(),
            pageUrl: parsed.purl || ''
          });
        }
      } catch {}
    }
    return results.filter(r => !BLOCKED_HOSTS.some(b => r.image.toLowerCase().includes(b) || r.pageUrl.toLowerCase().includes(b)));
  } catch {
    return [];
  }
}

async function searchDDGImages(query) {
  try {
    const vqd = await getVqd(query);
    if (!vqd) return [];

    const imgUrl = `https://duckduckgo.com/i.js?l=es-es&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,type:photo&p=1`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!imgRes.ok) return [];
    const data = await imgRes.json();
    return (data.results || []).filter(r => {
      if (!r.image) return false;
      const lower = r.image.toLowerCase();
      if (BLOCKED_HOSTS.some(b => lower.includes(b))) return false;
      return true;
    });
  } catch {
    return [];
  }
}

async function verifyAndFetchImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/png,image/jpeg,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(contentType)) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5000) return null; // Too small to be a real product image

    let ext = '.jpg';
    let normalizedType = 'image/jpeg';
    if (contentType === 'image/png') {
      ext = '.png';
      normalizedType = 'image/png';
    } else if (contentType === 'image/webp') {
      ext = '.webp';
      normalizedType = 'image/webp';
    }

    return { buffer, contentType: normalizedType, ext };
  } catch {
    return null;
  }
}

async function run() {
  console.log(`Iniciando Scraper Web (${isWatermarks ? 'Reemplazo de Marcas de Agua' : 'Productos sin Imagen'})...`);
  console.log(`Modo: ${doUpload ? '🚀 DESCARGA Y SUBIDA A SUPABASE' : '🔍 SIMULACIÓN (DRY-RUN)'}`);

  let products = [];
  if (isWatermarks) {
    const catRaw = JSON.parse(await readFile('outputs/categorization.json', 'utf8'));
    products = (catRaw.candidates || []).slice(0, limit).map(c => ({
      id: c.product_id,
      name: c.producto,
      brand_name: 'Desconocida'
    }));
  } else {
    const raw = await readFile('outputs/productos_sin_imagen.json', 'utf8');
    products = JSON.parse(raw).slice(0, limit);
  }

  console.log(`Total de productos a procesar: ${products.length}\n`);

  const results = [];
  const resolvedWatermarkIds = new Set();
  const watermarkBackupPath = 'image_backup_watermark.json';
  let watermarkBackup = [];
  let watermarkBackupIds = new Set();
  if (isWatermarks && doUpload) {
    try {
      watermarkBackup = JSON.parse(await readFile(watermarkBackupPath, 'utf8'));
      watermarkBackupIds = new Set(watermarkBackup.map(item => item.id));
    } catch {
      watermarkBackup = [];
    }
  }

  let foundCount = 0;
  let uploadedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const searchTerm = cleanSearchTerm(prod.name, prod.brand_name);
    const requiredTokens = getRequiredTokens(searchTerm);
    console.log(`[${i + 1}/${products.length}] "${prod.name.slice(0, 50)}..."`);
    console.log(`   🔎 Búsqueda: "${searchTerm}" (tokens: ${requiredTokens.join(', ')})`);

    let bestMatch = null;

    // 1. Check Shopify direct if brand known
    const shopifyDomain = SHOPIFY_DOMAINS[prod.brand_name];
    if (shopifyDomain) {
      const shopifyRes = await queryShopify(shopifyDomain, searchTerm, requiredTokens);
      if (shopifyRes) {
        const verified = await verifyAndFetchImage(shopifyRes.url);
        if (verified) {
          bestMatch = { ...shopifyRes, ...verified };
        }
      }
    }

    // 1b. Check Multi-Brand Supplement Shopify Stores (TigerFitness, BestPriceNutrition)
    if (!bestMatch) {
      for (const domain of MULTI_BRAND_SHOPIFY_DOMAINS) {
        const shopifyRes = await queryShopify(domain, searchTerm, requiredTokens);
        if (shopifyRes) {
          const verified = await verifyAndFetchImage(shopifyRes.url);
          if (verified) {
            bestMatch = { ...shopifyRes, ...verified };
            break;
          }
        }
      }
    }

    // 2. Search DDG if not found
    if (!bestMatch) {
      const ddgCandidates = (await searchDDGImages(searchTerm)).filter(c => candidateMatchesProduct(c, requiredTokens));
      for (const cand of ddgCandidates.slice(0, 5)) {
        const verified = await verifyAndFetchImage(cand.image);
        if (verified) {
          bestMatch = {
            title: cand.title,
            url: cand.image,
            source: 'Búsqueda Web (DDG)',
            ...verified
          };
          break;
        }
      }
    }

    // 3. Fallback search with Bing Images (strictly filtered by title/URL token match)
    if (!bestMatch) {
      const bingCandidates = (await searchBingImages(`${searchTerm} supplement`)).filter(c => candidateMatchesProduct(c, requiredTokens));
      for (const cand of bingCandidates.slice(0, 6)) {
        const verified = await verifyAndFetchImage(cand.image);
        if (verified) {
          bestMatch = {
            title: cand.title,
            url: cand.image,
            source: 'Búsqueda Web (Bing Verificado)',
            ...verified
          };
          break;
        }
      }
    }

    // 4. Fallback search with simplified query if still not found
    if (!bestMatch) {
      const simpleQuery = requiredTokens.join(' ');
      if (simpleQuery) {
        const bingSimple = (await searchBingImages(simpleQuery)).filter(c => candidateMatchesProduct(c, requiredTokens));
        for (const cand of bingSimple.slice(0, 5)) {
          const verified = await verifyAndFetchImage(cand.image);
          if (verified) {
            bestMatch = {
              title: cand.title,
              url: cand.image,
              source: 'Búsqueda Web (Verificado)',
              ...verified
            };
            break;
          }
        }
      }
    }

    if (bestMatch) {
      foundCount++;
      console.log(`   ✅ ENCONTRADA (${bestMatch.source}): ${bestMatch.url.slice(0, 80)}...`);

      let publicUrl = bestMatch.url;

      if (doUpload) {
        const storagePath = `${prod.id}/web-1${bestMatch.ext}`;
        const uploadRes = await db.storage
          .from('products')
          .upload(storagePath, bestMatch.buffer, {
            contentType: bestMatch.contentType,
            upsert: true
          });

        if (uploadRes.error) {
          console.error(`   ❌ Error subiendo a Storage: ${uploadRes.error.message}`);
        } else {
          const { data: pubData } = db.storage.from('products').getPublicUrl(storagePath);
          publicUrl = pubData.publicUrl;

          if (isWatermarks) {
            // Backup existing rows before replacing
            const { data: oldRows } = await db.from('product_images').select('*').eq('product_id', prod.id);
            for (const row of oldRows || []) {
              if (!watermarkBackupIds.has(row.id)) {
                watermarkBackup.push(row);
                watermarkBackupIds.add(row.id);
              }
            }
            await db.from('product_images').delete().eq('product_id', prod.id);
            const { error: insErr } = await db.from('product_images').insert({
              product_id: prod.id,
              image_url: publicUrl,
              alt_text: prod.name,
              display_order: 1,
              is_primary: true
            });
            if (insErr) {
              console.error(`   ❌ Error insertando reemplazo en DB: ${insErr.message}`);
            } else {
              uploadedCount++;
              resolvedWatermarkIds.add(prod.id);
              console.log(`   🚀 MARCA DE AGUA REEMPLAZADA: ${storagePath}`);
            }
          } else {
            // Check if already in product_images
            const { data: existingImg } = await db
              .from('product_images')
              .select('id')
              .eq('product_id', prod.id)
              .maybeSingle();

            if (!existingImg) {
              const { error: insErr } = await db.from('product_images').insert({
                product_id: prod.id,
                image_url: publicUrl,
                alt_text: prod.name,
                display_order: 1,
                is_primary: true
              });
              if (insErr) {
                console.error(`   ❌ Error insertando en DB: ${insErr.message}`);
              } else {
                uploadedCount++;
                console.log(`   🚀 SUBIDA Y VINCULADA: ${storagePath}`);
              }
            } else {
              console.log(`   ⚠️ Ya tenía imagen registrada.`);
            }
          }
        }
      }

      results.push({
        product_id: prod.id,
        product_name: prod.name,
        brand: prod.brand_name,
        status: 'ENCONTRADA',
        source: bestMatch.source,
        image_url: bestMatch.url,
        final_public_url: publicUrl,
        size_bytes: bestMatch.buffer?.length
      });
    } else {
      console.log(`   ❌ No se encontró imagen válida.`);
      results.push({
        product_id: prod.id,
        product_name: prod.name,
        brand: prod.brand_name,
        status: 'NO_ENCONTRADA',
        source: null,
        image_url: null,
        final_public_url: null,
        size_bytes: 0
      });
    }

    // Small delay between searches to be polite
    await new Promise(r => setTimeout(r, 350));
  }

  if (isWatermarks && doUpload && resolvedWatermarkIds.size > 0) {
    await writeFile(watermarkBackupPath, JSON.stringify(watermarkBackup, null, 1), 'utf8');
    const csvText = await readFile('pendientes_marca_agua.csv', 'utf8');
    const lines = csvText.split(/\r?\n/);
    const remainingLines = [lines[0]];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const pid = line.slice(0, line.indexOf(',')).trim();
      if (!resolvedWatermarkIds.has(pid)) remainingLines.push(line);
    }
    await writeFile('pendientes_marca_agua.csv', remainingLines.join('\n') + '\n', 'utf8');

    const reviewCsv = await readFile('image_review_verificar.csv', 'utf8');
    const reviewLines = reviewCsv.split(/\r?\n/).filter(Boolean);
    for (const r of results.filter(x => resolvedWatermarkIds.has(x.product_id))) {
      reviewLines.push(`${r.product_id},"${r.product_name.replace(/"/g, '""')}","foto reemplazada limpia","${(r.image_url || '').replace(/"/g, '""')}"`);
    }
    await writeFile('image_review_verificar.csv', reviewLines.join('\n') + '\n', 'utf8');
    console.log(`pendientes_marca_agua.csv e image_review_verificar.csv actualizados (${resolvedWatermarkIds.size} reemplazos).`);
  }

  console.log(`\n========================================`);
  console.log(`PROCESAMIENTO COMPLETADO`);
  console.log(`Total procesados: ${products.length}`);
  console.log(`Imágenes encontradas: ${foundCount} (${Math.round(foundCount / products.length * 100)}%)`);
  if (doUpload) {
    console.log(`Imágenes subidas y asociadas en DB: ${uploadedCount}`);
  }
  console.log(`========================================\n`);

  await writeFile('outputs/scraped_products_images.json', JSON.stringify(results, null, 2), 'utf8');

  // Also write CSV
  const csvHeaders = 'product_id,brand,status,source,image_url,product_name\n';
  const csvLines = results.map(r => 
    `"${r.product_id}","${(r.brand||'').replace(/"/g, '""')}","${r.status}","${(r.source||'').replace(/"/g, '""')}","${(r.image_url||'').replace(/"/g, '""')}","${(r.product_name||'').replace(/"/g, '""')}"`
  ).join('\n');
  await writeFile('outputs/scraped_products_images.csv', csvHeaders + csvLines, 'utf8');

  console.log(`Archivos generados:`);
  console.log(` - outputs/scraped_products_images.json`);
  console.log(` - outputs/scraped_products_images.csv`);
}

run().catch(console.error);
