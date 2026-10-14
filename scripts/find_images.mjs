import { writeFile } from 'node:fs/promises';

async function queryShopify(domain, query) {
  try {
    const url = `https://${domain}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return data?.resources?.results?.products || [];
  } catch (err) {
    return { error: err.message };
  }
}

// Test some domains
console.log('Testing domains...');
console.log('shop.muscletech.com:', await queryShopify('shop.muscletech.com', 'platinum'));
console.log('labrada.com:', await queryShopify('labrada.com', 'lean body'));
console.log('musclepharm.com:', await queryShopify('musclepharm.com', 'bcaa'));
console.log('bpisports.com:', await queryShopify('bpisports.com', 'best aminos'));
console.log('iamcarnivor.com:', await queryShopify('iamcarnivor.com', 'carnivor'));
console.log('dymatize.com:', await queryShopify('dymatize.com', 'bcaa'));
