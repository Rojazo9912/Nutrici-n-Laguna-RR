import 'server-only';
import { cookies } from 'next/headers';
import { currentUser, serviceDatabase } from '@/lib/supabase/server';
import { digest, HttpError } from '@/lib/http';
import { UUID } from '@/lib/commerce';

export const GUEST_COOKIE = 'laguna_checkout_session';
export async function ownedOrder(id: string) {
  if (!UUID.test(id)) throw new HttpError(404, 'Pedido no encontrado.');
  const { data: order, error } = await serviceDatabase().from('orders').select('*').eq('id', id).single();
  if (error || !order) throw new HttpError(404, 'Pedido no encontrado.');
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (token && digest(token) === order.guest_hash) return order;
  const user = await currentUser();
  if (user && user.id === order.user_id) return order;
  throw new HttpError(404, 'Pedido no encontrado.');
}
