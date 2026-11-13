import { availableStock, unitPrice } from '@/lib/commerce';
import type { Product, ProductVariant } from '@/types/database.types';

/**
 * Catálogo para WhatsApp (Meta Commerce Manager, carga de archivo CSV).
 *
 * Parte del catálogo público (aprobado + activo). La base, desde la migración 08, ya impide que un
 * producto controlado o de receta esté activo. Encima de eso, Meta tiene reglas propias más estrictas
 * para catálogos de WhatsApp: esta lista excluye lo que tiene alto riesgo de rechazo o de bloqueo de
 * la cuenta. Es deliberadamente conservadora; si decides incluir algo, quítalo de aquí con criterio.
 */
export const META_RISK_RULES: { reason: string; pattern: RegExp }[] = [
  { reason: 'Suplemento que Meta considera inseguro (DHEA, quitosano, consuelda, yohimbina)', pattern: /\bdhea\b|quitosano|chitosan|consuelda|comfrey|yohimb/ },
  { reason: 'Desempeño sexual', pattern: /disfuncion sexual|potencia sexual|mejora sexual|viagr|cialis|libido/ },
  { reason: 'Control de peso o reductivo (Meta rechaza mensajes que generan autopercepción negativa)', pattern: /quemador|quema grasa|fat burner|termogenic|thermo|lipo[- ]?6|hydroxycut|xenadrine|adelgaz|bajar de peso|perdida de peso|reductiv|liposuccion|sin cirugia|anticelulit|celulitis|antiobesidad|obesidad/ },
];

export type CatalogRow = Record<(typeof FEED_COLUMNS)[number], string>;
export type ExcludedRow = { producto: string; slug: string; motivo: string };

export const FEED_COLUMNS = ['id', 'item_group_id', 'title', 'description', 'availability', 'condition', 'price', 'sale_price', 'link', 'image_link', 'brand'] as const;

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const price = (value: number) => `${value.toFixed(2)} MXN`;
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export function metaRiskReason(product: Pick<Product, 'name' | 'description_short' | 'category'>) {
  const text = normalize(`${product.name} ${product.description_short ?? ''} ${product.category?.name ?? ''}`);
  return META_RISK_RULES.find(rule => rule.pattern.test(text))?.reason ?? null;
}

/** Solo imágenes en el almacenamiento propio de la tienda: nunca enlaces a sitios de terceros. */
export function ownImage(product: Product, storageHost: string) {
  const images = [...(product.images ?? [])].sort((a, b) => Number(b.is_primary ?? false) - Number(a.is_primary ?? false));
  for (const image of images) {
    try {
      const url = new URL(image.image_url);
      if (url.protocol === 'https:' && url.hostname === storageHost && url.pathname.includes('/storage/v1/object/public/')) return url.toString();
    } catch { /* URL inválida: se ignora. */ }
  }
  return null;
}

function variantLabel(variant: ProductVariant) {
  return [variant.flavor, variant.size, variant.presentation].filter(Boolean).join(' · ');
}

export function buildWhatsappCatalog(products: Product[], options: { baseUrl: string; storageHost: string }) {
  const rows: CatalogRow[] = [];
  const excluded: ExcludedRow[] = [];
  const base = options.baseUrl.replace(/\/$/, '');

  for (const product of products) {
    const skip = (motivo: string) => excluded.push({ producto: product.name, slug: product.slug, motivo });
    if (product.commercial_status !== 'activo' || product.regulatory_status !== 'aprobado') { skip('No está aprobado y activo'); continue; }
    const risk = metaRiskReason(product);
    if (risk) { skip(risk); continue; }
    const brand = product.brand?.name?.trim();
    if (!brand || normalize(brand) === 'desconocida') { skip('Sin marca (Meta la exige)'); continue; }
    const image = ownImage(product, options.storageHost);
    if (!image) { skip('Sin imagen propia en el almacenamiento de la tienda'); continue; }
    const variants = product.variants ?? [];
    if (!variants.length) { skip('Sin variantes con SKU'); continue; }

    for (const variant of variants) {
      const sale = unitPrice(product, variant);
      const regular = variant.price_override ?? product.price_regular;
      if (!(sale > 0)) { skip(`Variante ${variant.sku} sin precio`); continue; }
      const label = variantLabel(variant);
      rows.push({
        id: variant.sku,
        item_group_id: product.slug,
        title: clip(label ? `${product.name} - ${label}` : product.name, 150),
        description: clip((product.description_short || product.name).replace(/\s+/g, ' ').trim(), 5000),
        availability: availableStock(variant) > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        price: price(Math.max(regular, sale)),
        sale_price: sale < regular ? price(sale) : '',
        link: `${base}/productos/${encodeURIComponent(product.slug)}`,
        image_link: image,
        brand: clip(brand, 100),
      });
    }
  }
  return { rows, excluded };
}
