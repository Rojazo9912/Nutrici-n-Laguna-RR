'use client';
import { Notice, PageHeader } from '@/components/AdminUi';

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <>
    <PageHeader title="No se pudo cargar esta sección" />
    <Notice kind="error">Ocurrió un problema al consultar los datos. Si acabas de configurar el proyecto, verifica que Supabase esté accesible y que las migraciones estén aplicadas (<code>npm run check:setup</code>).</Notice>
    <button onClick={reset} className="adm-btn-secondary">Reintentar</button>
  </>;
}
