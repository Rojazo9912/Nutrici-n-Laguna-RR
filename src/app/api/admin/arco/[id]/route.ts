import { NextResponse } from 'next/server';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    const staff = await staffUser();
    const { id } = await params;
    if (!staff || staff.role !== 'admin') throw new HttpError(403, 'No autorizado.');
    const body = await readBody(request) as { status?: string; notes?: string };
    if (!UUID.test(id) || !['en_proceso', 'resuelta', 'rechazada'].includes(body?.status || '') || (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 4000))) throw new HttpError(400, 'Solicitud inválida.');
    if (body.status !== 'en_proceso' && (body.notes || '').trim().length < 5) throw new HttpError(400, 'Indica cómo se resolvió la solicitud.');
    const { error } = await serviceDatabase().rpc('update_arco_request', { p_request: id, p_actor: staff.id, p_status: body.status, p_notes: body.notes ?? null });
    if (error) {
      const missing = error.message.includes('REQUEST_NOT_FOUND');
      throw new HttpError(missing ? 404 : 503, missing ? 'Solicitud no encontrada.' : 'No fue posible actualizar la solicitud.');
    }
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
