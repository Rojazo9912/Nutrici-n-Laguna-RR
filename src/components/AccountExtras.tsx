'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

type Address = { id: string; full_name: string; address_line1: string; address_line2: string | null; city: string; state: string; postal_code: string; phone: string; is_default: boolean };
type Favorite = { id: string; name: string; slug: string };
const input = 'block w-full p-2 rounded bg-slate-900 border border-slate-600 mt-1 text-sm';

export default function AccountExtras() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [a, f] = await Promise.all([fetch('/api/account/addresses', { cache: 'no-store' }), fetch('/api/account/wishlist', { cache: 'no-store' })]);
    if (a.ok) setAddresses((await a.json()).addresses);
    if (f.ok) setFavorites((await f.json()).items);
  }, []);
  useEffect(() => { void load().catch(() => undefined); }, [load]);

  async function call(url: string, init: RequestInit) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(url, init);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      return true;
    } catch (error) { setMessage((error as Error).message); return false; }
    finally { setBusy(false); }
  }
  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = Object.fromEntries(['fullName', 'street', 'street2', 'city', 'state', 'postalCode', 'phone'].map(key => [key, String(data.get(key) ?? '')]));
    if (await call('/api/account/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, isDefault: data.get('isDefault') === 'on' }) })) form.reset();
  }
  return <>
    {message && <p role="alert" className="text-red-300">{message}</p>}
    <section className="glass-panel rounded-xl p-4 space-y-3"><h2 className="text-xl font-bold">Direcciones de envío</h2>
      {addresses.length === 0 && <p className="text-slate-400 text-sm">Aún no guardas direcciones.</p>}
      <ul className="space-y-2">{addresses.map(address => <li key={address.id} className="text-sm flex justify-between gap-3"><span>{address.full_name} — {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}, {address.city}, {address.state} {address.postal_code} · {address.phone}{address.is_default ? ' (principal)' : ''}</span><button disabled={busy} onClick={() => void call(`/api/account/addresses?id=${address.id}`, { method: 'DELETE' })} className="underline text-slate-300 shrink-0">Eliminar</button></li>)}</ul>
      <details><summary className="cursor-pointer underline text-sm">Agregar dirección</summary>
        <form onSubmit={addAddress} className="grid gap-2 md:grid-cols-2 pt-3">
          <label className="text-sm">Nombre completo<input name="fullName" required minLength={2} maxLength={200} autoComplete="name" className={input} /></label>
          <label className="text-sm">Teléfono (10 dígitos)<input name="phone" required pattern="\d{10}" autoComplete="tel-national" className={input} /></label>
          <label className="text-sm">Calle y número<input name="street" required minLength={3} maxLength={200} autoComplete="address-line1" className={input} /></label>
          <label className="text-sm">Colonia / referencias<input name="street2" maxLength={200} autoComplete="address-line2" className={input} /></label>
          <label className="text-sm">Ciudad<input name="city" required maxLength={100} autoComplete="address-level2" className={input} /></label>
          <label className="text-sm">Estado<input name="state" required maxLength={100} autoComplete="address-level1" className={input} /></label>
          <label className="text-sm">Código postal<input name="postalCode" required pattern="\d{5}" autoComplete="postal-code" className={input} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" /> Dirección principal</label>
          <button disabled={busy} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 md:col-span-2 disabled:opacity-40">Guardar dirección</button>
        </form></details></section>
    <section className="glass-panel rounded-xl p-4 space-y-2"><h2 className="text-xl font-bold">Favoritos</h2>
      {favorites.length === 0 && <p className="text-slate-400 text-sm">Marca productos con ♥ desde su ficha.</p>}
      <ul className="space-y-1">{favorites.map(item => <li key={item.id} className="text-sm flex justify-between gap-3"><Link href={`/productos/${item.slug}`} className="underline">{item.name}</Link><button disabled={busy} onClick={() => void call('/api/account/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: item.id, favorite: false }) })} className="underline text-slate-300">Quitar</button></li>)}</ul></section>
  </>;
}
