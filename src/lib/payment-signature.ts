import { createHmac, timingSafeEqual } from 'node:crypto';

// Mercado Pago signs the query data.id, request ID and timestamp, not the JSON body.
export function verifyMercadoSignature(signature: string | null, requestId: string | null, paymentId: string | null, secret: string, now = Date.now()) {
  if (!signature || !requestId || !paymentId || !secret || !/^[a-zA-Z0-9-]+$/.test(paymentId)) return false;
  const parts = signature.split(',').map(part => part.trim().split('='));
  const timestamp = parts.find(([key]) => key === 'ts')?.[1];
  const hashes = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !/^\d{10,13}$/.test(timestamp)) return false;
  const milliseconds = timestamp.length === 13 ? Number(timestamp) : Number(timestamp) * 1000;
  if (Math.abs(now - milliseconds) > 5 * 60 * 1000) return false;
  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  return hashes.some(hash => /^[a-f0-9]{64}$/i.test(hash) && timingSafeEqual(expected, Buffer.from(hash, 'hex')));
}
