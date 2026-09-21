import { NextResponse } from 'next/server';
import { currentUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
const TYPES = ['acceso', 'rectificacion', 'cancelacion', 'oposicion'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await enforceRateLimit(request, 'arco', 5, 3600);
    const body = await readBody(request) as Record<string, unknown>;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const details = typeof body?.details === 'string' ? body.details.trim() : '';
    if (name.length < 2 || name.length > 200 || !EMAIL.test(email) || email.length > 254 || details.length < 10 || details.length > 4000 || typeof body.type !== 'string' || !TYPES.includes(body.type)) throw new HttpError(400, 'Revisa el tipo de solicitud, tu nombre, correo y descripción.');
    const user = await currentUser();
    const { error } = await serviceDatabase().from('arco_requests').insert({ user_id: user?.id ?? null, requester_name: name, requester_email: email, request_type: body.type, details });
    if (error) throw new HttpError(503, 'No fue posible registrar tu solicitud. Intenta más tarde.');
    return NextResponse.json({ received: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
