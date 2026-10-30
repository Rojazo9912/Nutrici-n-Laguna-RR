async function getOgImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
    return m ? m[1] : null;
  } catch(e) { return null; }
}

for (const slug of ['liposintrol', 'liposin', 'lipofase', 'cumarin', 'cafein', 'l-carnitine', 'scultur-refort']) {
  const url = `https://itpharma.com/portfolio-item/${slug}/`;
  const img = await getOgImage(url);
  console.log(`${slug}: ${img}`);
}
