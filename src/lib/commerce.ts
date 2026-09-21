import type { Product, ProductVariant } from '@/types/database.types';

export const MAX_QUANTITY = 99;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type CartLine = { variantId: string; quantity: number };
export type CheckoutInput = {
  items: CartLine[];
  coupon: string;
  privacyConsent: true;
  customer: { fullName: string; email: string; phone: string; street: string; city: string; state: string; postalCode: string };
};

export function availableStock(variant?: ProductVariant) {
  return variant ? Math.max(0, variant.stock_available - variant.stock_reserved) : 0;
}

export function unitPrice(product: Product, variant?: ProductVariant) {
  return variant?.price_override ?? Math.min(product.price_regular, product.price_promo ?? product.price_regular);
}

export function money(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

export function parseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const lines = new Map<string, number>();
  for (const item of value.slice(0, 50)) {
    if (item && typeof item.variantId === 'string' && UUID.test(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0) {
      lines.set(item.variantId, Math.min(MAX_QUANTITY, (lines.get(item.variantId) ?? 0) + item.quantity));
    }
  }
  return [...lines].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function validateItems(value: unknown, coupon: unknown = '') {
  const input = { items: value, coupon };
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) throw new Error('El carrito debe contener entre 1 y 50 variantes.');
  const seen = new Set<string>();
  const items = input.items.map(item => {
    if (!item || typeof item.variantId !== 'string' || !UUID.test(item.variantId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY || seen.has(item.variantId)) throw new Error('Cantidades o variantes inválidas.');
    seen.add(item.variantId);
    return { variantId: item.variantId, quantity: item.quantity };
  }).sort((a, b) => a.variantId.localeCompare(b.variantId));
  if (input.coupon !== undefined && (typeof input.coupon !== 'string' || input.coupon.length > 40)) throw new Error('Cupón inválido.');
  return { items, coupon: (input.coupon as string || '').trim().toUpperCase() };
}

export function validateCheckout(value: unknown): CheckoutInput {
  if (!value || typeof value !== 'object') throw new Error('Solicitud inválida.');
  const input = value as Record<string, unknown>;
  const cart = validateItems(input.items, input.coupon);
  if (input.privacyConsent !== true) throw new Error('Debes aceptar el aviso de privacidad.');
  const source = input.customer as Record<string, unknown> | undefined;
  const field = (name: string, max: number) => {
    const value = source?.[name];
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error('Completa correctamente los datos de envío.');
    return value.trim();
  };
  const customer = { fullName: field('fullName', 120), email: field('email', 254).toLowerCase(), phone: field('phone', 20), street: field('street', 250), city: field('city', 100), state: field('state', 100), postalCode: field('postalCode', 5) };
  const digits = customer.phone.replace(/\D/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || !/^\+?[\d ()-]{10,20}$/.test(customer.phone) || digits.length < 10 || digits.length > 15 || !/^\d{5}$/.test(customer.postalCode)) throw new Error('Revisa tu correo, teléfono y código postal.');
  return { ...cart, customer, privacyConsent: true };
}
