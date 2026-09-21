import { NextResponse } from 'next/server';
import { sessionDatabase } from '@/lib/supabase/server';
// Only same-site destinations from an allowlist: never redirect to a caller-supplied URL.
const DESTINATIONS = new Set(['/cuenta', '/cuenta/restablecer']);
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '';
  const destination = DESTINATIONS.has(next) ? next : '/cuenta';
  if (code) await (await sessionDatabase()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(destination, process.env.APP_URL || url.origin));
}
