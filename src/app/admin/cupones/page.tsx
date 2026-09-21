import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm, type Field } from '@/components/AdminUi';
export const dynamic = 'force-dynamic';

type Coupon = { id: string; code: string; discount_type: 'percentage' | 'fixed'; discount_value: number; min_purchase: number | null; usage_limit: number | null; times_used: number | null; valid_until: string | null; is_active: boolean };
const TYPES = [{ value: 'percentage', label: 'Porcentaje' }, { value: 'fixed', label: 'Monto fijo (MXN)' }];
const fields = (coupon?: Coupon): Field[] => [
  { name: 'code', label: 'Código', required: true, defaultValue: coupon?.code ?? '' },
  { name: 'type', label: 'Tipo', options: TYPES, defaultValue: coupon?.discount_type ?? 'percentage' },
  { name: 'value', label: 'Valor', type: 'number', step: '0.01', min: '0.01', required: true, defaultValue: coupon?.discount_value ?? '' },
  { name: 'minPurchase', label: 'Compra mínima (MXN)', type: 'number', step: '0.01', min: '0', defaultValue: coupon?.min_purchase ?? '' },
  { name: 'usageLimit', label: 'Límite de usos', type: 'number', min: '1', defaultValue: coupon?.usage_limit ?? '' },
  { name: 'validUntil', label: 'Vigente hasta (opcional)', type: 'date', defaultValue: coupon?.valid_until?.slice(0, 10) ?? '' },
  { name: 'active', label: 'Activo', type: 'checkbox', defaultValue: coupon?.is_active ?? true },
];
export default async function CouponsPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const canEdit = staff.role === 'admin';
  const { data, error } = await serviceDatabase().from('coupons').select('id,code,discount_type,discount_value,min_purchase,usage_limit,times_used,valid_until,is_active').order('code');
  if (error) throw new Error('No fue posible cargar los cupones');
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-6"><h1 className="text-3xl font-bold">Cupones</h1>
    {(data as Coupon[]).map(coupon => <details key={coupon.id} className="glass-panel rounded-xl p-4"><summary className="cursor-pointer">{coupon.code} · {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`} · {coupon.times_used ?? 0}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''} usos · {coupon.is_active ? 'activo' : 'inactivo'}</summary>{canEdit && <div className="pt-3"><OpsForm action="upsert_coupon" submit="Guardar" hidden={{ id: coupon.id }} fields={fields(coupon)} /></div>}</details>)}
    {canEdit && <details className="glass-panel rounded-xl p-4"><summary className="cursor-pointer font-semibold">Nuevo cupón</summary><div className="pt-3"><OpsForm action="upsert_coupon" submit="Crear cupón" fields={fields()} /></div></details>}
  </div>;
}
