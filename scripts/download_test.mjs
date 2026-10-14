import { writeFile } from 'node:fs/promises';

const targets = [
  { name: 'current_dymatize_liquid', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/cb22cd3b-01bf-4e4f-9130-03bc6d4b5832/1.jpg' },
  { name: 'current_dymatize_bcaa', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/1a4ad863-4ca5-4951-b615-68445de5f919/1.jpg' },
  { name: 'current_san_bcaa', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/d31ae45c-fec6-4f9f-948e-3748c379f496/1.jpg' },
  { name: 'current_carnivor_raging', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/f252e7b4-beba-4de2-8e62-b3ad0ec16ba7/1.jpg' },
  { name: 'current_beast_whey', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/e8b4f5d0-2dea-44a7-b2fc-bd2cca0a2500/1.jpg' },
  { name: 'current_xenadrine', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/5049b446-9f4b-41ac-8b0a-97dc3a3c07c3/1.jpg' },
  { name: 'current_muscletech_carnitine', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/d57fee37-2d4e-4438-a6c9-7f83263301d6/1.jpg' },
  { name: 'current_muscletech_whey', url: 'https://ehtrmfxxohodoutrvrvy.supabase.co/storage/v1/object/public/products/3a51937b-fe3f-4c7b-a454-f31b24403124/1.jpg' }
];

for (const t of targets) {
  try {
    const res = await fetch(t.url);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(`outputs/${t.name}.jpg`, buf);
      console.log('Saved', t.name, buf.length);
    } else {
      console.log('Failed', t.name, res.status);
    }
  } catch (e) {
    console.log('Error', t.name, e.message);
  }
}
