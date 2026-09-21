import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm, PageHeader, Collapsible, Notice, StatusBadge } from '@/components/AdminUi';
export const dynamic = 'force-dynamic';

export default async function TaxonomyPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const canEdit = staff.role === 'admin';
  const db = serviceDatabase();
  const [brands, categories] = await Promise.all([db.from('brands').select('id,name,slug,description').order('name'), db.from('categories').select('id,name,slug,description,is_active').order('name')]);
  if (brands.error || categories.error) throw new Error('No fue posible cargar marcas y categorías');
  return <>
    <PageHeader title="Marcas y categorías" description="Organiza el catálogo. Los slugs forman parte de las URLs públicas: cámbialos con cuidado." />
    <Notice kind="info">Por diseño no se permiten categorías de esteroides, SARMs ni hormonas de crecimiento: el servidor y la base de datos las rechazan.</Notice>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-2"><h2 className="text-lg font-bold">Marcas <span className="text-sm font-normal text-zinc-500">({brands.data.length})</span></h2>
        {brands.data.map(brand => <Collapsible key={brand.id} summary={<span>{brand.name} <span className="text-xs text-zinc-500">/{brand.slug}</span></span>}>{canEdit ? <OpsForm action="upsert_brand" submit="Guardar" hidden={{ id: brand.id }} fields={[{ name: 'name', label: 'Nombre', required: true, defaultValue: brand.name }, { name: 'slug', label: 'Slug', required: true, defaultValue: brand.slug }, { name: 'description', label: 'Descripción', defaultValue: brand.description ?? '' }]} /> : <p className="text-sm text-zinc-400">{brand.description || 'Sin descripción.'}</p>}</Collapsible>)}
        {canEdit && <Collapsible summary={<span className="font-semibold text-red-300">+ Nueva marca</span>}><OpsForm action="upsert_brand" submit="Crear marca" fields={[{ name: 'name', label: 'Nombre', required: true }, { name: 'slug', label: 'Slug', required: true, placeholder: 'mi-marca', hint: 'Minúsculas, números y guiones.' }, { name: 'description', label: 'Descripción' }]} /></Collapsible>}</section>
      <section className="space-y-2"><h2 className="text-lg font-bold">Categorías <span className="text-sm font-normal text-zinc-500">({categories.data.length})</span></h2>
        {categories.data.map(category => <Collapsible key={category.id} summary={<span className="flex flex-wrap items-center gap-2">{category.name} <span className="text-xs text-zinc-500">/{category.slug}</span>{!category.is_active && <StatusBadge status="oculto" label="inactiva" />}</span>}>{canEdit ? <OpsForm action="upsert_category" submit="Guardar" hidden={{ id: category.id }} fields={[{ name: 'name', label: 'Nombre', required: true, defaultValue: category.name }, { name: 'slug', label: 'Slug', required: true, defaultValue: category.slug }, { name: 'description', label: 'Descripción', defaultValue: category.description ?? '' }, { name: 'active', label: 'Visible en la tienda', type: 'checkbox', defaultValue: category.is_active }]} /> : <p className="text-sm text-zinc-400">{category.description || 'Sin descripción.'}</p>}</Collapsible>)}
        {canEdit && <Collapsible summary={<span className="font-semibold text-red-300">+ Nueva categoría</span>}><OpsForm action="upsert_category" submit="Crear categoría" fields={[{ name: 'name', label: 'Nombre', required: true }, { name: 'slug', label: 'Slug', required: true, placeholder: 'vitaminas', hint: 'Minúsculas, números y guiones.' }, { name: 'description', label: 'Descripción' }, { name: 'active', label: 'Visible en la tienda', type: 'checkbox', defaultValue: true }]} /></Collapsible>}</section>
    </div>
  </>;
}
