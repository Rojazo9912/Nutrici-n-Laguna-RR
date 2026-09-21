import { NextResponse } from 'next/server';
import { ownedOrder } from '@/lib/order-access';
import { errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await ownedOrder((await params).id);
    return NextResponse.json({ id: order.id, number: order.order_number, status: order.status, total: order.total, subtotal: order.subtotal, discount: order.discount, shipping: order.shipping_cost, review: order.payment_review_required, expiresAt: order.payment_expires_at }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
