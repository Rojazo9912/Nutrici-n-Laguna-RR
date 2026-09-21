'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { money } from '@/lib/commerce';
type OrderView = { id: string; number: number; status: string; total: number; subtotal: number; discount: number; shipping: number; review: boolean; expiresAt: string };
export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!active) return;
        setOrder(data); setError('');
        if (data.status === 'pendiente' && !data.review && ++polls < 60) timer = setTimeout(load, 10000);
      } catch (error) { if (active) setError((error as Error).message); }
    };
    void load();
    return () => { active = false; clearTimeout(timer); };
  }, [params.id]);
  async function pay() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/orders/${params.id}/payment`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
    <h1 className="text-3xl font-bold">Estado de tu pedido</h1>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {!order && !error && <p role="status">Consultando pedido…</p>}
    {order && <div className="glass-panel p-6 rounded-2xl space-y-4">
      <h2 className="text-xl font-bold">Pedido #{order.number}</h2><p role="status">{order.review ? 'Tu pago requiere revisión. No vuelvas a pagar este pedido.' : `Estado: ${order.status}`}</p>
      <p>Subtotal: {money(order.subtotal)}</p><p>Descuento: −{money(order.discount)}</p><p>Envío: {money(order.shipping)}</p><p className="text-xl font-bold">Total confirmado: {money(order.total)} MXN</p>
      {order.status === 'pendiente' && !order.review && <><p className="text-sm text-slate-400">El pago se confirma cuando recibimos la notificación de Mercado Pago. Si ya pagaste, espera la confirmación antes de volver a intentarlo.</p>{Date.parse(order.expiresAt) > Date.now() ? <button onClick={() => void pay()} disabled={busy} className="bg-red-600 rounded-xl p-3 font-bold disabled:opacity-40">{busy ? 'Abriendo Mercado Pago…' : 'Pagar en Mercado Pago'}</button> : <p>El plazo de pago terminó. El pedido pendiente se cancelará al liberar su reserva.</p>}</>}
      <button className="block underline text-slate-300" onClick={() => window.location.reload()}>Actualizar estado</button>
    </div>}
    <Link href="/productos" className="text-red-400 underline">Volver al catálogo</Link>
  </div>;
}
