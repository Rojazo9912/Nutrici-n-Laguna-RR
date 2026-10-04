'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore, CatalogStatus } from '@/components/StoreProvider';
import { money } from '@/lib/commerce';

type Quote = { subtotal: number; discount: number; shipping: number; total: number; items: { name: string; quantity: number; price: number }[] };
const fields = [ ['fullName','Nombre completo','text'], ['email','Correo electrónico','email'], ['phone','Teléfono','tel'], ['street','Calle, número y colonia','text'], ['city','Ciudad','text'], ['state','Estado','text'], ['postalCode','Código postal','text'] ] as const;

export default function CheckoutPage() {
  const store = useStore();
  const router = useRouter();
  const [customer, setCustomer] = useState({ fullName: '', email: '', phone: '', street: '', city: '', state: '', postalCode: '' });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [config, setConfig] = useState<{ available: boolean; privacyVersion?: string; message?: string } | null>(null);
  const [coupon, setCoupon] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quotedCart, setQuotedCart] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const fingerprint = JSON.stringify({ items: store.lines, coupon: coupon.trim().toUpperCase() });
  const quoteValid = quotedCart === fingerprint && quote !== null;
  useEffect(() => {
    fetch('/api/checkout', { cache: 'no-store' }).then(response => response.json()).then(setConfig).catch(() => setConfig({ available: false, message: 'No se pudo comprobar la disponibilidad de pagos.' }));
  }, []);
  async function getQuote() {
    setBusy(true); setError(''); setQuote(null);
    try {
      const response = await fetch('/api/checkout/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: fingerprint });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setQuote(data); setQuotedCart(fingerprint);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !privacyConsent || !quoteValid || !config?.available) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const payload = { items: store.lines, coupon, customer, privacyConsent, privacyVersion: config.privacyVersion };
      const bytes = new TextEncoder().encode(JSON.stringify(payload));
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
      if (!attempt.current) {
        try { attempt.current = JSON.parse(sessionStorage.getItem('laguna-checkout-attempt') || 'null'); } catch { /* Ignore invalid storage. */ }
      }
      if (!attempt.current || attempt.current.fingerprint !== hash) attempt.current = { fingerprint: hash, key: crypto.randomUUID() };
      try { sessionStorage.setItem('laguna-checkout-attempt', JSON.stringify(attempt.current)); } catch { /* In-memory retry remains safe. */ }
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.key }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      // The order page shows the authoritative total before the user leaves for payment.
      try { sessionStorage.removeItem('laguna-checkout-attempt'); } catch { /* No personal data is stored. */ }
      attempt.current = null;
      store.clear();
      router.push(`/pedido/${result.id}`);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); submitting.current = false; }
  }
  return <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
    <h1 className="text-3xl font-bold">Finalizar compra</h1><CatalogStatus />
    {!config && <p role="status">Comprobando disponibilidad de pagos…</p>}
    {config && !config.available && <p role="status" className="rounded-xl bg-amber-950 p-5 text-amber-200">{config.message}</p>}
    {!store.loading && !store.lines.length ? <Link href="/productos" className="underline">Tu carrito está vacío. Explorar catálogo.</Link> : <form onSubmit={submit} aria-busy={busy} className="grid gap-6 md:grid-cols-2">
      <fieldset disabled={busy || !config?.available} className="glass-panel rounded-2xl p-6 space-y-4 disabled:opacity-60">
        <legend className="font-bold">Datos de envío</legend>
        {fields.map(([key,label,type]) => <label key={key} className="block text-sm">{label}<input name={key} required type={type} maxLength={key === 'postalCode' ? 5 : key === 'email' ? 254 : key === 'street' ? 250 : key === 'phone' ? 20 : 120} pattern={key === 'postalCode' ? '[0-9]{5}' : undefined} autoComplete={{ fullName: 'name', email: 'email', phone: 'tel', street: 'street-address', city: 'address-level2', state: 'address-level1', postalCode: 'postal-code' }[key]} value={customer[key]} onChange={event => setCustomer({ ...customer, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-900 p-3" /></label>)}
        <label className="flex gap-3 text-sm"><input type="checkbox" required checked={privacyConsent} onChange={event => setPrivacyConsent(event.target.checked)} /><span>Acepto el <Link href="/privacidad" target="_blank" className="text-red-400 underline">aviso de privacidad</Link> para gestionar mi pedido.</span></label>
      </fieldset>
      <div className="glass-panel p-6 rounded-2xl space-y-4 h-fit">
        <h2 className="font-bold">Resumen de compra</h2>
        {store.items.map(item => <p key={item.variantId} className="text-sm">{item.quantity} × {item.product.name} · {money(item.price * item.quantity)}</p>)}
        <label className="block text-sm">Cupón opcional<input value={coupon} maxLength={40} onChange={event => setCoupon(event.target.value)} disabled={busy} className="mt-1 block w-full bg-slate-900 border border-slate-600 rounded-lg p-3 uppercase" /></label>
        <button type="button" disabled={busy || !store.lines.length || !config?.available} onClick={() => void getQuote()} className="border border-slate-500 rounded-xl p-3 w-full disabled:opacity-40">{busy ? 'Procesando…' : 'Verificar existencias y total'}</button>
        {quoteValid && <div aria-live="polite" className="space-y-2 text-sm"><p>Subtotal: {money(quote.subtotal)}</p><p>Descuento: −{money(quote.discount)}</p><p>Envío: {money(quote.shipping)}</p><p className="text-xl font-bold">Total: {money(quote.total)} MXN</p></div>}
        {!quoteValid && <p className="text-sm text-slate-400">Verifica el total antes de confirmar. Los precios y existencias se revisan nuevamente al crear el pedido.</p>}
        <p className="text-sm text-slate-400">Paga con tarjeta en Mercado Pago. Tendrás 30 minutos para completar el pago.</p>
        {error && <p role="alert" aria-live="assertive" className="text-red-300">{error}</p>}
        <button disabled={busy || !quoteValid || !privacyConsent || !config?.available || store.loading || !!store.error} className="bg-red-600 rounded-xl p-3 w-full font-bold disabled:opacity-40">Confirmar pedido</button>
      </div>
    </form>}
  </div>;
}
