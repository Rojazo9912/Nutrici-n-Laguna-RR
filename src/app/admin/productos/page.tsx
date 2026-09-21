import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { PRODUCT_FIELDS } from '@/lib/catalog';
import AdminProducts from '@/components/AdminProducts';
import type { Product } from '@/types/database.types';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const db = serviceDatabase();
  const [products, ready] = await Promise.all([db.from('products').select(PRODUCT_FIELDS).order('name'), db.rpc('commerce_ready')]);
  if (products.error) throw new Error('No fue posible cargar los productos');
  const reviews = ready.data ? await db.from('orders').select('id,order_number,status,total').eq('payment_review_required',true).order('created_at',{ascending:false}).limit(100) : { data: [] };
  return <AdminProducts products={products.data as unknown as Product[]} ready={!ready.error && !!ready.data} reviews={reviews.data || []} />;
}
