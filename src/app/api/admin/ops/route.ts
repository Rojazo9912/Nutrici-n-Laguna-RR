import { NextResponse } from 'next/server';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { ACTIONS, adminDatabaseError } from '@/lib/admin-ops';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const staff = await staffUser();
    if (!staff || staff.role !== 'admin') throw new HttpError(403, 'No autorizado.');
    const body = await readBody(request) as Record<string, unknown>;
    const action = typeof body?.action === 'string' && Object.hasOwn(ACTIONS, body.action) ? ACTIONS[body.action] : null;
    if (!action) throw new HttpError(400, 'Acción desconocida.');
    const { error } = await serviceDatabase().rpc(action.rpc, action.params(body, staff.id));
    if (error) throw adminDatabaseError(error);
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
