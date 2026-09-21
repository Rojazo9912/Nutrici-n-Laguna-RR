import { notFound } from 'next/navigation';
import { publicDatabase } from '@/lib/supabase/server';
const titles: Record<string,string> = { privacidad: 'Aviso de privacidad', terminos: 'Términos y condiciones', 'derechos-arco': 'Derechos ARCO', 'regulacion-cofepris': 'Política de revisión de productos' };
export const dynamic = 'force-dynamic';
export default async function DocumentPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  if (!Object.hasOwn(titles,document)) notFound();
  const { data, error } = await publicDatabase().from('site_content').select('content').eq('key',document).maybeSingle();
  if (error) throw new Error('No fue posible cargar el documento');
  const content = data?.content;
  return <article className="max-w-3xl mx-auto px-4 py-12 space-y-6"><h1 className="text-3xl font-bold">{titles[document]}</h1>{typeof content?.body === 'string' && content.body.trim() ? <><p className="text-sm text-slate-400">Versión: {content.version}</p><div className="whitespace-pre-wrap leading-relaxed">{content.body}</div></> : <p role="status">Este documento aún no ha sido publicado por la tienda.</p>}</article>;
}
