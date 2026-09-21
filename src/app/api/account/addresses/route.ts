import { NextResponse } from 'next/server';
import { currentUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';
export const dynamic = 'force-dynamic';
const MAX_ADDRESSES = 10;

async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Inicia sesión.');
  return user;
}
const text = (value: unknown, min: number, max: number) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length < min || trimmed.length > max) throw new HttpError(400, 'Revisa los datos de la dirección.');
  return trimmed;
};

export async function GET() {
  try {
    const user = await requireUser();
    const { data, error } = await serviceDatabase().from('addresses').select('id,full_name,address_line1,address_line2,city,state,postal_code,phone,is_default').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw new HttpError(503, 'No fue posible consultar tus direcciones.');
    return NextResponse.json({ addresses: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await readBody(request) as Record<string, unknown>;
    const postal = text(body?.postalCode, 5, 5), phone = text(body?.phone, 10, 10);
    if (!/^\d{5}$/.test(postal) || !/^\d{10}$/.test(phone)) throw new HttpError(400, 'Código postal de 5 dígitos y teléfono de 10 dígitos.');
    const db = serviceDatabase();
    const existing = await db.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if ((existing.count ?? 0) >= MAX_ADDRESSES) throw new HttpError(409, `Puedes guardar hasta ${MAX_ADDRESSES} direcciones.`);
    const isDefault = body.isDefault === true || existing.count === 0;
    if (isDefault) await db.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    const { error } = await db.from('addresses').insert({ user_id: user.id, full_name: text(body.fullName, 2, 200), address_line1: text(body.street, 3, 200), address_line2: typeof body.street2 === 'string' && body.street2.trim() ? text(body.street2, 1, 200) : null, city: text(body.city, 2, 100), state: text(body.state, 2, 100), postal_code: postal, phone, is_default: isDefault });
    if (error) throw new HttpError(503, 'No fue posible guardar la dirección.');
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const id = new URL(request.url).searchParams.get('id') ?? '';
    if (!UUID.test(id)) throw new HttpError(400, 'Dirección inválida.');
    const { error } = await serviceDatabase().from('addresses').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw new HttpError(503, 'No fue posible eliminar la dirección.');
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
