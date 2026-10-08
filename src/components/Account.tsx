'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { money } from '@/lib/commerce';
import AccountExtras from '@/components/AccountExtras';

export default function Account({ email, orders, staff }: { email: string | null; orders: { id: string; order_number: number; status: string; total: number }[]; staff: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const publicOrigin = () => (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const data = new FormData(event.currentTarget);
    try {
      const client = createClient();
      const credentials = { email: String(data.get('email')), password: String(data.get('password')) };
      const result = mode === 'login' ? await client.auth.signInWithPassword(credentials) : await client.auth.signUp({ ...credentials, options: { emailRedirectTo: `${publicOrigin()}/auth/callback` } });
      if (result.error) throw new Error(mode === 'login' ? 'No pudimos iniciar sesión. Revisa tus datos.' : 'No pudimos crear la cuenta. Verifica el correo y la contraseña.');
      if (mode === 'signup' && !result.data.session) setMessage('Revisa tu correo para confirmar tu cuenta.');
      else { router.refresh(); }
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  const [marketing, setMarketing] = useState<boolean | null>(null);
  useEffect(() => {
    if (!email) return;
    let active = true;
    fetch('/api/account/consents', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(data => { if (active && data) setMarketing(!!data.marketing); }).catch(() => undefined);
    return () => { active = false; };
  }, [email]);
  async function toggleMarketing(granted: boolean) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/consents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'marketing', granted }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMarketing(granted); setMessage(granted ? 'Aceptaste recibir comunicaciones comerciales.' : 'Revocaste las comunicaciones comerciales.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  async function recover(form: HTMLFormElement | null) {
    const address = String(new FormData(form ?? undefined).get('email') ?? '').trim();
    if (!address) { setMessage('Escribe tu correo y vuelve a pulsar «Olvidé mi contraseña».'); return; }
    setBusy(true); setMessage('');
    try { await createClient().auth.resetPasswordForEmail(address, { redirectTo: `${publicOrigin()}/auth/callback?next=/cuenta/restablecer` }); }
    catch { /* The same neutral message is shown either way so accounts cannot be enumerated. */ }
    setMessage('Si el correo tiene una cuenta, enviamos un enlace para restablecer la contraseña.'); setBusy(false);
  }
  async function logout() {
    setBusy(true);
    try { const { error } = await createClient().auth.signOut(); if (error) throw error; router.refresh(); }
    catch { setMessage('No se pudo cerrar la sesión. Intenta nuevamente.'); }
    finally { setBusy(false); }
  }
  return <div className="max-w-2xl mx-auto px-4 py-10 space-y-6"><h1 className="text-3xl font-bold">Mi cuenta</h1>
    {message && <p role="status" className="text-amber-200">{message}</p>}
    {email ? <>
      <p>{email}</p><button disabled={busy} onClick={() => void logout()} className="underline">Cerrar sesión</button>
      {staff && <Link href="/admin/productos" className="block text-red-400 underline">Administrar catálogo</Link>}
      {staff && <><Link href="/admin/pedidos" className="block text-red-400 underline">Administrar pedidos</Link><Link href="/admin/arco" className="block text-red-400 underline">Solicitudes ARCO</Link></>}
      <section className="glass-panel rounded-xl p-4 space-y-2"><h2 className="text-xl font-bold">Privacidad</h2>
        <label className="flex items-center gap-2"><input type="checkbox" checked={marketing === true} disabled={busy || marketing === null} onChange={event => void toggleMarketing(event.target.checked)} /> Acepto recibir promociones y comunicaciones comerciales (puedes revocarlo cuando quieras)</label>
        <Link href="/derechos-arco/solicitud" className="block underline text-slate-300">Ejercer mis derechos ARCO</Link></section>
      <AccountExtras />
      <h2 className="text-xl font-bold">Mis pedidos</h2>
      {!orders.length && <p className="text-slate-400">Todavía no tienes pedidos asociados a esta cuenta.</p>}
      {orders.map(order => <Link key={order.id} href={`/pedido/${order.id}`} className="block glass-panel rounded-xl p-4">#{order.order_number} · {order.status} · {money(order.total)}</Link>)}
    </> : <form onSubmit={submit} className="glass-panel p-6 rounded-2xl space-y-5">
      <h2 className="font-bold">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
      <label className="block">Correo<input name="email" type="email" autoComplete="email" required className="block w-full p-3 rounded-lg bg-slate-900 border border-slate-600 mt-1" /></label>
      <label className="block">Contraseña<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'signup' ? 12 : 1} className="block w-full p-3 rounded-lg bg-slate-900 border border-slate-600 mt-1" /></label>
      <button disabled={busy} className="bg-red-600 rounded-xl p-3 font-bold disabled:opacity-50">{busy ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      {mode === 'login' && <button type="button" disabled={busy} className="block underline text-slate-300" onClick={event => void recover(event.currentTarget.form)}>Olvidé mi contraseña</button>}
      <button type="button" disabled={busy} className="block underline text-slate-300" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'Crear una cuenta' : 'Ya tengo cuenta'}</button>
    </form>}
  </div>;
}
