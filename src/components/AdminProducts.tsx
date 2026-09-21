'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, RegulatoryStatus } from '@/types/database.types';
import { money } from '@/lib/commerce';

export default function AdminProducts({ products, ready, reviews }: { products: Product[]; ready: boolean; reviews: { id: string; order_number: number; status: string; total: number }[] }) {
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function review(id: string, status: RegulatoryStatus) {
    setBusy(id); setMessage('');
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes: notes[id] || '' }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage('Revisión guardada con registro de auditoría.'); router.refresh();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(''); }
  }
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-6"><h1 className="text-3xl font-bold">Administración del catálogo</h1>
    {!ready && <p role="alert" className="text-amber-200">Falta aplicar la migración de seguridad. Las modificaciones están deshabilitadas.</p>}
    {message && <p role="status" className="text-amber-200">{message}</p>}
    {reviews.length > 0 && <section className="glass-panel rounded-xl p-5 space-y-2"><h2 className="font-bold text-amber-300">Pagos que requieren conciliación</h2><p className="text-sm">Revisa el pago en Mercado Pago antes de enviar productos o realizar reembolsos.</p>{reviews.map(order => <p key={order.id}>Pedido #{order.order_number} · {order.id} · {order.status} · {money(order.total)}</p>)}</section>}
    {products.map(product => <article key={product.id} className="glass-panel rounded-xl p-5 space-y-3"><h2 className="text-lg font-bold">{product.name}</h2><p>{product.regulatory_status} · {product.commercial_status} · {money(product.price_regular)}</p>
      <label className="block text-sm">Motivo y referencia de la revisión<textarea maxLength={2000} minLength={5} value={notes[product.id] || ''} onChange={event => setNotes({ ...notes, [product.id]: event.target.value })} className="block mt-1 w-full bg-slate-900 border border-slate-600 rounded p-3" /></label>
      <div className="flex gap-3 flex-wrap">{(['aprobado','rechazado','pendiente'] as const).map(status => <button key={status} disabled={!ready || !!busy || (notes[product.id] || '').trim().length < 5} onClick={() => void review(product.id,status)} className="bg-slate-800 border border-slate-600 rounded-lg p-2 disabled:opacity-40">{busy === product.id ? 'Guardando…' : status}</button>)}</div>
    </article>)}
  </div>;
}
