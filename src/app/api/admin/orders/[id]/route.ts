import { NextResponse } from 'next/server';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';
import { sendOrderEmail } from '@/lib/email';
const messages: Record<string, [number, string]> = {
  INVALID_TRANSITION: [409, 'El pedido no puede pasar a ese estado desde el actual.'], PAYMENT_REVIEW: [409, 'El pago requiere conciliación antes de enviar.'],
  TRACKING_REQUIRED: [400, 'Indica paquetería y número de guía.'], ORDER_NOT_FOUND: [404, 'Pedido no encontrado.'], FORBIDDEN: [403, 'No autorizado.'],
};
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const staff = await staffUser();
    const { id } = await params;
    if (!staff || staff.role !== 'admin') throw new HttpError(403, 'No autorizado.');
    const body = await readBody(request) as { status?: string; carrier?: string; tracking?: string };
    if (!UUID.test(id) || !body || !['preparando', 'enviado', 'entregado'].includes(body.status || '')) throw new HttpError(400, 'Estado inválido.');
    const carrier = typeof body.carrier === 'string' ? body.carrier.trim().slice(0, 80) : null;
    const tracking = typeof body.tracking === 'string' ? body.tracking.trim().slice(0, 80) : null;
    const { error } = await serviceDatabase().rpc('advance_order', { p_order: id, p_actor: staff.id, p_status: body.status, p_carrier: carrier, p_tracking: tracking });
    if (error) {
      const known = Object.entries(messages).find(([key]) => error.message.includes(key));
      throw known ? new HttpError(known[1][0], known[1][1]) : new HttpError(503, 'No fue posible actualizar el pedido.');
    }
    if (body.status === 'enviado' || body.status === 'entregado') await sendOrderEmail(id, body.status === 'enviado' ? 'shipped' : 'delivered');
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
