import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm } from '@/components/AdminUi';
export const dynamic = 'force-dynamic';

type Lot = { id: string; lot_number: string; expiration_date: string; quantity: number; reserved_quantity: number };
type Variant = { id: string; sku: string; flavor: string | null; size: string | null; presentation: string | null; price_override: number | null; barcode: string | null; stock_available: number; stock_reserved: number; lots: Lot[] };
type Row = { id: string; name: string; is_consumable: boolean; variants: Variant[] };

export default async function InventoryPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const canEdit = staff.role === 'admin';
  const { data, error } = await serviceDatabase().from('products').select('id,name,is_consumable,variants:product_variants(id,sku,flavor,size,presentation,price_override,barcode,stock_available,stock_reserved,lots:inventory_lots(id,lot_number,expiration_date,quantity,reserved_quantity))').order('name');
  if (error) throw new Error('No fue posible cargar el inventario');
  const rows = data as unknown as Row[];
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-6"><h1 className="text-3xl font-bold">Inventario y variantes</h1>
    {rows.map(product => <article key={product.id} className="glass-panel rounded-xl p-5 space-y-4"><h2 className="text-lg font-bold">{product.name} {product.is_consumable && <span className="text-sm font-normal text-slate-300">(consumible: lote y caducidad obligatorios)</span>}</h2>
      {product.variants.map(variant => <div key={variant.id} className="border border-slate-700 rounded-lg p-3 space-y-2">
        <p className="font-semibold">{variant.sku} <span className="font-normal text-sm text-slate-300">{[variant.flavor, variant.size, variant.presentation].filter(Boolean).join(' / ')}</span></p>
        <p className="text-sm">Disponible: {variant.stock_available - variant.stock_reserved} · Reservado: {variant.stock_reserved} · Existencias: {variant.stock_available}</p>
        {variant.lots.length > 0 && <ul className="text-sm space-y-2">{variant.lots.map(lot => <li key={lot.id} className="space-y-1"><span>Lote {lot.lot_number} · caduca {lot.expiration_date} · {lot.quantity} uds. ({lot.reserved_quantity} reservadas)</span>
          {canEdit && <OpsForm compact action="adjust_stock" submit="Ajustar" hidden={{ variantId: variant.id, lotId: lot.id }} fields={[{ name: 'quantity', label: 'Nueva cantidad', type: 'number', required: true, min: '0', defaultValue: lot.quantity }, { name: 'notes', label: 'Motivo', required: true }]} />}</li>)}</ul>}
        {canEdit && <details><summary className="cursor-pointer text-sm underline">Registrar entrada</summary><div className="pt-2"><OpsForm action="receive_stock" submit="Registrar entrada" hidden={{ variantId: variant.id }} fields={[{ name: 'quantity', label: 'Cantidad', type: 'number', required: true, min: '1' }, { name: 'lot', label: product.is_consumable ? 'Lote' : 'Lote (opcional)', required: product.is_consumable }, { name: 'expiration', label: product.is_consumable ? 'Caducidad' : 'Caducidad (si hay lote)', type: 'date', required: product.is_consumable }, { name: 'notes', label: 'Notas' }]} /></div></details>}
        {canEdit && !product.is_consumable && variant.lots.length === 0 && <details><summary className="cursor-pointer text-sm underline">Ajustar existencias</summary><div className="pt-2"><OpsForm compact action="adjust_stock" submit="Ajustar" hidden={{ variantId: variant.id }} fields={[{ name: 'quantity', label: 'Nueva cantidad', type: 'number', required: true, min: '0', defaultValue: variant.stock_available }, { name: 'notes', label: 'Motivo', required: true }]} /></div></details>}
        {canEdit && <details><summary className="cursor-pointer text-sm underline">Editar variante</summary><div className="pt-2"><OpsForm action="upsert_variant" submit="Guardar variante" hidden={{ productId: product.id, id: variant.id }} fields={[{ name: 'sku', label: 'SKU', required: true, defaultValue: variant.sku }, { name: 'barcode', label: 'Código de barras', defaultValue: variant.barcode ?? '' }, { name: 'flavor', label: 'Sabor', defaultValue: variant.flavor ?? '' }, { name: 'size', label: 'Tamaño', defaultValue: variant.size ?? '' }, { name: 'presentation', label: 'Presentación', defaultValue: variant.presentation ?? '' }, { name: 'priceOverride', label: 'Precio propio (MXN, opcional)', type: 'number', step: '0.01', min: '0.01', defaultValue: variant.price_override ?? '' }]} /></div></details>}
      </div>)}
      {canEdit && <details><summary className="cursor-pointer text-sm underline">Nueva variante</summary><div className="pt-2"><OpsForm action="upsert_variant" submit="Crear variante" hidden={{ productId: product.id }} fields={[{ name: 'sku', label: 'SKU', required: true }, { name: 'barcode', label: 'Código de barras' }, { name: 'flavor', label: 'Sabor' }, { name: 'size', label: 'Tamaño' }, { name: 'presentation', label: 'Presentación' }, { name: 'priceOverride', label: 'Precio propio (MXN, opcional)', type: 'number', step: '0.01', min: '0.01' }]} /></div></details>}
    </article>)}
  </div>;
}
