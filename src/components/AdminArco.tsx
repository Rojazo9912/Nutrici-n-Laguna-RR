'use client';
import { useState } from 'react';
import { PageHeader, Notice, EmptyState, StatusBadge, Tabs, useAdminRequest } from '@/components/AdminUi';

export type ArcoRequest = { id: string; requester_name: string; requester_email: string; request_type: string; details: string; status: string; resolution_notes: string | null; created_at: string };
type Tab = 'abiertas' | 'cerradas';
const TYPE_LABELS: Record<string, string> = { acceso: 'Acceso', rectificacion: 'Rectificación', cancelacion: 'Cancelación', oposicion: 'Oposición' };

export default function AdminArco({ requests, ready }: { requests: ArcoRequest[]; ready: boolean }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>('abiertas');
  const { busy, run } = useAdminRequest();
  const isOpen = (request: ArcoRequest) => request.status === 'recibida' || request.status === 'en_proceso';
  const visible = requests.filter(request => (tab === 'abiertas') === isOpen(request));
  const update = (request: ArcoRequest, status: string) => {
    if (status === 'rechazada' && !window.confirm('¿Rechazar esta solicitud? Debe quedar documentado el motivo.')) return;
    void run(request.id, () => fetch(`/api/admin/arco/${request.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes: notes[request.id] || '' }) }), 'Solicitud actualizada.');
  };
  return <>
    <PageHeader title="Solicitudes ARCO" description="Acceso, rectificación, cancelación y oposición sobre datos personales. Responde al titular por correo y documenta aquí la resolución." />
    {!ready && <Notice>Falta aplicar la migración 06; las solicitudes no se pueden cargar.</Notice>}
    <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'abiertas', label: 'Abiertas', count: requests.filter(isOpen).length }, { id: 'cerradas', label: 'Cerradas', count: requests.filter(request => !isOpen(request)).length }]} />
    {ready && visible.length === 0 && <EmptyState>{tab === 'abiertas' ? 'No hay solicitudes abiertas.' : 'Aún no hay solicitudes cerradas.'}</EmptyState>}
    <div className="space-y-3">{visible.map(request => {
      const enough = (notes[request.id] || '').trim().length >= 5;
      return <article key={request.id} className="adm-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{TYPE_LABELS[request.request_type] ?? request.request_type}</h2><StatusBadge status={request.status} /></div>
        <p className="mt-1 text-xs text-zinc-400">{new Date(request.created_at).toLocaleString('es-MX')} · {request.requester_name} · <a href={`mailto:${request.requester_email}`} className="underline">{request.requester_email}</a></p>
        <p className="mt-3 whitespace-pre-wrap text-sm">{request.details}</p>
        {request.resolution_notes && <p className="mt-3 rounded-lg bg-zinc-950/60 p-3 text-sm text-zinc-300"><span className="font-medium">Resolución:</span> {request.resolution_notes}</p>}
        {isOpen(request) && <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <label className="adm-label">Notas de resolución<textarea maxLength={4000} rows={3} value={notes[request.id] || ''} onChange={event => setNotes({ ...notes, [request.id]: event.target.value })} className="adm-input mt-1" /><span className="mt-1 block text-xs font-normal text-zinc-500">Obligatorias (mín. 5 caracteres) para resolver o rechazar.</span></label>
          <div className="flex flex-wrap gap-2">
            {request.status === 'recibida' && <button disabled={!ready || !!busy} onClick={() => update(request, 'en_proceso')} className="adm-btn-secondary">Marcar en proceso</button>}
            <button disabled={!ready || !!busy || !enough} onClick={() => update(request, 'resuelta')} className="adm-btn-primary">Resolver</button>
            <button disabled={!ready || !!busy || !enough} onClick={() => update(request, 'rechazada')} className="adm-btn-secondary">Rechazar</button>
          </div></div>}
      </article>;
    })}</div>
  </>;
}
