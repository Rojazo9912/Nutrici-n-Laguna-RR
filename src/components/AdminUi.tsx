'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Boxes, ExternalLink, FileText, Layers, LayoutDashboard, Menu, Package, ScrollText, ShieldCheck, ShoppingBag, Ticket, Users, X, CheckCircle2, AlertCircle } from 'lucide-react';

/* ------------------------------------------------------------------ Toasts */
type Toast = { id: number; kind: 'ok' | 'error'; text: string };
const ToastContext = createContext<(kind: Toast['kind'], text: string) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), kind === 'error' ? 8000 : 4000);
  }, []);
  return <ToastContext.Provider value={push}>{children}
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map(toast => <div key={toast.id} role={toast.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${toast.kind === 'error' ? 'border-red-800 bg-red-950 text-red-100' : 'border-emerald-800 bg-emerald-950 text-emerald-100'}`}>
        {toast.kind === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}<span>{toast.text}</span></div>)}
    </div></ToastContext.Provider>;
}

/* -------------------------------------------------------------- Navigation */
export type AdminBadges = { orders?: number; products?: number; arco?: number };
const GROUPS: { title: string; items: { href: string; label: string; icon: typeof Package; badge?: keyof AdminBadges }[] }[] = [
  { title: 'Operación', items: [{ href: '/admin', label: 'Tablero', icon: LayoutDashboard }, { href: '/admin/pedidos', label: 'Pedidos', icon: Package, badge: 'orders' }, { href: '/admin/inventario', label: 'Inventario', icon: Boxes }] },
  { title: 'Catálogo', items: [{ href: '/admin/productos', label: 'Productos', icon: ShoppingBag, badge: 'products' }, { href: '/admin/taxonomia', label: 'Marcas y categorías', icon: Layers }, { href: '/admin/cupones', label: 'Cupones', icon: Ticket }] },
  { title: 'Clientes y cumplimiento', items: [{ href: '/admin/clientes', label: 'Clientes', icon: Users }, { href: '/admin/arco', label: 'Solicitudes ARCO', icon: ShieldCheck, badge: 'arco' }, { href: '/admin/contenido', label: 'Contenido y avisos', icon: FileText }, { href: '/admin/auditoria', label: 'Auditoría', icon: ScrollText }] },
];

export function AdminShell({ children, badges, email, role }: { children: ReactNode; badges: AdminBadges; email: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
  const nav = <nav aria-label="Administración" className="space-y-6">
    {GROUPS.map(group => <div key={group.title}><p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{group.title}</p>
      <ul className="space-y-0.5">{group.items.map(item => {
        const Icon = item.icon; const count = item.badge ? badges[item.badge] ?? 0 : 0; const current = active(item.href);
        return <li key={item.href}><Link href={item.href} aria-current={current ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${current ? 'bg-red-600/15 font-semibold text-red-300' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden /><span className="flex-1">{item.label}</span>
          {count > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${count} pendientes`}>{count}</span>}</Link></li>;
      })}</ul></div>)}
  </nav>;
  const footer = <div className="space-y-2 border-t border-zinc-800 pt-4 text-xs text-zinc-400">
    <p className="truncate" title={email}>{email}</p><p>Rol: {role === 'admin' ? 'Administrador' : 'Cumplimiento (solo lectura)'}</p>
    <Link href="/productos" className="inline-flex items-center gap-1 text-zinc-300 hover:text-white"><ExternalLink className="h-3 w-3" aria-hidden /> Ver la tienda</Link></div>;
  return <ToastProvider><div className="min-h-screen bg-zinc-950 lg:flex">
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
      <Link href="/admin" className="font-bold">Panel · Laguna RR</Link>
      <button type="button" aria-expanded={open} aria-controls="admin-drawer" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)} className="adm-btn-ghost">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    </header>
    {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
    <aside id="admin-drawer" className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4 pt-16 transition-transform lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0 lg:pt-6 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <Link href="/admin" className="hidden px-3 text-lg font-black tracking-tight lg:block">PANEL <span className="text-red-500">LAGUNA RR</span></Link>
      <div className="flex-1">{nav}</div>{footer}
    </aside>
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-6xl space-y-6">{children}</div></main>
  </div></ToastProvider>;
}

