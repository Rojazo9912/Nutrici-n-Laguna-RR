import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser, serviceDatabase } from '@/lib/supabase/server';
import { validateCheckout, UUID } from '@/lib/commerce';
import { checkOrigin, readBody, HttpError, databaseError, digest, errorResponse } from '@/lib/http';
import { GUEST_COOKIE } from '@/lib/order-access';
import { paymentConfig } from '@/lib/payments';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    paymentConfig();
    await enforceRateLimit(request, 'checkout', 20, 3600);
    const key = request.headers.get('idempotency-key');
    if (!key || !UUID.test(key)) throw new HttpError(400, 'Falta el identificador del intento de compra.');
    const body = await readBody(request) as Record<string, unknown>;
    let input;
    try { input = validateCheckout(body); } catch (error) { throw new HttpError(400, (error as Error).message); }
    if (typeof body.privacyVersion !== 'string' || body.privacyVersion.length > 80) throw new HttpError(400, 'Actualiza el aviso de privacidad.');
    const jar = await cookies();
    let token = jar.get(GUEST_COOKIE)?.value;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      token = randomBytes(32).toString('hex');
      jar.set(GUEST_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:', path: '/', maxAge: 60 * 60 * 24 * 30 });
    }
    const user = await currentUser();
    const { data, error } = await serviceDatabase().rpc('create_checkout_order', { p_key: key, p_hash: digest(JSON.stringify({ ...input, privacyVersion: body.privacyVersion })), p_guest: digest(token), p_user: user?.id ?? null, p_items: input.items, p_customer: input.customer, p_coupon: input.coupon, p_privacy: body.privacyVersion });
    if (error) throw databaseError(error);
    return NextResponse.json({ id: data.id, total: data.total, status: data.status }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
