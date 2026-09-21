import type { MetadataRoute } from 'next';
import { publicDatabase } from '@/lib/supabase/server';
import { DOCUMENT_TITLES } from '@/lib/documents';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const entries: MetadataRoute.Sitemap = [{ url: `${base}/` }, { url: `${base}/productos` }, ...Object.keys(DOCUMENT_TITLES).map(slug => ({ url: `${base}/${slug}` }))];
  try {
    const { data } = await publicDatabase().from('products').select('slug,updated_at').eq('commercial_status', 'activo').eq('regulatory_status', 'aprobado');
    for (const product of data ?? []) entries.push({ url: `${base}/productos/${product.slug}`, lastModified: product.updated_at });
  } catch { /* Sitemap still lists the static pages if the catalog is unavailable. */ }
  return entries;
}
