async function testSearch(term) {
  console.log(`\nBuscando palabra: "${term}"...`);
  // Try GET first
  let res = await fetch(`https://www.nutricionextrema.com/buscar_productos.asp?palabra=${encodeURIComponent(term)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  let html = await res.text();
  
  // Also try POST if GET doesn't show results
  if (!html.includes('idprod=') && !html.includes('prods/')) {
    res = await fetch('https://www.nutricionextrema.com/buscar_productos.asp', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `palabra=${encodeURIComponent(term)}`
    });
    html = await res.text();
  }

  // Extract products found
  // Usually <a href="producto.asp?idprod=..."> ... <img src="prods/..."> ...
  const productMatches = [...html.matchAll(/href=['"](producto\.asp\?idprod=\d+)['"][^>]*>([\s\S]*?)<\/a>/gi)];
  console.log('Resultados producto.asp encontrados:', productMatches.length);
  for (const p of productMatches.slice(0, 5)) {
    const link = 'https://www.nutricionextrema.com/' + p[1];
    const img = p[2].match(/src=['"]([^'"]+)['"]/)?.[1];
    const title = p[2].replace(/<[^>]+>/g, '').trim();
    console.log(`  🔗 ${link} | Img: ${img} | Titulo: ${title}`);
  }
}

async function run() {
  await testSearch('Scultur');
  await testSearch('cholmod');
  await testSearch('Silicio');
  await testSearch('SizeOn');
  await testSearch('Post Depil');
}

run();
