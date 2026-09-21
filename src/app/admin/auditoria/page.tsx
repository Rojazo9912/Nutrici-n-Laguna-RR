import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const { data, error } = await serviceDatabase().from('admin_audit_logs').select('id,action,entity_type,entity_id,payload,created_at,admin:profiles(email)').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error('No fue posible cargar la bitácora');
  const rows = data as unknown as { id: string; action: string; entity_type: string; entity_id: string | null; payload: unknown; created_at: string; admin: { email: string } | null }[];
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-4"><h1 className="text-3xl font-bold">Bitácora de auditoría</h1><p className="text-sm text-slate-300">Últimas 200 acciones administrativas: quién, qué y cuándo.</p>
    {rows.length === 0 && <p>Sin registros.</p>}
    <ul className="space-y-2">{rows.map(row => <li key={row.id} className="glass-panel rounded-lg p-3 text-sm"><p><strong>{row.action}</strong> · {row.entity_type}{row.entity_id ? ` ${row.entity_id}` : ''}</p><p className="text-slate-300">{new Date(row.created_at).toLocaleString('es-MX')} · {row.admin?.email ?? 'usuario eliminado'}</p><pre className="whitespace-pre-wrap break-words text-xs text-slate-400">{JSON.stringify(row.payload)}</pre></li>)}</ul>
  </div>;
}
