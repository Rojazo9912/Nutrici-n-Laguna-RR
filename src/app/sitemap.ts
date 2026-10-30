import type { MetadataRoute } from 'next';
import { publicDatabase } from '@/lib/supabase/server';
import { DOCUMENT_TITLES } from '@/lib/documents';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const entries: MetadataRoute.Sitemap = [{ url: `${base}/` }, { url: `${base}/productos` }, ...Object.keys(DOCUMENT_TITLES).map(slug => ({ url: `${base}/${slug}` }))];
  try {
    const db = publicDatabase();
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await db
        .from('products')
        .select('slug,updated_at')
        .eq('commercial_status', 'activo')
        .eq('regulatory_status', 'aprobado')
        .order('slug')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error || !data) break;
      for (const product of data) {
        entries.push({ url: `${base}/productos/${product.slug}`, lastModified: product.updated_at });
      }
      if (data.length < pageSize) break;
      page += 1;
    }
  } catch { /* Sitemap still lists the static pages if the catalog is unavailable. */ }
  return entries;
}
