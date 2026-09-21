import { NextResponse } from 'next/server';
import { verifyMercadoSignature } from '@/lib/payment-signature';
import { paymentConfig, mercadoRequest } from '@/lib/payments';
import { serviceDatabase } from '@/lib/supabase/server';
import { errorResponse, HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';

export async function POST(request: Request) {
  try {
    const config = paymentConfig();
    const query = new URL(request.url).searchParams;
    const id = query.get('data.id');
    if (!verifyMercadoSignature(request.headers.get('x-signature'), request.headers.get('x-request-id'), id, config.secret)) throw new HttpError(401, 'Firma inválida.');
    if (query.get('type') && query.get('type') !== 'payment') return NextResponse.json({ received: true });
    // The request body cannot choose an order, status or amount.
    const [payment, merchant] = await Promise.all([mercadoRequest(`/v1/payments/${encodeURIComponent(id!)}`), mercadoRequest('/users/me')]);
    if (String(payment.id) !== id || String(payment.collector_id) !== String(merchant.id) || payment.live_mode !== config.live || !UUID.test(payment.external_reference ?? '') || !Number.isFinite(payment.transaction_amount) || !Number.isFinite(Date.parse(payment.date_last_updated))) throw new HttpError(400, 'Pago no válido para esta tienda.');
    const { data, error } = await serviceDatabase().rpc('apply_verified_payment', { p_order: payment.external_reference, p_transaction: String(payment.id), p_status: payment.status, p_amount: payment.transaction_amount, p_currency: payment.currency_id, p_updated: payment.date_last_updated });
    if (error) throw new HttpError(503, 'No fue posible registrar la notificación.');
    return NextResponse.json({ received: true, result: data });
  } catch (error) { return errorResponse(error); }
}
