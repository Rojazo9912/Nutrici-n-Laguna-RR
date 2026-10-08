'use client';
import { useMemo, useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product, RegulatoryStatus } from '@/types/database.types';
import { money } from '@/lib/commerce';
import { createProduct, type CreateProductState } from '@/app/actions/create-product';
import { PageHeader, Notice, EmptyState, StatusBadge, SearchBox, Tabs, Collapsible, useToast, useAdminRequest } from '@/components/AdminUi';

type Option = { id: string; name: string };
type Tab = 'pendiente' | 'aprobado' | 'rechazado' | 'todos';
const REVIEW_LABELS: Record<RegulatoryStatus, string> = { aprobado: 'Aprobar y publicar', rechazado: 'Rechazar', pendiente: 'Devolver a pendiente' };

function NewProductForm({ ready, brands, categories, onDone }: { ready: boolean; brands: Option[]; categories: Option[]; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, pending] = useActionState(async (previous: CreateProductState, form: FormData) => {
    const result = await createProduct(previous, form);
    if (result.success) { toast(result.error ? 'error' : 'ok', result.error ?? 'Producto creado como borrador. Ahora revísalo para publicarlo.'); router.refresh(); onDone(); }
    else if (result.error) toast('error', result.error);
    return result;
  }, {} as CreateProductState);
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => <label className="adm-label">{label}{props.required && <span aria-hidden className="text-red-400"> *</span>}<input name={name} {...props} className="adm-input mt-1" aria-invalid={!!state.errors?.[name]} />{hint && <span className="mt-1 block text-xs font-normal text-zinc-500">{hint}</span>}{state.errors?.[name] && <span role="alert" className="mt-1 block text-xs text-red-300">{state.errors[name]}</span>}</label>;
  return <section className="adm-card p-4 sm:p-5" aria-label="Nuevo producto">
    <h2 className="mb-1 text-lg font-bold">Nuevo producto</h2>
    <p className="mb-4 text-sm text-zinc-400">Se crea como borrador con revisión regulatoria pendiente; no se publica hasta que lo apruebes en la lista.</p>
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {field('name', 'Nombre', { required: true, maxLength: 200 })}{field('slug', 'Slug (URL)', { required: true, maxLength: 120, pattern: '[a-z0-9]+(-[a-z0-9]+)*', placeholder: 'proteina-whey-2kg' }, 'Minúsculas, números y guiones.')}
      {field('sku', 'SKU de la variante inicial', { required: true, maxLength: 64 })}{field('image', 'Imagen principal', { type: 'file', accept: 'image/jpeg,image/png,image/webp' }, 'JPG, PNG o WebP, máx. 3 MB.')}
      <label className="adm-label md:col-span-2">Descripción corta <span aria-hidden className="text-red-400">*</span><textarea name="description_short" required minLength={10} maxLength={500} rows={2} className="adm-input mt-1" />{state.errors?.description_short && <span role="alert" className="mt-1 block text-xs text-red-300">{state.errors.description_short}</span>}</label>
      <label className="adm-label md:col-span-2">Descripción larga<textarea name="description_long" maxLength={10000} rows={4} className="adm-input mt-1" /></label>
      <label className="adm-label">Marca<select name="brand_id" className="adm-input mt-1"><option value="">Sin marca</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <label className="adm-label">Categoría<select name="category_id" className="adm-input mt-1"><option value="">Sin categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {field('price_regular', 'Precio regular (MXN)', { type: 'number', step: '0.01', min: '0.01', required: true })}{field('price_promo', 'Precio promocional (MXN)', { type: 'number', step: '0.01', min: '0.01' })}
      {field('stock_minimum', 'Stock mínimo', { type: 'number', min: '0', defaultValue: 5 }, 'Genera una alerta en el tablero.')}{field('weight_grams', 'Peso (g)', { type: 'number', min: '0', defaultValue: 0 })}
      {field('dimensions_cm', 'Dimensiones (cm)', { placeholder: '20x10x10' })}<label className="flex items-center gap-2 self-center text-sm text-zinc-300"><input type="checkbox" name="is_consumable" defaultChecked className="h-4 w-4 accent-red-600" /> Consumible (exige lote y caducidad)</label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2"><button disabled={!ready || pending} className="adm-btn-primary">{pending ? 'Creando…' : 'Crear producto'}</button><button type="button" onClick={onDone} className="adm-btn-ghost">Cancelar</button></div>
    </form></section>;
}

