import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm, PageHeader, Collapsible, EmptyState, StatusBadge, type Field } from '@/components/AdminUi';
import { money } from '@/lib/commerce';
export const dynamic = 'force-dynamic';

type Coupon = { id: string; code: string; discount_type: 'percentage' | 'fixed'; discount_value: number; min_purchase: number | null; usage_limit: number | null; times_used: number | null; valid_until: string | null; is_active: boolean };
const TYPES = [{ value: 'percentage', label: 'Porcentaje (%)' }, { value: 'fixed', label: 'Monto fijo (MXN)' }];
const fields = (coupon?: Coupon): Field[] => [
  { name: 'code', label: 'Código', required: true, defaultValue: coupon?.code ?? '', placeholder: 'BIENVENIDA10', hint: '3 a 32 caracteres: letras, números, guion.' },
  { name: 'type', label: 'Tipo de descuento', options: TYPES, defaultValue: coupon?.discount_type ?? 'percentage' },
  { name: 'value', label: 'Valor', type: 'number', step: '0.01', min: '0.01', required: true, defaultValue: coupon?.discount_value ?? '' },
  { name: 'minPurchase', label: 'Compra mínima (MXN)', type: 'number', step: '0.01', min: '0', defaultValue: coupon?.min_purchase ?? '' },
  { name: 'usageLimit', label: 'Límite de usos', type: 'number', min: '1', defaultValue: coupon?.usage_limit ?? '', hint: 'Vacío = sin límite.' },
  { name: 'validUntil', label: 'Vigente hasta', type: 'date', defaultValue: coupon?.valid_until?.slice(0, 10) ?? '', hint: 'Vacío = sin vencimiento.' },
  { name: 'active', label: 'Cupón activo', type: 'checkbox', defaultValue: coupon?.is_active ?? true },
];
export default async function CouponsPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const canEdit = staff.role === 'admin';
  const { data, error } = await serviceDatabase().from('coupons').select('id,code,discount_type,discount_value,min_purchase,usage_limit,times_used,valid_until,is_active').order('code');
  if (error) throw new Error('No fue posible cargar los cupones');
  const coupons = data as Coupon[];
  return <>
    <PageHeader title="Cupones" description="Los descuentos se validan y aplican en el servidor al crear el pedido; el uso se reserva y se libera si el pedido expira." />
    {coupons.length === 0 && <EmptyState>Aún no hay cupones.</EmptyState>}
    <div className="space-y-2">{coupons.map(coupon => <Collapsible key={coupon.id} summary={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-mono font-semibold">{coupon.code}</span><span>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : money(coupon.discount_value)}</span><span className="text-zinc-400">{coupon.times_used ?? 0}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''} usos</span><StatusBadge status={coupon.is_active ? 'activo' : 'oculto'} label={coupon.is_active ? 'activo' : 'inactivo'} /></span>}>{canEdit ? <OpsForm action="upsert_coupon" submit="Guardar cambios" hidden={{ id: coupon.id }} fields={fields(coupon)} /> : <p className="text-sm text-zinc-400">Solo un administrador puede modificar cupones.</p>}</Collapsible>)}
      {canEdit && <Collapsible summary={<span className="font-semibold text-red-300">+ Nuevo cupón</span>}><OpsForm action="upsert_coupon" submit="Crear cupón" fields={fields()} /></Collapsible>}</div>
  </>;
}
