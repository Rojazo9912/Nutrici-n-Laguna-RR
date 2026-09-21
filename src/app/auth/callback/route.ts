import { NextResponse } from 'next/server';
import { sessionDatabase } from '@/lib/supabase/server';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) await (await sessionDatabase()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL('/cuenta', process.env.APP_URL || url.origin));
}
