import 'server-only';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function digest(value: string) { return createHash('sha256').update(value).digest('hex'); }
export function checkOrigin(request: Request) {
  const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin;
  if (request.headers.get('origin') !== expected) throw new HttpError(403, 'Origen no permitido.');
}
export async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Se requiere JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Solicitud vacía.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 32768) { await reader.cancel(); throw new HttpError(413, 'Solicitud demasiado grande.'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'JSON inválido.'); }
}
const databaseMessages: Record<string, string> = {
  INVALID_CART: 'Carrito inválido.', INVALID_QUANTITY: 'Cantidad inválida.', PRODUCT_UNAVAILABLE: 'Un producto ya no está disponible.',
  INSUFFICIENT_STOCK: 'No hay suficientes existencias. Actualiza el carrito.', INSUFFICIENT_LOTS: 'No hay suficientes unidades con lote vigente.',
  INVALID_COUPON: 'El cupón no está vigente o no aplica a esta compra.', INVALID_TOTAL: 'El total del pedido no es válido.',
  IDEMPOTENCY_CONFLICT: 'Este intento ya se usó con otros datos. Inicia un nuevo pedido.', PRIVACY_UNAVAILABLE: 'El aviso de privacidad cambió o no está publicado. Actualiza la página.', RATE_LIMIT: 'Has creado demasiados pedidos. Intenta más tarde.',
};
export function databaseError(error: { message: string }) {
  const key = Object.keys(databaseMessages).find(key => error.message.includes(key));
  return new HttpError(key === 'RATE_LIMIT' ? 429 : key ? 409 : 503, key ? databaseMessages[key] : 'El servicio de pedidos no está disponible. Intenta más tarde.');
}
export function errorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof HttpError ? error.message : 'No fue posible completar la solicitud.' }, { status: error instanceof HttpError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
