'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password')), confirm = String(form.get('confirm'));
    try {
      if (password.length < 12) throw new Error('Usa al menos 12 caracteres.');
      if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw new Error('No pudimos actualizar la contraseña. Solicita un nuevo enlace de recuperación.');
      setDone(true);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  if (done) return <div className="max-w-md mx-auto px-4 py-12 space-y-4"><h1 className="text-3xl font-bold">Contraseña actualizada</h1><Link href="/cuenta" className="underline text-red-400">Ir a mi cuenta</Link></div>;
  return <div className="max-w-md mx-auto px-4 py-12 space-y-6"><h1 className="text-3xl font-bold">Nueva contraseña</h1>
    {message && <p role="alert" className="text-red-300">{message}</p>}
    <form onSubmit={submit} className="glass-panel p-6 rounded-2xl space-y-5">
      <label className="block">Nueva contraseña<input name="password" type="password" autoComplete="new-password" required minLength={12} className="block w-full p-3 rounded-lg bg-slate-900 border border-slate-600 mt-1" /></label>
      <label className="block">Confirmar contraseña<input name="confirm" type="password" autoComplete="new-password" required minLength={12} className="block w-full p-3 rounded-lg bg-slate-900 border border-slate-600 mt-1" /></label>
      <button disabled={busy} className="bg-red-600 rounded-xl p-3 font-bold disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
    </form></div>;
}
