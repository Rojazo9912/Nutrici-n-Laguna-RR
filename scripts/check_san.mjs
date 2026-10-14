import { writeFile } from 'node:fs/promises';

for (const handle of ['bcaa-pro-5000-bcaas-plus-beta-alanine', 'l-carnitine-power']) {
  const res = await fetch(`https://sann.net/products/${handle}.js`);
  if (res.ok) {
    const d = await res.json();
    console.log(handle, 'images:', d.images);
    if (d.images && d.images[0]) {
      const imgRes = await fetch(d.images[0].startsWith('//') ? 'https:' + d.images[0] : d.images[0]);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      await writeFile(`outputs/${handle}.jpg`, buf);
      console.log('Saved', handle, buf.length);
    }
  }
}
