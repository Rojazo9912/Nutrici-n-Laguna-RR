import 'server-only';
import { HttpError } from '@/lib/http';

export function paymentConfig() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const base = process.env.APP_URL;
  if (!token || !secret || !base || !base.startsWith('https://')) throw new HttpError(503, 'Los pagos en línea aún no están disponibles.');
  return { token, secret, base: new URL(base).origin, live: process.env.MERCADOPAGO_MODE === 'live' };
}

export async function mercadoRequest(path: string, init: RequestInit = {}) {
  const { token } = paymentConfig();
  const response = await fetch(`https://api.mercadopago.com${path}`, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers } });
  if (!response.ok) throw new HttpError(502, 'Mercado Pago no está disponible. Puedes reintentar este mismo pedido.');
  return response.json();
}

export function validCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['www.mercadopago.com.mx', 'www.mercadopago.com', 'sandbox.mercadopago.com.mx', 'sandbox.mercadopago.com'].includes(url.hostname);
  } catch { return false; }
}
