'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type ArcoRequest = { id: string; requester_name: string; requester_email: string; request_type: string; details: string; status: string; resolution_notes: string | null; created_at: string };

export default function AdminArco({ requests, ready }: { requests: ArcoRequest[]; ready: boolean }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function update(id: string, status: string) {
    setBusy(id); setMessage('');
    try {
      const response = await fetch(`/api/admin/arco/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes: notes[id] || '' }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage('Solicitud actualizada.'); router.refresh();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(''); }
  }
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-3"><h1 className="text-3xl font-bold">Solicitudes ARCO</h1><Link href="/admin/pedidos" className="underline text-slate-300">Pedidos</Link></div>
    {!ready && <p role="alert" className="text-amber-200">Falta aplicar la migración 06.</p>}
    {message && <p role="status" className="text-amber-200">{message}</p>}
    {ready && requests.length === 0 && <p>No hay solicitudes.</p>}
    {requests.map(request => {
      const open = request.status === 'recibida' || request.status === 'en_proceso';
      const enough = (notes[request.id] || '').trim().length >= 5;
      return <article key={request.id} className="glass-panel rounded-xl p-5 space-y-2">
        <h2 className="text-lg font-bold">{request.request_type} · {request.status}</h2>
        <p className="text-sm text-slate-300">{new Date(request.created_at).toLocaleString('es-MX')} · {request.requester_name} · {request.requester_email}</p>
        <p className="whitespace-pre-wrap">{request.details}</p>
        {request.resolution_notes && <p className="text-sm text-slate-300">Resolución: {request.resolution_notes}</p>}
        {open && <div className="space-y-2 pt-2">
          <label className="block text-sm">Notas de resolución<textarea maxLength={4000} value={notes[request.id] || ''} onChange={event => setNotes({ ...notes, [request.id]: event.target.value })} className="block mt-1 w-full bg-slate-900 border border-slate-600 rounded p-3" /></label>
          <div className="flex gap-3 flex-wrap">
            {request.status === 'recibida' && <button disabled={!ready || !!busy} onClick={() => void update(request.id, 'en_proceso')} className="bg-slate-800 border border-slate-600 rounded-lg p-2 disabled:opacity-40">En proceso</button>}
            <button disabled={!ready || !!busy || !enough} onClick={() => void update(request.id, 'resuelta')} className="bg-slate-800 border border-slate-600 rounded-lg p-2 disabled:opacity-40">Resuelta</button>
            <button disabled={!ready || !!busy || !enough} onClick={() => void update(request.id, 'rechazada')} className="bg-slate-800 border border-slate-600 rounded-lg p-2 disabled:opacity-40">Rechazada</button>
          </div></div>}
      </article>;
    })}
  </div>;
}
