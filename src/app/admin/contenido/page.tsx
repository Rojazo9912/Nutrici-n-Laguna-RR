import Link from 'next/link';
import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm } from '@/components/AdminUi';
import { DOCUMENT_TITLES } from '@/lib/documents';
export const dynamic = 'force-dynamic';

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const requested = (await searchParams).key ?? '';
  const key = Object.hasOwn(DOCUMENT_TITLES, requested) ? requested : 'privacidad';
  const { data, error } = await serviceDatabase().from('site_content').select('content').eq('key', key).maybeSingle();
  if (error) throw new Error('No fue posible cargar el contenido');
  return <div className="max-w-4xl mx-auto px-4 py-10 space-y-6"><h1 className="text-3xl font-bold">Contenido del sitio</h1>
    <p className="text-sm text-slate-300">Publica aquí el texto real aprobado por el responsable del negocio. Al modificar un texto, cambia también su versión: los pedidos guardan la versión del aviso de privacidad aceptada.</p>
    <nav aria-label="Documentos" className="flex gap-3 flex-wrap text-sm">{Object.entries(DOCUMENT_TITLES).map(([slug, title]) => <Link key={slug} href={`/admin/contenido?key=${slug}`} className={slug === key ? 'font-bold underline' : 'underline text-slate-300'}>{title}</Link>)}</nav>
    <section className="glass-panel rounded-xl p-5 space-y-3"><h2 className="text-xl font-bold">{DOCUMENT_TITLES[key]}</h2>
      {staff.role !== 'admin' ? <p>Solo un administrador puede editar el contenido.</p> : <OpsForm key={key} action="save_site_content" submit="Publicar" hidden={{ key }} fields={[{ name: 'version', label: 'Versión (por ejemplo, la fecha)', required: true, defaultValue: data?.content?.version ?? '' }, { name: 'body', label: 'Texto completo', required: true, textarea: true, defaultValue: data?.content?.body ?? '' }]} />}</section>
  </div>;
}
