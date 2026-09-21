import { NextResponse } from 'next/server';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const staff = await staffUser();
    const { id } = await params;
    if (!staff) throw new HttpError(403,'No autorizado.');
    const body = await readBody(request) as { status?: string; notes?: string };
    if (!UUID.test(id) || !body || !['aprobado','rechazado','pendiente'].includes(body.status || '') || typeof body.notes !== 'string' || body.notes.trim().length < 5 || body.notes.length > 2000) throw new HttpError(400,'Indica un estado y un motivo de revisión válidos.');
    const { error } = await serviceDatabase().rpc('review_product', { p_product: id, p_actor: staff.id, p_status: body.status, p_notes: body.notes.trim() });
    if (error) throw new HttpError(503,'No fue posible guardar la revisión.');
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
