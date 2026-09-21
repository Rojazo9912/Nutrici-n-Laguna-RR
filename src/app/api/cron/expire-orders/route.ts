import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { serviceDatabase } from '@/lib/supabase/server';
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { data, error } = await serviceDatabase().rpc('expire_orders');
  return NextResponse.json(error ? { error: 'No fue posible liberar las reservas' } : { expired: data }, { status: error ? 503 : 200 });
}
