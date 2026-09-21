'use client';
import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product, RegulatoryStatus } from '@/types/database.types';
import { money } from '@/lib/commerce';
import { createProduct, type CreateProductState } from '@/app/actions/create-product';

type Option = { id: string; name: string };
const inputClass = 'block mt-1 w-full bg-slate-900 border border-slate-600 rounded p-2';

function NewProductForm({ ready, brands, categories }: { ready: boolean; brands: Option[]; categories: Option[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (previous: CreateProductState, form: FormData) => {
    const result = await createProduct(previous, form);
    if (result.success) router.refresh();
    return result;
  }, {} as CreateProductState);
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="block text-sm">{label}<input name={name} {...props} className={inputClass} />{state.errors?.[name] && <span role="alert" className="text-red-300">{state.errors[name]}</span>}</label>;
  return <details className="glass-panel rounded-xl p-5"><summary className="font-bold cursor-pointer">Nuevo producto</summary>
    <form action={action} className="grid gap-3 md:grid-cols-2 mt-4">
      {field('name', 'Nombre', { required: true, maxLength: 200 })}{field('slug', 'Slug (URL)', { required: true, maxLength: 120, pattern: '[a-z0-9]+(-[a-z0-9]+)*' })}
      {field('sku', 'SKU de la variante inicial', { required: true, maxLength: 64 })}{field('image', 'Imagen (JPG, PNG o WebP, máx. 3 MB)', { type: 'file', accept: 'image/jpeg,image/png,image/webp' })}
      <label className="block text-sm md:col-span-2">Descripción corta<textarea name="description_short" required minLength={10} maxLength={500} className={inputClass} />{state.errors?.description_short && <span role="alert" className="text-red-300">{state.errors.description_short}</span>}</label>
      <label className="block text-sm md:col-span-2">Descripción larga<textarea name="description_long" maxLength={10000} className={inputClass} /></label>
      <label className="block text-sm">Marca<select name="brand_id" className={inputClass}><option value="">Sin marca</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <label className="block text-sm">Categoría<select name="category_id" className={inputClass}><option value="">Sin categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {field('price_regular', 'Precio regular (MXN)', { type: 'number', step: '0.01', min: '0.01', required: true })}{field('price_promo', 'Precio promocional', { type: 'number', step: '0.01', min: '0.01' })}
      {field('stock_minimum', 'Stock mínimo', { type: 'number', min: '0', defaultValue: 5 })}{field('weight_grams', 'Peso (g)', { type: 'number', min: '0', defaultValue: 0 })}
      {field('dimensions_cm', 'Dimensiones (cm)')}<label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_consumable" defaultChecked /> Consumible (requiere lote y caducidad)</label>
      <div className="md:col-span-2 space-y-2"><p className="text-sm text-slate-300">Se crea como borrador con revisión regulatoria pendiente; no se publica hasta ser aprobado.</p>
        {state.error && <p role="alert" className="text-red-300">{state.error}</p>}{state.success && !state.error && <p role="status" className="text-emerald-300">Producto creado como borrador.</p>}
        <button disabled={!ready || pending} className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 disabled:opacity-40">{pending ? 'Creando…' : 'Crear producto'}</button></div>
    </form></details>;
}

export default function AdminProducts({ products, ready, reviews, brands, categories }: { products: Product[]; ready: boolean; brands: Option[]; categories: Option[]; reviews: { id: string; order_number: number; status: string; total: number }[] }) {
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
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-6"><div className="flex items-center justify-between flex-wrap gap-3"><h1 className="text-3xl font-bold">Administración del catálogo</h1><Link href="/admin/pedidos" className="underline text-slate-300">Pedidos</Link></div>
    <NewProductForm ready={ready} brands={brands} categories={categories} />
    {!ready && <p role="alert" className="text-amber-200">Falta aplicar la migración de seguridad. Las modificaciones están deshabilitadas.</p>}
    {message && <p role="status" className="text-amber-200">{message}</p>}
    {reviews.length > 0 && <section className="glass-panel rounded-xl p-5 space-y-2"><h2 className="font-bold text-amber-300">Pagos que requieren conciliación</h2><p className="text-sm">Revisa el pago en Mercado Pago antes de enviar productos o realizar reembolsos.</p>{reviews.map(order => <p key={order.id}>Pedido #{order.order_number} · {order.id} · {order.status} · {money(order.total)}</p>)}</section>}
    {products.map(product => <article key={product.id} className="glass-panel rounded-xl p-5 space-y-3"><h2 className="text-lg font-bold">{product.name}</h2><p>{product.regulatory_status} · {product.commercial_status} · {money(product.price_regular)}</p>
      <label className="block text-sm">Motivo y referencia de la revisión<textarea maxLength={2000} minLength={5} value={notes[product.id] || ''} onChange={event => setNotes({ ...notes, [product.id]: event.target.value })} className="block mt-1 w-full bg-slate-900 border border-slate-600 rounded p-3" /></label>
      <div className="flex gap-3 flex-wrap">{(['aprobado','rechazado','pendiente'] as const).map(status => <button key={status} disabled={!ready || !!busy || (notes[product.id] || '').trim().length < 5} onClick={() => void review(product.id,status)} className="bg-slate-800 border border-slate-600 rounded-lg p-2 disabled:opacity-40">{busy === product.id ? 'Guardando…' : status}</button>)}</div>
    </article>)}
  </div>;
}
