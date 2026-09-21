import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { money } from '@/lib/commerce';
export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const staff = await staffUser();
  if (!staff || staff.role !== 'admin') redirect('/cuenta');
  const db = serviceDatabase();
  const [profiles, orders] = await Promise.all([
    db.from('profiles').select('id,email,full_name,phone,created_at').eq('role', 'client').order('created_at', { ascending: false }).limit(500),
    db.from('orders').select('user_id,total,status').not('user_id', 'is', null).in('status', ['pagado', 'preparando', 'enviado', 'entregado']).limit(10000),
  ]);
  if (profiles.error || orders.error) throw new Error('No fue posible cargar los clientes');
  const totals = new Map<string, { count: number; total: number }>();
  for (const order of orders.data) { const entry = totals.get(order.user_id) ?? { count: 0, total: 0 }; entry.count++; entry.total += Number(order.total); totals.set(order.user_id, entry); }
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-4"><div className="flex items-center justify-between flex-wrap gap-3"><h1 className="text-3xl font-bold">Clientes registrados</h1><a href="/api/admin/export/orders" className="underline text-slate-300">Exportar pedidos (CSV)</a></div>
    <p className="text-sm text-slate-300">Contiene datos personales: úsalo solo para atender pedidos y solicitudes. Las compras como invitado no aparecen aquí.</p>
    {profiles.data.length === 0 && <p>Sin clientes registrados.</p>}
    <ul className="space-y-2">{profiles.data.map(profile => { const t = totals.get(profile.id); return <li key={profile.id} className="glass-panel rounded-lg p-3 text-sm"><strong>{profile.full_name || profile.email}</strong> · {profile.email}{profile.phone ? ` · ${profile.phone}` : ''}<br /><span className="text-slate-300">Alta {new Date(profile.created_at).toLocaleDateString('es-MX')} · {t ? `${t.count} pedidos · ${money(t.total)}` : 'sin compras pagadas'}</span></li>; })}</ul>
  </div>;
}