/* -------------------------------------------------------------- Primitives */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>;
}
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="adm-card border-dashed p-8 text-center text-sm text-zinc-400">{children}</div>;
}
export function Notice({ kind = 'warning', children }: { kind?: 'warning' | 'error' | 'info'; children: ReactNode }) {
  const tone = { warning: 'border-amber-800/60 bg-amber-950/40 text-amber-200', error: 'border-red-800/60 bg-red-950/40 text-red-200', info: 'border-zinc-700 bg-zinc-900 text-zinc-300' }[kind];
  return <div role={kind === 'info' ? 'note' : 'alert'} className={`rounded-lg border px-4 py-3 text-sm ${tone}`}>{children}</div>;
}
const TONES: Record<string, string> = {
  pagado: 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300', preparando: 'border-amber-700/60 bg-amber-900/30 text-amber-300', enviado: 'border-sky-700/60 bg-sky-900/30 text-sky-300', entregado: 'border-zinc-600 bg-zinc-800 text-zinc-300',
  pendiente: 'border-amber-700/60 bg-amber-900/30 text-amber-300', cancelado: 'border-zinc-600 bg-zinc-800 text-zinc-400', reembolsado: 'border-zinc-600 bg-zinc-800 text-zinc-400',
  aprobado: 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300', rechazado: 'border-red-700/60 bg-red-900/30 text-red-300', activo: 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300', borrador: 'border-zinc-600 bg-zinc-800 text-zinc-300', agotado: 'border-red-700/60 bg-red-900/30 text-red-300', oculto: 'border-zinc-600 bg-zinc-800 text-zinc-400',
  recibida: 'border-amber-700/60 bg-amber-900/30 text-amber-300', en_proceso: 'border-sky-700/60 bg-sky-900/30 text-sky-300', resuelta: 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300',
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={`adm-badge ${TONES[status] ?? 'border-zinc-600 bg-zinc-800 text-zinc-300'}`}>{label ?? status.replace('_', ' ')}</span>;
}
export function StatCard({ label, value, hint, tone = 'default', href }: { label: string; value: string; hint?: string; tone?: 'default' | 'alert'; href?: string }) {
  const body = <><p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p><p className={`mt-1 text-2xl font-bold ${tone === 'alert' ? 'text-red-400' : ''}`}>{value}</p>{hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}</>;
  return href ? <Link href={href} className="adm-card block p-4 transition-colors hover:border-zinc-600">{body}</Link> : <div className="adm-card p-4">{body}</div>;
}
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="adm-input max-w-sm" />;
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (id: T) => void }) {
  return <div role="tablist" className="flex flex-wrap gap-1">{tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={tab.id === value} onClick={() => onChange(tab.id)} className={`rounded-full px-3 py-1.5 text-sm transition-colors ${tab.id === value ? 'bg-red-600 font-semibold text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{tab.label}{tab.count !== undefined && <span className="ml-1.5 text-xs opacity-80">{tab.count}</span>}</button>)}</div>;
}
export function Collapsible({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return <details open={defaultOpen} className="adm-card group"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:hidden"><span className="min-w-0 flex-1">{summary}</span><span aria-hidden className="text-zinc-500 transition-transform group-open:rotate-180">▾</span></summary><div className="border-t border-zinc-800 p-4">{children}</div></details>;
}

/* ------------------------------------------------------------------ Forms */
export type Field = { name: string; label: string; type?: 'text' | 'number' | 'date' | 'email' | 'checkbox'; required?: boolean; textarea?: boolean; options?: { value: string; label: string }[]; defaultValue?: string | number | boolean; step?: string; min?: string; max?: number; placeholder?: string; hint?: string };

/** Posts one validated action to /api/admin/ops; the server re-validates everything and enforces the admin role. */
export function OpsForm({ action, fields, submit, hidden = {}, compact = false, ready = true, confirm }: { action: string; fields: Field[]; submit: string; hidden?: Record<string, unknown>; compact?: boolean; ready?: boolean; confirm?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const data = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { action, ...hidden };
    for (const field of fields) body[field.name] = field.type === 'checkbox' ? data.get(field.name) === 'on' : String(data.get(field.name) ?? '');
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/ops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast('ok', 'Cambios guardados.'); router.refresh();
    } catch (failure) { const message = (failure as Error).message; setError(message); toast('error', message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={onSubmit} className={compact ? 'flex flex-wrap items-end gap-3' : 'grid gap-4 md:grid-cols-2'}>
    {fields.map(field => field.type === 'checkbox'
      ? <label key={field.name} className="flex items-center gap-2 self-center text-sm text-zinc-300"><input type="checkbox" name={field.name} defaultChecked={field.defaultValue === true} className="h-4 w-4 rounded border-zinc-600 accent-red-600" /> {field.label}</label>
      : <label key={field.name} className={`adm-label ${field.textarea ? 'md:col-span-2' : ''} ${compact ? 'w-40 sm:w-48' : ''}`}>{field.label}{field.required && <span aria-hidden className="text-red-400"> *</span>}
        <span className="mt-1 block">{field.options ? <select name={field.name} required={field.required} defaultValue={String(field.defaultValue ?? '')} className="adm-input">{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : field.textarea ? <textarea name={field.name} required={field.required} rows={14} defaultValue={String(field.defaultValue ?? '')} className="adm-input font-mono leading-relaxed" />
          : <input name={field.name} type={field.type ?? 'text'} required={field.required} step={field.step} min={field.min} max={field.max} placeholder={field.placeholder} defaultValue={field.defaultValue === undefined ? undefined : String(field.defaultValue)} className="adm-input" />}</span>
        {field.hint && <span className="mt-1 block text-xs font-normal text-zinc-500">{field.hint}</span>}</label>)}
    <div className={`flex flex-wrap items-center gap-3 ${compact ? '' : 'md:col-span-2'}`}><button disabled={busy || !ready} className="adm-btn-primary">{busy ? 'Guardando…' : submit}</button>
      {error && <span role="alert" className="text-sm text-red-300">{error}</span>}</div>
  </form>;
}

/** Used by client lists that call their own endpoints. */
export function useAdminRequest() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const run = useMemo(() => async (key: string, request: () => Promise<Response>, success: string) => {
    setBusy(key);
    try {
      const response = await request();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast('ok', success); router.refresh();
    } catch (failure) { toast('error', (failure as Error).message); }
    finally { setBusy(''); }
  }, [router, toast]);
  return { busy, run };
}

/** Client-side text filter over server-rendered rows. */
export function FilterableList({ items, placeholder, empty }: { items: { id: string; text: string; node: ReactNode }[]; placeholder: string; empty: string }) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = needle ? items.filter(item => item.text.toLowerCase().includes(needle)) : items;
  return <div className="space-y-3">
    {items.length > 4 && <SearchBox value={query} onChange={setQuery} placeholder={placeholder} />}
    {visible.length === 0 ? <EmptyState>{items.length === 0 ? empty : 'Nada coincide con la búsqueda.'}</EmptyState> : <div className="space-y-2">{visible.map(item => <div key={item.id}>{item.node}</div>)}</div>}
  </div>;
}
