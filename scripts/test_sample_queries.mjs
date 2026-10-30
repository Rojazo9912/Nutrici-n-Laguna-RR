async function searchDDGImages(query) {
  try {
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8'
      }
    });
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-_]+)/) || html.match(/vqd=["']([0-9-_]+)["']/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];
    const imgUrl = `https://duckduckgo.com/i.js?l=es-es&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,type:photo&p=1`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    if (!imgRes.ok) return [];
    const data = await imgRes.json();
    return (data.results || []).map(r => ({
      title: r.title,
      image: r.image,
      width: r.width,
      height: r.height,
      source: r.url
    }));
  } catch (err) {
    console.error('Err:', err);
    return [];
  }
}

const queries = [
  'Silicio Organico 0.5% Mesoestetic ampolletas',
  'Scultur Refort IT-Pharma',
  'Post Depil Simildiet',
  'CHOLAL MODIFICADO 10 Ampolletas',
  'Creatina 500 Advance Nutrition'
];

for (const q of queries) {
  console.log(`\nQuery: ${q}`);
  const results = await searchDDGImages(q);
  console.log(`Found: ${results.length}`);
  results.slice(0, 2).forEach((r, idx) => {
    console.log(`  [${idx+1}] ${r.title} | ${r.width}x${r.height} | ${r.image}`);
  });
}
