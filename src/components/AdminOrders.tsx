'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { money } from '@/lib/commerce';

type Shipment = { carrier: string | null; tracking_number: string | null };
export type AdminOrder = {
  id: string; order_number: number; status: string; total: number; customer_email: string; customer_phone: string; created_at: string; payment_review_required: boolean;
  shipping_address: { fullName?: string; full_name?: string; street?: string; address_line1?: string; city?: string; state?: string; postalCode?: string; postal_code?: string };
  order_items: { product_name: string; variant_name: string | null; quantity: number }[];
  shipments: Shipment | Shipment[] | null;
};
const NEXT: Record<string, { status: string; label: string } | undefined> = {
  pagado: { status: 'preparando', label: 'Marcar en preparación' }, preparando: { status: 'enviado', label: 'Marcar como enviado' }, enviado: { status: 'entregado', label: 'Marcar como entregado' },
};
const input = 'bg-slate-900 border border-slate-600 rounded p-2 text-sm';

export default function AdminOrders({ orders, ready, canEdit }: { orders: AdminOrder[]; ready: boolean; canEdit: boolean }) {
  const [carrier, setCarrier] = useState<Record<string, string>>({});
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function advance(order: AdminOrder, status: string) {
    setBusy(order.id); setMessage('');
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, carrier: carrier[order.id], tracking: tracking[order.id] }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(`Pedido #${order.order_number} actualizado.`); router.refresh();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(''); }
  }
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-3"><h1 className="text-3xl font-bold">Pedidos</h1><Link href="/admin/productos" className="underline text-slate-300">Catálogo</Link></div>
    {!ready && <p role="alert" className="text-amber-200">Falta aplicar la migración de seguridad.</p>}
    {message && <p role="status" className="text-amber-200">{message}</p>}
    {orders.length === 0 && <p>No hay pedidos pagados todavía.</p>}
    {orders.map(order => {
      const next = NEXT[order.status];
      const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
      const address = order.shipping_address;
      const missingTracking = next?.status === 'enviado' && ((carrier[order.id] || '').trim().length < 2 || (tracking[order.id] || '').trim().length < 3);
      return <article key={order.id} className="glass-panel rounded-xl p-5 space-y-2">
        <h2 className="text-lg font-bold">Pedido #{order.order_number} · {order.status} · {money(order.total)}</h2>
        {order.payment_review_required && <p role="alert" className="text-amber-300">Pago pendiente de conciliación: no enviar hasta revisarlo.</p>}
        <p className="text-sm text-slate-300">{new Date(order.created_at).toLocaleString('es-MX')} · {order.customer_email} · {order.customer_phone}</p>
        <p className="text-sm">{address.fullName || address.full_name} — {address.street || address.address_line1}, {address.city}, {address.state} {address.postalCode || address.postal_code}</p>
        <ul className="text-sm list-disc pl-5">{order.order_items.map((item, index) => <li key={index}>{item.quantity} × {item.product_name}{item.variant_name ? ` (${item.variant_name})` : ''}</li>)}</ul>
        {shipment?.tracking_number && <p className="text-sm">Guía: {shipment.carrier} {shipment.tracking_number}</p>}
        {canEdit && next && !order.payment_review_required && <div className="flex gap-2 flex-wrap items-end pt-2">
          {next.status === 'enviado' && <>
            <label className="text-sm">Paquetería<input value={carrier[order.id] || ''} onChange={event => setCarrier({ ...carrier, [order.id]: event.target.value })} maxLength={80} className={`${input} block`} /></label>
            <label className="text-sm">Número de guía<input value={tracking[order.id] || ''} onChange={event => setTracking({ ...tracking, [order.id]: event.target.value })} maxLength={80} className={`${input} block`} /></label></>}
          <button disabled={!ready || !!busy || missingTracking} onClick={() => void advance(order, next.status)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 disabled:opacity-40">{busy === order.id ? 'Guardando…' : next.label}</button>
        </div>}
      </article>;
    })}
  </div>;
}
