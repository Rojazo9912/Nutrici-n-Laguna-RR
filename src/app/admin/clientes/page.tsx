import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { money } from '@/lib/commerce';
import { PageHeader, FilterableList, Notice } from '@/components/AdminUi';
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
  const items = profiles.data.map(profile => { const t = totals.get(profile.id); return { id: profile.id, text: `${profile.full_name ?? ''} ${profile.email} ${profile.phone ?? ''}`, node:
    <div className="adm-card flex flex-wrap items-center justify-between gap-3 p-3 text-sm sm:p-4"><div className="min-w-0"><p className="truncate font-semibold">{profile.full_name || profile.email}</p><p className="truncate text-zinc-400">{profile.email}{profile.phone ? ` · ${profile.phone}` : ''}</p></div>
      <div className="text-right text-xs text-zinc-400"><p>Alta {new Date(profile.created_at).toLocaleDateString('es-MX')}</p><p className={t ? 'font-semibold text-zinc-200' : ''}>{t ? `${t.count} pedido${t.count === 1 ? '' : 's'} · ${money(t.total)}` : 'Sin compras pagadas'}</p></div></div> }; });
  return <>
    <PageHeader title="Clientes registrados" description={`${profiles.data.length} cuentas. Las compras como invitado no aparecen aquí.`} actions={<a href="/api/admin/export/orders" className="adm-btn-secondary">Exportar pedidos (CSV)</a>} />
    <Notice kind="info">Contiene datos personales: úsalos solo para atender pedidos y solicitudes de los titulares.</Notice>
    <FilterableList items={items} placeholder="Buscar por nombre, correo o teléfono" empty="Aún no hay clientes registrados." />
  </>;
}
