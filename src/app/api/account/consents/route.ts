import { NextResponse } from 'next/server';
import { currentUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
export const dynamic = 'force-dynamic';
const TYPES = ['marketing'];
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, 'Inicia sesión.');
    const { data, error } = await serviceDatabase().from('privacy_consents').select('consent_type,is_granted,granted_at').eq('user_id', user.id).in('consent_type', TYPES).order('granted_at', { ascending: false });
    if (error) throw new HttpError(503, 'No fue posible consultar tus preferencias.');
    const current: Record<string, boolean> = {};
    for (const row of data) if (!(row.consent_type in current)) current[row.consent_type] = row.is_granted;
    return NextResponse.json({ marketing: current.marketing ?? false }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await currentUser();
    if (!user) throw new HttpError(401, 'Inicia sesión.');
    await enforceRateLimit(request, 'consent', 20, 3600, user.id);
    const body = await readBody(request) as { type?: string; granted?: unknown };
    if (!TYPES.includes(body?.type || '') || typeof body.granted !== 'boolean') throw new HttpError(400, 'Preferencia inválida.');
    const db = serviceDatabase();
    const policy = await db.from('site_content').select('content').eq('key', 'privacidad').maybeSingle();
    const { error } = await db.rpc('set_consent', { p_user: user.id, p_type: body.type, p_granted: body.granted, p_version: policy.data?.content?.version ?? '' });
    if (error) throw new HttpError(503, 'No fue posible guardar tu preferencia.');
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
