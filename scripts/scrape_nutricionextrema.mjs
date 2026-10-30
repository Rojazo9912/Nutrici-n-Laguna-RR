import { readFile, writeFile } from 'node:fs/promises';

async function run() {
  const missing = JSON.parse(await readFile('outputs/productos_sin_imagen.json', 'utf8'));
  console.log(`Buscando en nutricionextrema.com para ${missing.length} productos sin imagen...`);

  // Try search on nutricionextrema.com
  // Example search URL: https://www.nutricionextrema.com/buscar.asp?buscar=... or similar
  const testQueries = ['cholmod', 'SizeOn', 'Silicio', 'Scultur', 'Creatina 500'];
  for (const q of testQueries) {
    const urls = [
      `https://www.nutricionextrema.com/buscar.asp?buscar=${encodeURIComponent(q)}`,
      `https://www.nutricionextrema.com/tienda.asp?buscar=${encodeURIComponent(q)}`,
      `https://www.nutricionextrema.com/resultados.asp?buscar=${encodeURIComponent(q)}`
    ];
    for (const u of urls) {
      try {
        const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const txt = await res.text();
          if (txt.includes('prods/')) {
            console.log(`Endpoint funciona! ${u} -> encontrados "prods/"`);
          }
        }
      } catch {}
    }
  }
}

run().catch(console.error);
