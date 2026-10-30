import { readFile } from 'node:fs/promises';

async function run() {
  const res = await fetch('https://www.nutricionextrema.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const forms = [...html.matchAll(/<form[^>]*action=['"]([^'"]*)['"][^>]*>([\s\S]*?)<\/form>/gi)];
  for (const f of forms) {
    console.log('Form Action:', f[1]);
    console.log('Form inputs:', [...f[2].matchAll(/<input[^>]+name=['"]([^'"]+)['"][^>]*>/gi)].map(i => i[1]));
  }
}

run();
