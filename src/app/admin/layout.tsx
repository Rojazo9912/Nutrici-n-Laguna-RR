import { redirect } from 'next/navigation';
import { AdminShell, type AdminBadges } from '@/components/AdminUi';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const db = serviceDatabase();
  const [profile, summary] = await Promise.all([db.from('profiles').select('email').eq('id', staff.id).maybeSingle(), db.rpc('admin_dashboard')]);
  // Counters are a convenience: if migrations 06/07 are pending, the menu simply shows no badges.
  const d = summary.data as { by_status?: Record<string, number>; payment_reviews?: number; open_arco?: number; pending_products?: number } | null;
  const badges: AdminBadges = { orders: Number(d?.by_status?.pagado ?? 0) + Number(d?.payment_reviews ?? 0), products: Number(d?.pending_products ?? 0), arco: Number(d?.open_arco ?? 0) };
  return <AdminShell badges={badges} email={profile.data?.email ?? ''} role={staff.role}>{children}</AdminShell>;
}
