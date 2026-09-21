'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type Field = { name: string; label: string; type?: 'text' | 'number' | 'date' | 'email' | 'checkbox'; required?: boolean; textarea?: boolean; options?: { value: string; label: string }[]; defaultValue?: string | number | boolean; step?: string; min?: string; max?: number; placeholder?: string };
const input = 'block mt-1 w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm';

const LINKS: [string, string][] = [['/admin', 'Tablero'], ['/admin/productos', 'Catálogo'], ['/admin/taxonomia', 'Marcas y categorías'], ['/admin/inventario', 'Inventario'], ['/admin/pedidos', 'Pedidos'], ['/admin/cupones', 'Cupones'], ['/admin/contenido', 'Contenido'], ['/admin/arco', 'ARCO'], ['/admin/clientes', 'Clientes'], ['/admin/auditoria', 'Auditoría']];
export function AdminNav() {
  return <nav aria-label="Administración" className="max-w-6xl mx-auto px-4 pt-6 flex gap-4 flex-wrap text-sm">{LINKS.map(([href, label]) => <Link key={href} href={href} className="underline text-slate-300 hover:text-white">{label}</Link>)}</nav>;
}

/** Posts one validated action to /api/admin/ops; the server re-validates everything and enforces the admin role. */
export function OpsForm({ action, fields, submit, hidden = {}, compact = false, ready = true }: { action: string; fields: Field[]; submit: string; hidden?: Record<string, unknown>; compact?: boolean; ready?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: Record<string, unknown> = { action, ...hidden };
    for (const field of fields) body[field.name] = field.type === 'checkbox' ? data.get(field.name) === 'on' : String(data.get(field.name) ?? '');
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/ops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOk(true); setMessage('Guardado.'); router.refresh();
    } catch (error) { setOk(false); setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={onSubmit} className={compact ? 'flex gap-2 flex-wrap items-end' : 'grid gap-3 md:grid-cols-2'}>
    {fields.map(field => field.type === 'checkbox'
      ? <label key={field.name} className="flex items-center gap-2 text-sm"><input type="checkbox" name={field.name} defaultChecked={field.defaultValue === true} /> {field.label}</label>
      : <label key={field.name} className={`block text-sm ${field.textarea ? 'md:col-span-2' : ''}`}>{field.label}
        {field.options ? <select name={field.name} required={field.required} defaultValue={String(field.defaultValue ?? '')} className={input}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : field.textarea ? <textarea name={field.name} required={field.required} rows={12} defaultValue={String(field.defaultValue ?? '')} className={input} />
          : <input name={field.name} type={field.type ?? 'text'} required={field.required} step={field.step} min={field.min} max={field.max} placeholder={field.placeholder} defaultValue={field.defaultValue === undefined ? undefined : String(field.defaultValue)} className={input} />}</label>)}
    <div className="md:col-span-2 flex items-center gap-3"><button disabled={busy || !ready} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 disabled:opacity-40">{busy ? 'Guardando…' : submit}</button>
      {message && <span role={ok ? 'status' : 'alert'} className={ok ? 'text-emerald-300 text-sm' : 'text-red-300 text-sm'}>{message}</span>}</div>
  </form>;
}
