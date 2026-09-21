import { NextResponse } from 'next/server';
import { ownedOrder } from '@/lib/order-access';
import { errorResponse } from '@/lib/http';
import { serviceDatabase } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await ownedOrder((await params).id);
    const { data: shipment } = await serviceDatabase().from('shipments').select('carrier,tracking_number').eq('order_id', order.id).maybeSingle();
    return NextResponse.json({ id: order.id, number: order.order_number, status: order.status, total: order.total, subtotal: order.subtotal, discount: order.discount, shipping: order.shipping_cost, review: order.payment_review_required, expiresAt: order.payment_expires_at, carrier: shipment?.carrier ?? null, tracking: shipment?.tracking_number ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
