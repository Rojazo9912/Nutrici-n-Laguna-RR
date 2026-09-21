import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm, PageHeader, Collapsible, FilterableList, StatusBadge } from '@/components/AdminUi';
export const dynamic = 'force-dynamic';

type Lot = { id: string; lot_number: string; expiration_date: string; quantity: number; reserved_quantity: number };
type Variant = { id: string; sku: string; flavor: string | null; size: string | null; presentation: string | null; price_override: number | null; barcode: string | null; stock_available: number; stock_reserved: number; lots: Lot[] };
type Row = { id: string; name: string; is_consumable: boolean; stock_minimum: number; variants: Variant[] };

const variantFields = (variant?: Variant) => [
  { name: 'sku', label: 'SKU', required: true, defaultValue: variant?.sku ?? '' }, { name: 'barcode', label: 'Código de barras', defaultValue: variant?.barcode ?? '' },
  { name: 'flavor', label: 'Sabor', defaultValue: variant?.flavor ?? '' }, { name: 'size', label: 'Tamaño', defaultValue: variant?.size ?? '' },
  { name: 'presentation', label: 'Presentación', defaultValue: variant?.presentation ?? '' },
  { name: 'priceOverride', label: 'Precio propio (MXN)', type: 'number' as const, step: '0.01', min: '0.01', defaultValue: variant?.price_override ?? '', hint: 'Opcional: reemplaza el precio del producto.' },
];

export default async function InventoryPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const canEdit = staff.role === 'admin';
  const { data, error } = await serviceDatabase().from('products').select('id,name,is_consumable,stock_minimum,variants:product_variants(id,sku,flavor,size,presentation,price_override,barcode,stock_available,stock_reserved,lots:inventory_lots(id,lot_number,expiration_date,quantity,reserved_quantity))').order('name');
  if (error) throw new Error('No fue posible cargar el inventario');
  const rows = data as unknown as Row[];
  const today = new Date().toISOString().slice(0, 10);
  const items = rows.map(product => {
    const available = product.variants.reduce((sum, variant) => sum + variant.stock_available - variant.stock_reserved, 0);
    const low = product.variants.some(variant => variant.stock_available - variant.stock_reserved <= product.stock_minimum);
    return { id: product.id, text: `${product.name} ${product.variants.map(variant => variant.sku).join(' ')}`, node: <Collapsible summary={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-semibold">{product.name}</span><span className="text-zinc-400">{available} disponibles · {product.variants.length} variante{product.variants.length === 1 ? '' : 's'}</span>{low && <span className="adm-badge border-amber-700/60 bg-amber-900/30 text-amber-300">stock bajo</span>}{product.is_consumable && <span className="adm-badge border-zinc-600 bg-zinc-800 text-zinc-300">consumible</span>}</span>}>
      <div className="space-y-4">{product.variants.map(variant => {
        const free = variant.stock_available - variant.stock_reserved;
        return <div key={variant.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-semibold">{variant.sku} <span className="text-sm font-normal text-zinc-400">{[variant.flavor, variant.size, variant.presentation].filter(Boolean).join(' · ')}</span></p>
            <p className="text-sm"><span className={free <= product.stock_minimum ? 'font-semibold text-amber-300' : ''}>{free} disponibles</span> <span className="text-zinc-500">· {variant.stock_reserved} reservadas · {variant.stock_available} en existencia</span></p></div>
          {variant.lots.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[32rem] text-left text-sm"><thead className="text-xs uppercase text-zinc-500"><tr><th className="py-1 pr-3 font-medium">Lote</th><th className="pr-3 font-medium">Caducidad</th><th className="pr-3 font-medium">Cantidad</th><th className="font-medium">Reservadas</th></tr></thead>
            <tbody>{variant.lots.map(lot => <tr key={lot.id} className="border-t border-zinc-800 align-top"><td className="py-2 pr-3">{lot.lot_number}</td><td className="pr-3">{new Date(`${lot.expiration_date}T00:00:00`).toLocaleDateString('es-MX')}{lot.expiration_date <= today && <StatusBadge status="rechazado" label="vencido" />}</td><td className="pr-3">{lot.quantity}</td><td>{lot.reserved_quantity}</td></tr>)}</tbody></table>
            {canEdit && <div className="mt-2 space-y-2">{variant.lots.map(lot => <Collapsible key={lot.id} summary={<span className="text-xs text-zinc-300">Ajustar lote {lot.lot_number}</span>}><OpsForm compact action="adjust_stock" submit="Guardar ajuste" confirm="¿Confirmas el ajuste de inventario? Queda registrado en la auditoría." hidden={{ variantId: variant.id, lotId: lot.id }} fields={[{ name: 'quantity', label: 'Nueva cantidad', type: 'number', required: true, min: '0', defaultValue: lot.quantity }, { name: 'notes', label: 'Motivo del ajuste', required: true }]} /></Collapsible>)}</div>}</div>}
          {canEdit && <div className="mt-3 flex flex-wrap gap-2">
            <div className="w-full"><Collapsible summary={<span className="text-sm">Registrar entrada de mercancía</span>}><OpsForm action="receive_stock" submit="Registrar entrada" hidden={{ variantId: variant.id }} fields={[{ name: 'quantity', label: 'Cantidad', type: 'number', required: true, min: '1' }, { name: 'lot', label: 'Lote', required: product.is_consumable, hint: product.is_consumable ? undefined : 'Opcional en productos no consumibles.' }, { name: 'expiration', label: 'Caducidad', type: 'date', required: product.is_consumable }, { name: 'notes', label: 'Notas (proveedor, factura…)' }]} /></Collapsible></div>
            {!product.is_consumable && variant.lots.length === 0 && <div className="w-full"><Collapsible summary={<span className="text-sm">Ajustar existencias</span>}><OpsForm compact action="adjust_stock" submit="Guardar ajuste" confirm="¿Confirmas el ajuste de inventario? Queda registrado en la auditoría." hidden={{ variantId: variant.id }} fields={[{ name: 'quantity', label: 'Nueva cantidad', type: 'number', required: true, min: '0', defaultValue: variant.stock_available }, { name: 'notes', label: 'Motivo del ajuste', required: true }]} /></Collapsible></div>}
            <div className="w-full"><Collapsible summary={<span className="text-sm">Editar datos de la variante</span>}><OpsForm action="upsert_variant" submit="Guardar variante" hidden={{ productId: product.id, id: variant.id }} fields={variantFields(variant)} /></Collapsible></div>
          </div>}
        </div>;
      })}
      {canEdit && <Collapsible summary={<span className="text-sm">Agregar una variante (sabor, tamaño…)</span>}><OpsForm action="upsert_variant" submit="Crear variante" hidden={{ productId: product.id }} fields={variantFields()} /></Collapsible>}</div></Collapsible> };
  });
  return <>
    <PageHeader title="Inventario y variantes" description="Existencias por variante y lote. Los productos consumibles exigen lote y caducidad, y solo se venden lotes vigentes." />
    <FilterableList items={items} placeholder="Buscar producto o SKU" empty="Aún no hay productos." />
  </>;
}
