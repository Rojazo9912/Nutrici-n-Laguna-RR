import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import AdminOrders, { type AdminOrder } from '@/components/AdminOrders';
export const dynamic = 'force-dynamic';
export default async function AdminOrdersPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const db = serviceDatabase();
  const ready = await db.rpc('commerce_ready');
  const orders = ready.data
    ? await db.from('orders').select('id,order_number,status,total,customer_email,customer_phone,shipping_address,created_at,payment_review_required,order_items(product_name,variant_name,quantity),shipments(carrier,tracking_number)').neq('status', 'pendiente').order('created_at', { ascending: false }).limit(100)
    : { data: [], error: null };
  if (orders.error) throw new Error('No fue posible cargar los pedidos');
  return <AdminOrders orders={orders.data as unknown as AdminOrder[]} ready={!ready.error && !!ready.data} canEdit={staff.role === 'admin'} />;
}
