import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { money } from '@/lib/commerce';
export const dynamic = 'force-dynamic';

type Dashboard = {
  sales_30d: number; orders_30d: number; by_status: Record<string, number>; customers: number; payment_reviews: number; open_arco: number; pending_products: number;
  low_stock: { product: string; sku: string; available: number; minimum: number }[];
  expiring_lots: { product: string; sku: string; lot_number: string; expiration_date: string; quantity: number }[];
  top_products: { name: string; units: number }[];
};
export default async function AdminHome() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const { data, error } = await serviceDatabase().rpc('admin_dashboard');
  const d = data as Dashboard | null;
  const orders = Number(d?.orders_30d ?? 0), sales = Number(d?.sales_30d ?? 0);
  const cards: [string, string][] = d ? [['Ventas (30 días)', money(sales)], ['Pedidos pagados (30 días)', String(orders)], ['Ticket promedio', orders ? money(sales / orders) : '—'], ['Clientes', String(d.customers)], ['Pagos por conciliar', String(d.payment_reviews)], ['Solicitudes ARCO abiertas', String(d.open_arco)], ['Productos pendientes de revisión', String(d.pending_products)]] : [];
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-8"><h1 className="text-3xl font-bold">Tablero</h1>
    {(error || !d) && <p role="alert" className="text-amber-200">Aplica las migraciones 06 y 07 para ver los indicadores.</p>}
    {d && <>
      <section aria-label="Indicadores" className="grid gap-4 grid-cols-2 md:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="glass-panel rounded-xl p-4"><p className="text-sm text-slate-300">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}</section>
      <section className="glass-panel rounded-xl p-5"><h2 className="font-bold mb-2">Pedidos por estado</h2><p className="text-sm">{Object.entries(d.by_status).map(([status, count]) => `${status}: ${count}`).join(' · ') || 'Sin pedidos'}</p></section>
      <section className="glass-panel rounded-xl p-5"><h2 className="font-bold mb-2">Más vendidos (30 días)</h2>{d.top_products.length ? <ul className="text-sm list-disc pl-5">{d.top_products.map(product => <li key={product.name}>{product.name} — {product.units} uds.</li>)}</ul> : <p className="text-sm">Sin ventas.</p>}</section>
      <section className="glass-panel rounded-xl p-5"><h2 className="font-bold mb-2">Stock bajo</h2>{d.low_stock.length ? <ul className="text-sm list-disc pl-5">{d.low_stock.map(item => <li key={item.sku}>{item.product} ({item.sku}): {item.available} disponibles, mínimo {item.minimum}</li>)}</ul> : <p className="text-sm">Sin alertas.</p>}</section>
      <section className="glass-panel rounded-xl p-5"><h2 className="font-bold mb-2">Lotes por caducar (60 días)</h2>{d.expiring_lots.length ? <ul className="text-sm list-disc pl-5">{d.expiring_lots.map(lot => <li key={`${lot.sku}-${lot.lot_number}`}>{lot.product} ({lot.sku}) lote {lot.lot_number}: {lot.quantity} uds. caducan {lot.expiration_date}</li>)}</ul> : <p className="text-sm">Sin lotes próximos a caducar.</p>}</section>
    </>}
  </div>;
}
