import { redirect } from 'next/navigation';
import Link from 'next/link';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { money } from '@/lib/commerce';
import { PageHeader, StatCard, StatusBadge, EmptyState, Notice } from '@/components/AdminUi';
export const dynamic = 'force-dynamic';

type Dashboard = {
  sales_30d: number; orders_30d: number; by_status: Record<string, number>; customers: number; payment_reviews: number; open_arco: number; pending_products: number;
  low_stock: { product: string; sku: string; available: number; minimum: number }[];
  expiring_lots: { product: string; sku: string; lot_number: string; expiration_date: string; quantity: number }[];
  top_products: { name: string; units: number }[];
};
const STATUS_ORDER = ['pagado', 'preparando', 'enviado', 'entregado', 'pendiente', 'cancelado', 'reembolsado'];

export default async function AdminHome() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const { data, error } = await serviceDatabase().rpc('admin_dashboard');
  const d = data as Dashboard | null;
  if (error || !d) return <><PageHeader title="Tablero" /><Notice>Aún no se pueden mostrar los indicadores: aplica las migraciones 06 y 07 (consulta el README) y recarga esta página.</Notice></>;
  const orders = Number(d.orders_30d), sales = Number(d.sales_30d);
  const tasks: { label: string; count: number; href: string }[] = [
    { label: 'Pedidos pagados por preparar', count: Number(d.by_status.pagado ?? 0), href: '/admin/pedidos' },
    { label: 'Pagos por conciliar', count: Number(d.payment_reviews), href: '/admin/pedidos' },
    { label: 'Productos pendientes de revisión regulatoria', count: Number(d.pending_products), href: '/admin/productos' },
    { label: 'Solicitudes ARCO abiertas', count: Number(d.open_arco), href: '/admin/arco' },
  ].filter(task => task.count > 0);
  return <>
    <PageHeader title="Tablero" description="Resumen de los últimos 30 días y tareas que requieren atención." />
    <section aria-label="Tareas pendientes" className="adm-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-300">Requiere tu atención</h2>
      {tasks.length ? <ul className="grid gap-2 sm:grid-cols-2">{tasks.map(task => <li key={task.label}><Link href={task.href} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm transition-colors hover:border-red-700"><span>{task.label}</span><span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold">{task.count}</span></Link></li>)}</ul> : <p className="text-sm text-zinc-400">Todo al día. No hay tareas pendientes.</p>}
    </section>
    <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="Ventas (30 días)" value={money(sales)} />
      <StatCard label="Pedidos pagados" value={String(orders)} hint="últimos 30 días" />
      <StatCard label="Ticket promedio" value={orders ? money(sales / orders) : '—'} />
      <StatCard label="Clientes registrados" value={String(d.customers)} href="/admin/clientes" />
    </section>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="adm-card p-4"><h2 className="mb-3 text-sm font-semibold text-zinc-300">Pedidos por estado</h2>
        {Object.keys(d.by_status).length ? <ul className="flex flex-wrap gap-2">{STATUS_ORDER.filter(status => d.by_status[status]).map(status => <li key={status} className="flex items-center gap-2"><StatusBadge status={status} /><span className="text-sm font-semibold">{d.by_status[status]}</span></li>)}</ul> : <EmptyState>Aún no hay pedidos.</EmptyState>}</section>
      <section className="adm-card p-4"><h2 className="mb-3 text-sm font-semibold text-zinc-300">Más vendidos (30 días)</h2>
        {d.top_products.length ? <ol className="space-y-2 text-sm">{d.top_products.map((product, index) => <li key={product.name} className="flex items-center gap-3"><span className="w-5 text-zinc-500">{index + 1}</span><span className="flex-1 truncate">{product.name}</span><span className="font-semibold">{product.units} uds.</span></li>)}</ol> : <p className="text-sm text-zinc-400">Sin ventas en el periodo.</p>}</section>
      <section className="adm-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-300">Stock bajo</h2><Link href="/admin/inventario" className="text-xs text-red-400 hover:underline">Ir a inventario</Link></div>
        {d.low_stock.length ? <ul className="space-y-2 text-sm">{d.low_stock.map(item => <li key={item.sku} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">{item.product} <span className="text-zinc-500">{item.sku}</span></span><span className={item.available <= 0 ? 'font-semibold text-red-400' : 'text-amber-300'}>{item.available} / mín. {item.minimum}</span></li>)}</ul> : <p className="text-sm text-zinc-400">Sin alertas de stock.</p>}</section>
      <section className="adm-card p-4"><h2 className="mb-3 text-sm font-semibold text-zinc-300">Lotes por caducar (60 días)</h2>
        {d.expiring_lots.length ? <ul className="space-y-2 text-sm">{d.expiring_lots.map(lot => <li key={`${lot.sku}-${lot.lot_number}`} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">{lot.product} <span className="text-zinc-500">lote {lot.lot_number}</span></span><span className="shrink-0 text-amber-300">{lot.quantity} uds. · {new Date(`${lot.expiration_date}T00:00:00`).toLocaleDateString('es-MX')}</span></li>)}</ul> : <p className="text-sm text-zinc-400">Ningún lote próximo a caducar.</p>}</section>
    </div>
  </>;
}
