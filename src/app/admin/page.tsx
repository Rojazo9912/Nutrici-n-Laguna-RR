import { redirect } from 'next/navigation';
import { staffUser, serviceDatabase } from '@/lib/supabase/server';
import { PageHeader, Notice } from '@/components/AdminUi';
import AdminDashboardVisual, { type DashboardData } from '@/components/AdminDashboardVisual';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const staff = await staffUser();
  if (!staff) redirect('/cuenta');

  const { data, error } = await serviceDatabase().rpc('admin_dashboard');
  const d = data as DashboardData | null;

  if (error || !d) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tablero de Control"
          description="Monitoreo ejecutivo de ventas, pedidos y operaciones sanitarias."
        />
        <Notice kind="warning">
          Aún no se pueden mostrar los indicadores: verifica la conexión y que las migraciones de seguridad estén aplicadas en Supabase.
        </Notice>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Tablero de Control"
        description="Métricas consolidadas de los últimos 30 días, rotación de productos y semáforo de inventario FEFO."
      />
      <AdminDashboardVisual data={d} />
    </div>
  );
}
