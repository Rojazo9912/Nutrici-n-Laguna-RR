import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm } from '@/components/AdminUi';
export const dynamic = 'force-dynamic';

export default async function TaxonomyPage() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const canEdit = staff.role === 'admin';
  const db = serviceDatabase();
  const [brands, categories] = await Promise.all([db.from('brands').select('id,name,slug,description').order('name'), db.from('categories').select('id,name,slug,description,is_active').order('name')]);
  if (brands.error || categories.error) throw new Error('No fue posible cargar marcas y categorías');
  return <div className="max-w-6xl mx-auto px-4 py-10 space-y-8"><h1 className="text-3xl font-bold">Marcas y categorías</h1>
    <p className="text-sm text-slate-300">Por diseño, no se permiten categorías de esteroides, SARMs ni hormonas de crecimiento: el servidor y la base de datos las rechazan.</p>
    <section className="space-y-4"><h2 className="text-xl font-bold">Marcas</h2>
      {brands.data.map(brand => <details key={brand.id} className="glass-panel rounded-xl p-4"><summary className="cursor-pointer">{brand.name} <span className="text-sm text-slate-400">/{brand.slug}</span></summary>{canEdit && <div className="pt-3"><OpsForm action="upsert_brand" submit="Guardar" hidden={{ id: brand.id }} fields={[{ name: 'name', label: 'Nombre', required: true, defaultValue: brand.name }, { name: 'slug', label: 'Slug', required: true, defaultValue: brand.slug }, { name: 'description', label: 'Descripción', defaultValue: brand.description ?? '' }]} /></div>}</details>)}
      {canEdit && <details className="glass-panel rounded-xl p-4"><summary className="cursor-pointer font-semibold">Nueva marca</summary><div className="pt-3"><OpsForm action="upsert_brand" submit="Crear marca" fields={[{ name: 'name', label: 'Nombre', required: true }, { name: 'slug', label: 'Slug', required: true }, { name: 'description', label: 'Descripción' }]} /></div></details>}</section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Categorías</h2>
      {categories.data.map(category => <details key={category.id} className="glass-panel rounded-xl p-4"><summary className="cursor-pointer">{category.name} <span className="text-sm text-slate-400">/{category.slug}{category.is_active ? '' : ' · inactiva'}</span></summary>{canEdit && <div className="pt-3"><OpsForm action="upsert_category" submit="Guardar" hidden={{ id: category.id }} fields={[{ name: 'name', label: 'Nombre', required: true, defaultValue: category.name }, { name: 'slug', label: 'Slug', required: true, defaultValue: category.slug }, { name: 'description', label: 'Descripción', defaultValue: category.description ?? '' }, { name: 'active', label: 'Activa', type: 'checkbox', defaultValue: category.is_active }]} /></div>}</details>)}
      {canEdit && <details className="glass-panel rounded-xl p-4"><summary className="cursor-pointer font-semibold">Nueva categoría</summary><div className="pt-3"><OpsForm action="upsert_category" submit="Crear categoría" fields={[{ name: 'name', label: 'Nombre', required: true }, { name: 'slug', label: 'Slug', required: true }, { name: 'description', label: 'Descripción' }, { name: 'active', label: 'Activa', type: 'checkbox', defaultValue: true }]} /></div></details>}</section>
  </div>;
}
