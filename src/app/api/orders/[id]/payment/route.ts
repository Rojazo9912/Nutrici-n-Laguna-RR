import { NextResponse } from 'next/server';
import { ownedOrder } from '@/lib/order-access';
import { serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, HttpError, errorResponse } from '@/lib/http';
import { mercadoRequest, paymentConfig, validCheckoutUrl } from '@/lib/payments';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const config = paymentConfig();
    const order = await ownedOrder((await params).id);
    const expiresAt = Date.parse(order.payment_expires_at);
    if (!order.checkout_key || !Number.isFinite(expiresAt) || order.status !== 'pendiente' || order.payment_review_required || expiresAt <= Date.now()) throw new HttpError(409, 'Este pedido ya no admite pagos. Consulta su estado antes de crear otro.');
    if (order.checkout_url && validCheckoutUrl(order.checkout_url)) return NextResponse.json({ url: order.checkout_url });
    const db = serviceDatabase();
    const claimedAt = new Date().toISOString();
    const { data: claim, error } = await db.from('orders').update({ preference_claimed_at: claimedAt }).eq('id', order.id).is('checkout_url', null).or(`preference_claimed_at.is.null,preference_claimed_at.lt.${new Date(Date.now() - 60000).toISOString()}`).select('id');
    if (error || !claim?.length) throw new HttpError(409, 'Estamos preparando el pago. Reintenta en un momento.');
    const returnUrl = `${config.base}/pedido/${order.id}`;
    const preference = await mercadoRequest('/checkout/preferences', {
      method: 'POST', headers: { 'X-Idempotency-Key': order.id },
      body: JSON.stringify({
        items: [{ id: order.id, title: `Pedido ${order.order_number} · Nutrición Laguna RR`, quantity: 1, currency_id: 'MXN', unit_price: Number(order.total) }],
        payer: { email: order.customer_email }, external_reference: order.id,
        notification_url: `${config.base}/api/webhooks/pago?source_news=webhooks`,
        back_urls: { success: returnUrl, failure: returnUrl, pending: returnUrl }, auto_return: 'approved',
        expires: true, expiration_date_to: order.payment_expires_at, binary_mode: true,
        payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'bank_transfer' }, { id: 'atm' }] },
      }),
    });
    const checkoutUrl = config.live ? preference.init_point : preference.sandbox_init_point;
    if (!validCheckoutUrl(checkoutUrl) || typeof preference.id !== 'string') throw new HttpError(502, 'No se recibió un enlace de pago válido.');
    const saved = await db.from('orders').update({ preference_id: preference.id, checkout_url: checkoutUrl }).eq('id', order.id).eq('preference_claimed_at', claimedAt).is('checkout_url', null).select('id');
    if (saved.error || !saved.data?.length) throw new HttpError(503, 'No se pudo guardar el enlace. Reintenta este mismo pedido.');
    return NextResponse.json({ url: checkoutUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