export default function AdminProducts({ products, ready, reviews, brands, categories }: { products: Product[]; ready: boolean; brands: Option[]; categories: Option[]; reviews: { id: string; order_number: number; status: string; total: number }[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>('pendiente');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const { busy, run } = useAdminRequest();
  const counts = useMemo(() => ({ pendiente: products.filter(p => p.regulatory_status === 'pendiente').length, aprobado: products.filter(p => p.regulatory_status === 'aprobado').length, rechazado: products.filter(p => p.regulatory_status === 'rechazado').length }), [products]);
  const visible = products.filter(product => (tab === 'todos' || product.regulatory_status === tab) && (!query.trim() || product.name.toLowerCase().includes(query.trim().toLowerCase())));
  const review = (product: Product, status: RegulatoryStatus) => {
    if (status === 'aprobado' && !window.confirm(`¿Aprobar «${product.name}»? Quedará publicado en la tienda de inmediato.`)) return;
    void run(product.id, () => fetch(`/api/admin/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes: notes[product.id] || '' }) }), 'Revisión guardada con registro de auditoría.');
  };
  return <>
    <PageHeader title="Productos" description="Ningún producto se publica sin aprobación regulatoria. Cada revisión queda en la bitácora." actions={<button onClick={() => setCreating(!creating)} disabled={!ready} aria-expanded={creating} className="adm-btn-primary">{creating ? 'Cerrar formulario' : 'Nuevo producto'}</button>} />
    {!ready && <Notice>Falta aplicar la migración de seguridad. Las modificaciones están deshabilitadas.</Notice>}
    {creating && <NewProductForm ready={ready} brands={brands} categories={categories} onDone={() => setCreating(false)} />}
    {reviews.length > 0 && <Notice><p className="font-semibold">Pagos que requieren conciliación</p><p className="mb-2">Revisa el pago en Mercado Pago antes de enviar productos o reembolsar.</p><ul className="list-disc pl-5">{reviews.map(order => <li key={order.id}>Pedido #{order.order_number} · {order.status} · {money(order.total)}</li>)}</ul><Link href="/admin/pedidos" className="mt-2 inline-block underline">Ir a pedidos</Link></Notice>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'pendiente', label: 'Por revisar', count: counts.pendiente }, { id: 'aprobado', label: 'Aprobados', count: counts.aprobado }, { id: 'rechazado', label: 'Rechazados', count: counts.rechazado }, { id: 'todos', label: 'Todos', count: products.length }]} />
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar producto por nombre" />
    </div>
    {visible.length === 0 && <EmptyState>{products.length === 0 ? 'Aún no hay productos. Crea el primero con «Nuevo producto».' : 'Ningún producto coincide con este filtro.'}</EmptyState>}
    <div className="space-y-2">{visible.map(product => <Collapsible key={product.id} summary={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-semibold">{product.name}</span><StatusBadge status={product.regulatory_status} /><StatusBadge status={product.commercial_status} /><span className="text-zinc-400">{money(product.price_regular)}</span></span>}>
      <div className="mb-4 flex flex-wrap items-start gap-4">{product.images?.[0]?.image_url ? <img src={product.images[0].image_url} alt={product.images[0].alt_text || product.name} className="h-28 w-28 rounded-xl border border-zinc-700 bg-zinc-950 object-contain p-2" /> : <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-center text-xs text-zinc-500">Sin imagen</div>}<div><p className="mb-2 text-sm text-zinc-400">{product.description_short}</p><p className="text-xs text-zinc-500">{product.images?.length || 0} imagen(es) asociada(s)</p></div></div>
      <label className="adm-label">Motivo y referencia de la revisión <span aria-hidden className="text-red-400">*</span><textarea maxLength={2000} minLength={5} rows={3} value={notes[product.id] || ''} onChange={event => setNotes({ ...notes, [product.id]: event.target.value })} placeholder="Ej. Registro sanitario verificado, folio…" className="adm-input mt-1" /></label>
      <div className="mt-3 flex flex-wrap gap-2">{(['aprobado', 'rechazado', 'pendiente'] as const).filter(status => status !== product.regulatory_status).map(status => <button key={status} disabled={!ready || !!busy || (notes[product.id] || '').trim().length < 5} onClick={() => review(product, status)} className={status === 'aprobado' ? 'adm-btn-primary' : 'adm-btn-secondary'}>{busy === product.id ? 'Guardando…' : REVIEW_LABELS[status]}</button>)}</div>
      <p className="mt-2 text-xs text-zinc-500">Los botones se habilitan al escribir un motivo de al menos 5 caracteres.</p>
    </Collapsible>)}</div>
  </>;
}
