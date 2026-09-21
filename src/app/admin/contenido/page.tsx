import Link from 'next/link';
import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { OpsForm, PageHeader, Notice } from '@/components/AdminUi';
import { DOCUMENT_TITLES } from '@/lib/documents';
export const dynamic = 'force-dynamic';

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');
  const requested = (await searchParams).key ?? '';
  const key = Object.hasOwn(DOCUMENT_TITLES, requested) ? requested : 'privacidad';
  const { data, error } = await serviceDatabase().from('site_content').select('content,updated_at').eq('key', key).maybeSingle();
  if (error) throw new Error('No fue posible cargar el contenido');
  const published = !!data?.content?.body;
  return <>
    <PageHeader title="Contenido y avisos" description="Publica aquí el texto real aprobado por el responsable del negocio. Al modificar un texto, cambia también su versión: los pedidos guardan la versión del aviso de privacidad aceptada." />
    <nav aria-label="Documentos" className="flex flex-wrap gap-1">{Object.entries(DOCUMENT_TITLES).map(([slug, title]) => <Link key={slug} href={`/admin/contenido?key=${slug}`} aria-current={slug === key ? 'page' : undefined} className={`rounded-full px-3 py-1.5 text-sm transition-colors ${slug === key ? 'bg-red-600 font-semibold text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>{title}</Link>)}</nav>
    <section className="adm-card p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{DOCUMENT_TITLES[key]}</h2>
      <p className="text-xs text-zinc-400">{published ? <>Publicado · versión {data?.content?.version}{data?.updated_at ? ` · ${new Date(data.updated_at).toLocaleDateString('es-MX')}` : ''} · <Link href={`/${key}`} target="_blank" className="underline">ver en la tienda</Link></> : 'Aún no publicado'}</p></div>
      {key === 'privacidad' && !published && <div className="mb-4"><Notice>Sin aviso de privacidad publicado, el checkout permanece deshabilitado.</Notice></div>}
      {staff.role !== 'admin' ? <p className="text-sm text-zinc-400">Solo un administrador puede editar el contenido.</p> : <OpsForm key={key} action="save_site_content" submit="Publicar" confirm="Este texto será visible públicamente de inmediato. ¿Publicar?" hidden={{ key }} fields={[{ name: 'version', label: 'Versión', required: true, defaultValue: data?.content?.version ?? '', placeholder: '2026-09-21', hint: 'Por ejemplo, la fecha de vigencia. Debe cambiar cuando cambie el texto.' }, { name: 'body', label: 'Texto completo', required: true, textarea: true, defaultValue: data?.content?.body ?? '', hint: 'Texto plano; los saltos de línea se conservan.' }]} />}</section>
  </>;
}
