import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { PageHeader, FilterableList } from '@/components/AdminUi';
export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, string> = {
  review_product: 'Revisión regulatoria', create_product: 'Alta de producto', advance_order: 'Avance de pedido', receive_stock: 'Entrada de inventario', adjust_stock: 'Ajuste de inventario',
  upsert_variant: 'Variante', upsert_brand: 'Marca', upsert_category: 'Categoría', upsert_coupon: 'Cupón', save_site_content: 'Contenido publicado', update_arco_request: 'Solicitud ARCO', export_orders: 'Exportación de pedidos',
};

export default async function AuditPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const { data, error } = await serviceDatabase().from('admin_audit_logs').select('id,action,entity_type,entity_id,payload,created_at,admin:profiles(email)').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error('No fue posible cargar la bitácora');
  const rows = data as unknown as { id: string; action: string; entity_type: string; entity_id: string | null; payload: unknown; created_at: string; admin: { email: string } | null }[];
  const items = rows.map(row => ({ id: row.id, text: `${row.action} ${ACTION_LABELS[row.action] ?? ''} ${row.entity_type} ${row.admin?.email ?? ''} ${JSON.stringify(row.payload)}`, node:
    <div className="adm-card p-3 text-sm sm:p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-semibold">{ACTION_LABELS[row.action] ?? row.action} <span className="font-normal text-zinc-500">· {row.entity_type}</span></p><p className="text-xs text-zinc-400">{new Date(row.created_at).toLocaleString('es-MX')} · {row.admin?.email ?? 'usuario eliminado'}</p></div>
      {row.entity_id && <p className="mt-1 break-all text-xs text-zinc-500">{row.entity_id}</p>}<details className="mt-2"><summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">Ver detalle</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded bg-zinc-950 p-2 text-xs text-zinc-300">{JSON.stringify(row.payload, null, 2)}</pre></details></div> }));
  return <>
    <PageHeader title="Bitácora de auditoría" description="Últimas 200 acciones administrativas: quién, qué y cuándo. Solo lectura." />
    <FilterableList items={items} placeholder="Filtrar por acción, persona o dato" empty="Aún no hay acciones registradas." />
  </>;
}
