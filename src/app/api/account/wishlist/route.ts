import { NextResponse } from 'next/server';
import { currentUser, serviceDatabase } from '@/lib/supabase/server';
import { checkOrigin, readBody, errorResponse, HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';
export const dynamic = 'force-dynamic';

async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Inicia sesión para guardar favoritos.');
  return user;
}

export async function GET() {
  try {
    const user = await requireUser();
    // Only products that are still published are returned.
    const { data, error } = await serviceDatabase().from('wishlists').select('product_id,product:products!inner(id,name,slug,commercial_status,regulatory_status)').eq('user_id', user.id).eq('product.commercial_status', 'activo').eq('product.regulatory_status', 'aprobado').order('created_at', { ascending: false }).limit(100);
    if (error) throw new HttpError(503, 'No fue posible consultar tus favoritos.');
    const items = (data as unknown as { product: { id: string; name: string; slug: string } }[]).map(row => ({ id: row.product.id, name: row.product.name, slug: row.product.slug }));
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const body = await readBody(request) as { productId?: unknown; favorite?: unknown };
    if (typeof body?.productId !== 'string' || !UUID.test(body.productId) || typeof body.favorite !== 'boolean') throw new HttpError(400, 'Solicitud inválida.');
    const db = serviceDatabase();
    if (body.favorite) {
      const published = await db.from('products').select('id').eq('id', body.productId).eq('commercial_status', 'activo').eq('regulatory_status', 'aprobado').maybeSingle();
      if (!published.data) throw new HttpError(404, 'Producto no disponible.');
      const count = await db.from('wishlists').select('product_id', { count: 'exact', head: true }).eq('user_id', user.id);
      if ((count.count ?? 0) >= 100) throw new HttpError(409, 'Alcanzaste el máximo de favoritos.');
      const { error } = await db.from('wishlists').upsert({ user_id: user.id, product_id: body.productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
      if (error) throw new HttpError(503, 'No fue posible guardar el favorito.');
    } else {
      const { error } = await db.from('wishlists').delete().eq('user_id', user.id).eq('product_id', body.productId);
      if (error) throw new HttpError(503, 'No fue posible quitar el favorito.');
    }
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
