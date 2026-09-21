'use client';
import { useMemo, useState } from 'react';
import { money } from '@/lib/commerce';
import { PageHeader, Notice, EmptyState, StatusBadge, SearchBox, Tabs, useAdminRequest } from '@/components/AdminUi';

type Shipment = { carrier: string | null; tracking_number: string | null };
export type AdminOrder = {
  id: string; order_number: number; status: string; total: number; customer_email: string; customer_phone: string; created_at: string; payment_review_required: boolean;
  shipping_address: { fullName?: string; full_name?: string; street?: string; address_line1?: string; city?: string; state?: string; postalCode?: string; postal_code?: string };
  order_items: { product_name: string; variant_name: string | null; quantity: number }[];
  shipments: Shipment | Shipment[] | null;
};
const NEXT: Record<string, { status: string; label: string; confirm?: string } | undefined> = {
  pagado: { status: 'preparando', label: 'Empezar a preparar' }, preparando: { status: 'enviado', label: 'Marcar como enviado' }, enviado: { status: 'entregado', label: 'Marcar como entregado', confirm: 'Esto notificará al cliente que su pedido fue entregado. ¿Continuar?' },
};
type Tab = 'todos' | 'pagado' | 'preparando' | 'enviado' | 'entregado' | 'revision';
const TAB_LABELS: Record<Exclude<Tab, 'todos' | 'revision'>, string> = { pagado: 'Por preparar', preparando: 'En preparación', enviado: 'Enviados', entregado: 'Entregados' };

export default function AdminOrders({ orders, ready, canEdit }: { orders: AdminOrder[]; ready: boolean; canEdit: boolean }) {
  const [carrier, setCarrier] = useState<Record<string, string>>({});
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>('pagado');
  const [query, setQuery] = useState('');
  const { busy, run } = useAdminRequest();
  const counts = useMemo(() => {
    const result: Record<string, number> = { pagado: 0, preparando: 0, enviado: 0, entregado: 0, revision: 0 };
    for (const order of orders) {
      if (order.payment_review_required) result.revision++;
      else if (order.status in result) result[order.status]++;
    }
    return result;
  }, [orders]);
  const visible = orders.filter(order => {
    if (tab === 'revision' ? !order.payment_review_required : tab !== 'todos' && (order.status !== tab || order.payment_review_required)) return false;
    const needle = query.trim().toLowerCase();
    return !needle || String(order.order_number) === needle.replace('#', '') || order.customer_email.toLowerCase().includes(needle) || (order.shipping_address.fullName || order.shipping_address.full_name || '').toLowerCase().includes(needle);
  });
  const advance = (order: AdminOrder, status: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    void run(order.id, () => fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, carrier: carrier[order.id], tracking: tracking[order.id] }) }), `Pedido #${order.order_number} actualizado.`);
  };
  return <>
    <PageHeader title="Pedidos" description="Prepara y envía los pedidos pagados. El cliente recibe un correo al enviarse y al entregarse." actions={<a href="/api/admin/export/orders" className="adm-btn-secondary">Exportar CSV</a>} />
    {!ready && <Notice>Falta aplicar la migración de seguridad; los pedidos no se pueden cargar.</Notice>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[...(Object.keys(TAB_LABELS) as (keyof typeof TAB_LABELS)[]).map(id => ({ id, label: TAB_LABELS[id], count: counts[id] })), ...(counts.revision ? [{ id: 'revision' as const, label: 'Pago por conciliar', count: counts.revision }] : []), { id: 'todos' as const, label: 'Todos' }]} />
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar por # de pedido, correo o nombre" />
    </div>
    {visible.length === 0 && <EmptyState>{orders.length === 0 ? 'Todavía no hay pedidos pagados.' : 'No hay pedidos en esta vista.'}</EmptyState>}
    <div className="space-y-3">{visible.map(order => {
      const next = NEXT[order.status];
      const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
      const address = order.shipping_address;
      const missingTracking = next?.status === 'enviado' && ((carrier[order.id] || '').trim().length < 2 || (tracking[order.id] || '').trim().length < 3);
      return <article key={order.id} className="adm-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Pedido #{order.order_number}</h2><div className="flex items-center gap-2"><StatusBadge status={order.status} />{order.payment_review_required && <StatusBadge status="rechazado" label="pago por conciliar" />}<span className="font-semibold">{money(order.total)}</span></div></div>
        <p className="mt-1 text-xs text-zinc-400">{new Date(order.created_at).toLocaleString('es-MX')}</p>
        {order.payment_review_required && <div className="mt-3"><Notice>Este pago requiere conciliación en Mercado Pago. No envíes productos ni reembolses hasta revisarlo.</Notice></div>}
        <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
          <div><p className="font-medium text-zinc-300">Cliente y envío</p><p>{address.fullName || address.full_name}</p><p className="text-zinc-400">{address.street || address.address_line1}, {address.city}, {address.state} {address.postalCode || address.postal_code}</p><p className="text-zinc-400">{order.customer_email} · {order.customer_phone}</p></div>
          <div><p className="font-medium text-zinc-300">Productos</p><ul className="text-zinc-300">{order.order_items.map((item, index) => <li key={index}>{item.quantity} × {item.product_name}{item.variant_name ? <span className="text-zinc-500"> ({item.variant_name})</span> : ''}</li>)}</ul>{shipment?.tracking_number && <p className="mt-2 text-zinc-400">Guía: {shipment.carrier} · <span className="select-all text-zinc-200">{shipment.tracking_number}</span></p>}</div>
        </div>
        {canEdit && next && !order.payment_review_required && <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-zinc-800 pt-4">
          {next.status === 'enviado' && <>
            <label className="adm-label w-44">Paquetería<input value={carrier[order.id] || ''} onChange={event => setCarrier({ ...carrier, [order.id]: event.target.value })} maxLength={80} placeholder="DHL, Estafeta…" className="adm-input mt-1" /></label>
            <label className="adm-label w-52">Número de guía<input value={tracking[order.id] || ''} onChange={event => setTracking({ ...tracking, [order.id]: event.target.value })} maxLength={80} className="adm-input mt-1" /></label></>}
          <button disabled={!ready || !!busy || missingTracking} onClick={() => advance(order, next.status, next.confirm)} className="adm-btn-primary">{busy === order.id ? 'Guardando…' : next.label}</button>
          {missingTracking && <span className="text-xs text-zinc-500">Indica paquetería y guía para continuar.</span>}
        </div>}
      </article>;
    })}</div>
  </>;
}
