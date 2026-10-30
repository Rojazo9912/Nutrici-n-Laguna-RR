// Test image search via DuckDuckGo vqd and i.js
async function searchDDGImages(query) {
  try {
    // 1. Get vqd token
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8'
      }
    });
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-_]+)/) || html.match(/vqd=["']([0-9-_]+)["']/);
    if (!vqdMatch) {
      return { error: 'No vqd token found' };
    }
    const vqd = vqdMatch[1];
    
    // 2. Query i.js
    const imgUrl = `https://duckduckgo.com/i.js?l=es-es&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,type:photo&p=1`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    if (!imgRes.ok) return { error: `HTTP ${imgRes.status}` };
    const data = await imgRes.json();
    return data.results || [];
  } catch (err) {
    return { error: err.message };
  }
}

// Test Bing images HTML scraper
async function searchBingImages(query) {
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1&scenario=ImageBasicHover`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) return { error: `Bing HTTP ${res.status}` };
    const text = await res.text();
    // Bing image search embeds media url in m="{...&quot;murl&quot;:&quot;URL&quot;...}"
    const matches = [...text.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g)];
    return matches.map(m => m[1]);
  } catch (err) {
    return { error: err.message };
  }
}

console.log('Testing DDG Images...');
const ddgResults = await searchDDGImages('SizeOn Max Gaspari Nutrition');
console.log('DDG result count:', Array.isArray(ddgResults) ? ddgResults.length : ddgResults);
if (Array.isArray(ddgResults) && ddgResults.length > 0) {
  console.log('DDG top 1:', ddgResults[0].image, ddgResults[0].title);
}

console.log('\nTesting Bing Images...');
const bingResults = await searchBingImages('SizeOn Max Gaspari Nutrition');
console.log('Bing result count:', Array.isArray(bingResults) ? bingResults.length : bingResults);
if (Array.isArray(bingResults) && bingResults.length > 0) {
  console.log('Bing top 3:', bingResults.slice(0, 3));
}
