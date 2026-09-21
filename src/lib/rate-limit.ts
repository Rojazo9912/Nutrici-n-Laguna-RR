import 'server-only';
import { serviceDatabase } from '@/lib/supabase/server';
import { HttpError, digest } from '@/lib/http';

/** Behind a trusted proxy the rightmost X-Forwarded-For entry is the one the proxy appended; earlier ones are client-controlled. */
function clientAddress(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map(part => part.trim()).filter(Boolean);
  return request.headers.get('x-real-ip') || forwarded?.at(-1) || 'unknown';
}

/**
 * Fixed-window limit per scope and client. Fails open (with a log) if the counter is unavailable,
 * for example before migration 06 is applied, so the store keeps working.
 */
export async function enforceRateLimit(request: Request, scope: string, limit: number, windowSeconds: number, identity?: string) {
  const key = digest(`${scope}:${identity ?? clientAddress(request)}`);
  const { data, error } = await serviceDatabase().rpc('hit_rate_limit', { p_key: key, p_limit: limit, p_window: `${windowSeconds} seconds` });
  if (error) { console.error('Límite de tasa no disponible', { scope }); return; }
  if (data === false) throw new HttpError(429, 'Demasiadas solicitudes. Intenta más tarde.');
}
