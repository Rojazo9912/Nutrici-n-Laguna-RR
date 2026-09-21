'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';

const inputClass = 'block w-full p-3 rounded-lg bg-slate-900 border border-slate-600 mt-1';

export default function ArcoRequestPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/arco', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: form.get('type'), name: form.get('name'), email: form.get('email'), details: form.get('details') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDone(true);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  if (done) return <div className="max-w-2xl mx-auto px-4 py-12 space-y-4"><h1 className="text-3xl font-bold">Solicitud recibida</h1><p role="status">Registramos tu solicitud. La atenderemos y te responderemos al correo que indicaste.</p><Link href="/derechos-arco" className="underline text-red-400">Volver a derechos ARCO</Link></div>;
  return <div className="max-w-2xl mx-auto px-4 py-12 space-y-6"><h1 className="text-3xl font-bold">Solicitud de derechos ARCO</h1>
    <p className="text-slate-300">Acceso, rectificación, cancelación u oposición sobre tus datos personales. Consulta antes el <Link href="/privacidad" className="underline">aviso de privacidad</Link>.</p>
    {message && <p role="alert" className="text-red-300">{message}</p>}
    <form onSubmit={submit} className="glass-panel p-6 rounded-2xl space-y-5">
      <label className="block">Derecho que deseas ejercer<select name="type" required className={inputClass}><option value="acceso">Acceso</option><option value="rectificacion">Rectificación</option><option value="cancelacion">Cancelación</option><option value="oposicion">Oposición</option></select></label>
      <label className="block">Nombre completo<input name="name" required minLength={2} maxLength={200} autoComplete="name" className={inputClass} /></label>
      <label className="block">Correo de contacto<input name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} /></label>
      <label className="block">Descripción de tu solicitud<textarea name="details" required minLength={10} maxLength={4000} rows={6} className={inputClass} /></label>
      <p className="text-sm text-slate-400">Podemos pedirte información adicional para verificar tu identidad antes de atender la solicitud.</p>
      <button disabled={busy} className="bg-red-600 rounded-xl p-3 font-bold disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar solicitud'}</button>
    </form></div>;
}
