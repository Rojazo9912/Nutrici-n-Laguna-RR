import Account from '@/components/Account';
import { currentUser, serviceDatabase } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  const user = await currentUser();
  if (!user) return <Account email={null} orders={[]} staff={false} />;
  const db = serviceDatabase();
  const [profile, orders] = await Promise.all([db.from('profiles').select('role').eq('id',user.id).maybeSingle(), db.from('orders').select('id,order_number,status,total').eq('user_id',user.id).order('created_at',{ ascending: false }).limit(50)]);
  if (orders.error || profile.error) throw new Error('No fue posible cargar la cuenta');
  return <Account email={user.email ?? ''} orders={orders.data ?? []} staff={['admin','compliance_officer'].includes(profile.data?.role ?? '')} />;
}
