'use client';
import Link from 'next/link';
import { useStore, CatalogStatus } from '@/components/StoreProvider';
import { money, MAX_QUANTITY } from '@/lib/commerce';

export default function CartPage() {
  const store = useStore();
  const missing = store.lines.filter(line => !store.items.some(item => item.variantId === line.variantId));
  const invalid = missing.length > 0 || store.items.some(item => item.quantity > item.available);
  return <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
    <h1 className="text-3xl font-bold">Tu carrito</h1>
    <CatalogStatus />
    {!store.loading && !store.error && <>
      {!store.lines.length ? <p>Tu carrito está vacío. <Link className="text-red-400 underline" href="/productos">Explorar catálogo</Link></p> : <>
        {missing.map(line => <div className="glass-panel p-5 rounded-xl" key={line.variantId}><p>Este producto ya no está disponible.</p><button className="text-red-400 underline" onClick={() => store.remove(line.variantId)}>Quitar producto</button></div>)}
        {store.items.map(item => <article key={item.variantId} className="glass-panel rounded-2xl p-5 flex flex-wrap items-center gap-5">
          <img src={item.product.images?.[0]?.image_url || '/logo.jpg'} alt={item.product.name} className="w-20 h-20 rounded-lg object-contain" />
          <div className="flex-1 min-w-48"><Link href={`/productos/${item.product.slug}`} className="font-bold">{item.product.name}</Link><p className="text-sm text-slate-400">{item.variant.flavor} · {item.variant.size}</p><p>{money(item.price)} por unidad</p>{item.quantity > item.available && <p role="alert" className="text-amber-300">Solo quedan {item.available} unidades. Ajusta o quita este producto.</p>}</div>
          <label className="text-sm">Cantidad<input aria-label={`Cantidad de ${item.product.name}`} type="number" min="1" max={Math.min(MAX_QUANTITY, item.available)} value={item.quantity} onChange={event => store.update(item.variantId, Number(event.target.value))} className="block bg-slate-900 border border-slate-600 p-2 rounded w-20" /></label>
          <strong>{money(item.price * item.quantity)}</strong>
          <button className="text-red-400 underline" onClick={() => store.remove(item.variantId)}>Quitar</button>
        </article>)}
        <div className="glass-panel p-6 rounded-2xl space-y-3 max-w-md ml-auto">
          <p className="flex justify-between"><span>Subtotal</span><span>{money(store.subtotal)}</span></p>
          <p className="flex justify-between"><span>Envío estimado</span><span>{money(store.shipping)}</span></p>
          <p className="flex justify-between font-bold text-lg"><span>Total estimado</span><span>{money(store.subtotal + store.shipping)}</span></p>
          <p className="text-sm text-slate-400">Aplica tu cupón y confirma el total actualizado en el siguiente paso.</p>
          {!invalid && <Link className="block text-center rounded-xl bg-red-600 p-3 font-bold" href="/checkout">Continuar al checkout</Link>}
          {invalid && <p className="text-amber-300">Revisa los productos indicados para continuar.</p>}
        </div>
      </>}
    </>}
  </div>;
}
