import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/catalog';
import ProductDetail from '@/components/ProductDetail';
export const dynamic = 'force-dynamic';
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.products.find(product => product.slug === slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
