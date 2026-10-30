async function run() {
  const res = await fetch('https://www.nutricionextrema.com/tienda.asp?buscar=Scultur', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  console.log('Search response length:', html.length);
  // Match products with their images and links
  const matches = [...html.matchAll(/<img[^>]+src=['"]([^'"]*prods\/[^'"]+)['"][^>]*>/gi)];
  for (const m of matches) {
    console.log('Image tag:', m[0]);
    console.log('Image src:', m[1]);
  }
}

run();
