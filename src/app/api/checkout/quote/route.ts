import { NextResponse } from 'next/server';
import { serviceDatabase } from '@/lib/supabase/server';
import { validateItems } from '@/lib/commerce';
import { checkOrigin, readBody, HttpError, databaseError, errorResponse } from '@/lib/http';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await readBody(request) as { items?: unknown; coupon?: unknown };
    let input;
    try { input = validateItems(body?.items, body?.coupon); } catch (error) { throw new HttpError(400, (error as Error).message); }
    const { data, error } = await serviceDatabase().rpc('quote_order', { p_items: input.items, p_coupon: input.coupon });
    if (error) throw databaseError(error);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
