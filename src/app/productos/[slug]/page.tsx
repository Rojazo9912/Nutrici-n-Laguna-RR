import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/catalog';
import { unitPrice } from '@/lib/commerce';
import ProductDetail from '@/components/ProductDetail';
export const dynamic = 'force-dynamic';

async function findProduct(slug: string) {
  const catalog = await getCatalog();
  return catalog.products.find(product => product.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await findProduct((await params).slug).catch(() => undefined);
  if (!product) return { title: 'Producto no encontrado', robots: { index: false } };
  const image = product.images?.[0]?.image_url;
  return { title: `${product.name} | Nutrición Laguna RR`, description: product.description_short, alternates: { canonical: `/productos/${product.slug}` }, openGraph: { title: product.name, description: product.description_short, type: 'website', ...(image ? { images: [image] } : {}) } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) notFound();
  const variants = product.variants ?? [];
  const inStock = variants.some(variant => variant.stock_available - variant.stock_reserved > 0);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description_short, sku: variants[0]?.sku,
    ...(product.brand?.name ? { brand: { '@type': 'Brand', name: product.brand.name } } : {}),
    ...(product.images?.length ? { image: product.images.map(image => image.image_url) } : {}),
    offers: { '@type': 'Offer', priceCurrency: 'MXN', price: unitPrice(product, variants[0]).toFixed(2), availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <ProductDetail product={product} />
  </>;
}
