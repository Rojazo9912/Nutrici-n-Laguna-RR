import { NextResponse } from 'next/server';
import { paymentConfig } from '@/lib/payments';
import { serviceDatabase } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    paymentConfig();
    const db = serviceDatabase();
    const [ready, policy] = await Promise.all([db.rpc('commerce_ready'), db.from('site_content').select('content').eq('key', 'privacidad').maybeSingle()]);
    if (ready.error || !ready.data || policy.error || !policy.data?.content?.body?.trim() || !policy.data.content.version) throw new Error();
    return NextResponse.json({ available: true, privacyVersion: policy.data.content.version }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ available: false, message: 'Los pagos en línea aún no están disponibles. Puedes seguir preparando tu carrito.' }, { headers: { 'Cache-Control': 'no-store' } }); }
}
