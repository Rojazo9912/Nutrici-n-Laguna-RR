import { readFile, writeFile } from 'node:fs/promises';

const cat = JSON.parse(await readFile('outputs/categorization.json', 'utf8'));

export async function queryShopify(domain, query) {
  try {
    const url = `https://${domain}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return (data?.resources?.results?.products || []).map(p => ({
      title: p.title,
      handle: p.handle,
      image: p.image || p.featured_image?.url,
      url: `https://${domain}${p.url}`
    }));
  } catch (err) {
    return { error: err.message };
  }
}

// Let's test search queries on several candidate products
console.log('--- LABRADA ---');
console.log(await queryShopify('labrada.com', 'Lean Body'));
console.log(await queryShopify('labrada.com', 'Kre-Alkalyn'));
console.log(await queryShopify('labrada.com', 'Charge'));
console.log(await queryShopify('labrada.com', 'Power Carb'));

console.log('--- MUSCLEPHARM ---');
console.log(await queryShopify('musclepharm.com', 'BCAA'));

console.log('--- BPI ---');
console.log(await queryShopify('bpisports.com', 'Best Aminos'));
console.log(await queryShopify('bpisports.com', 'Build-HD'));
