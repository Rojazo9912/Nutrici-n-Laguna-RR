async function run() {
  const res = await fetch('https://www.nutricionextrema.com/buscar_productos.asp', {
    method: 'POST',
    headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'palabra=creatina'
  });
  const text = await res.text();
  // Find where results are rendered
  const idx1 = text.indexOf('Resultados');
  const idx2 = text.indexOf('Resultados', idx1 + 1);
  console.log('Snippet around second Resultados (idx = ' + idx2 + '):');
  if (idx2 >= 0) {
    console.log(text.slice(idx2, idx2 + 2000));
  } else {
    console.log('No second occurrence, searching for table content...');
    const bIdx = text.indexOf('body');
    console.log(text.slice(bIdx, bIdx + 1500));
  }
}

run();
