import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return NextResponse.json(await getCatalog(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ error: 'El catálogo no está disponible. Intenta nuevamente.' }, { status: 503 }); }
}
