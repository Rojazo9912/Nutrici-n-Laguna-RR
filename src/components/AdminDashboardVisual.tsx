'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  AlertCircle,
  Truck,
  Flame,
  Package,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { money } from '@/lib/commerce';

export type DashboardData = {
  sales_30d: number;
  orders_30d: number;
  by_status: Record<string, number>;
  customers: number;
  payment_reviews: number;
  open_arco: number;
  pending_products: number;
  low_stock: { product: string; sku: string; available: number; minimum: number }[];
  expiring_lots: { product: string; sku: string; lot_number: string; expiration_date: string; quantity: number }[];
  top_products: { name: string; units: number }[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pagado: { label: 'Pagados', color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30' },
  preparando: { label: 'En Preparación', color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30' },
  enviado: { label: 'Enviados', color: 'text-sky-400', bg: 'bg-sky-500', border: 'border-sky-500/30' },
  entregado: { label: 'Entregados', color: 'text-emerald-300', bg: 'bg-emerald-600', border: 'border-emerald-600/30' },
  pendiente: { label: 'Pendientes', color: 'text-zinc-400', bg: 'bg-zinc-600', border: 'border-zinc-600/30' },
  cancelado: { label: 'Cancelados', color: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/30' },
  reembolsado: { label: 'Reembolsados', color: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/30' },
};

export default function AdminDashboardVisual({ data }: { data: DashboardData }) {
  const [lotFilter, setLotFilter] = useState<'all' | 'critical'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'empty'>('all');

  const sales = Number(data.sales_30d || 0);
  const orders = Number(data.orders_30d || 0);
  const avgTicket = orders > 0 ? sales / orders : 0;

  // Calculate order distribution percentages
  const totalStatusOrders = Object.values(data.by_status).reduce((sum, n) => sum + Number(n || 0), 0) || 1;

  // Process expiring lots with exact days remaining
  const now = new Date();
  const processedLots = (data.expiring_lots || []).map(lot => {
    const expDate = new Date(`${lot.expiration_date}T00:00:00`);
    const diffTime = expDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isCritical = daysRemaining <= 30;
    const isWarning = daysRemaining > 30 && daysRemaining <= 60;
    return {
      ...lot,
      daysRemaining,
      isCritical,
      isWarning,
      expFormatted: expDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const visibleLots = lotFilter === 'critical' ? processedLots.filter(l => l.isCritical) : processedLots;

  // Process low stock items
  const processedStock = (data.low_stock || []).map(item => {
    const isZero = item.available <= 0;
    const ratio = item.minimum > 0 ? Math.min(100, Math.round((item.available / item.minimum) * 100)) : 0;
    return { ...item, isZero, ratio };
  }).sort((a, b) => a.available - b.available);

  const visibleStock = stockFilter === 'empty' ? processedStock.filter(s => s.isZero) : processedStock;

  // Max units for top products bar chart
  const maxUnits = data.top_products.length > 0 ? Math.max(...data.top_products.map(p => p.units)) : 1;

  // Actionable alert tasks
  const tasks = [
    {
      label: 'Pedidos pagados por empaquetar',
      count: Number(data.by_status.pagado ?? 0),
      href: '/admin/pedidos',
      tone: 'emerald',
      icon: Package,
    },
    {
      label: 'Pagos que requieren conciliación',
      count: Number(data.payment_reviews ?? 0),
      href: '/admin/pedidos',
      tone: 'amber',
      icon: AlertCircle,
    },
    {
      label: 'Productos pendientes de revisión regulatoria',
      count: Number(data.pending_products ?? 0),
      href: '/admin/productos',
      tone: 'rose',
      icon: ShieldAlert,
    },
    {
      label: 'Solicitudes ARCO de privacidad abiertas',
      count: Number(data.open_arco ?? 0),
      href: '/admin/arco',
      tone: 'sky',
      icon: Users,
    },
  ].filter(t => t.count > 0);

  return (
    <div className="space-y-8">
      
      {/* Actionable Urgent Tasks Banner */}
      {tasks.length > 0 && (
        <section className="adm-card p-5 border-l-4 border-l-red-500 bg-gradient-to-r from-red-950/20 via-zinc-900/60 to-zinc-900/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Acciones Pendientes que Requieren Atención</span>
            </h2>
            <span className="text-xs font-semibold text-zinc-400">
              {tasks.reduce((sum, t) => sum + t.count, 0)} tareas
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tasks.map(task => {
              const Icon = task.icon;
              return (
                <Link
                  key={task.label}
                  href={task.href}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-red-500/60 hover:bg-zinc-900 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-red-500/40">
                      <Icon className="w-4 h-4 text-zinc-300 group-hover:text-red-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">
                      {task.label}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-xs shrink-0 shadow-md shadow-red-600/30">
                    {task.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* KPI Stat Cards with Gradient Accents */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas */}
        <div className="adm-card p-5 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ventas Netas (30d)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{money(sales)}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5 inline" /> {orders}
            </span>
            <span>órdenes completadas</span>
          </div>
        </div>

        {/* Pedidos Pagados */}
        <div className="adm-card p-5 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pedidos Pagados</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{orders}</span>
            <span className="text-xs text-zinc-400 font-semibold">pedidos</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            <span>Últimos 30 días de operación</span>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="adm-card p-5 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{money(avgTicket)}</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            <span>Por cliente en cada compra</span>
          </div>
        </div>

        {/* Clientes Registrados */}
        <Link href="/admin/clientes" className="adm-card p-5 relative overflow-hidden group hover:border-red-500/40 transition-all block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Clientes Activos</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{data.customers}</span>
            <span className="text-xs text-zinc-400 font-semibold">usuarios</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-red-400 group-hover:text-red-300 font-semibold">
            <span>Ver listado de clientes</span>
            <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </section>

      {/* Grid: Order Distribution Visual Bar & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Order Status Distribution Chart */}
        <section className="adm-card p-5 lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Flujo de Pedidos por Estado</h3>
                <p className="text-xs text-zinc-400">Distribución de estados en los últimos 30 días</p>
              </div>
              <Link href="/admin/pedidos" className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1">
                <span>Ver pedidos</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden flex p-0.5 border border-zinc-800 mb-6">
              {Object.entries(data.by_status).map(([status, count]) => {
                const conf = STATUS_CONFIG[status] || { bg: 'bg-zinc-600' };
                const pct = Math.round((Number(count) / totalStatusOrders) * 100);
                if (pct <= 0) return null;
                return (
                  <div
                    key={status}
                    style={{ width: `${pct}%` }}
                    className={`${conf.bg} h-full first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                    title={`${status}: ${count} (${pct}%)`}
                  />
                );
              })}
            </div>

            {/* Status Legend Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(STATUS_CONFIG).map(([status, conf]) => {
                const count = Number(data.by_status[status] || 0);
                return (
                  <div
                    key={status}
                    className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${conf.bg} shrink-0`} />
                      <span className="text-xs text-zinc-300 truncate">{conf.label}</span>
                    </div>
                    <span className="text-xs font-bold text-white shrink-0 ml-2">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top Products Performance Ranking */}
        <section className="adm-card p-5 lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span>Más Vendidos (30 días)</span>
                </h3>
                <p className="text-xs text-zinc-400">Productos con mayor volumen de rotación</p>
              </div>
              <Link href="/admin/productos" className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1">
                <span>Catálogo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.top_products.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No hay ventas registradas en el periodo actual.
              </div>
            ) : (
              <div className="space-y-3.5">
                {data.top_products.slice(0, 5).map((prod, idx) => {
                  const pct = Math.round((prod.units / maxUnits) * 100);
                  return (
                    <div key={prod.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200 truncate flex items-center gap-2 max-w-[70%]">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                            idx === 1 ? 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/40' :
                            idx === 2 ? 'bg-amber-800/20 text-amber-600 border border-amber-800/40' :
                            'bg-zinc-900 text-zinc-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="truncate">{prod.name}</span>
                        </span>
                        <span className="font-bold text-white shrink-0">{prod.units} uds</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Grid: Semáforo de Caducidades (FEFO) & Alertas de Stock Bajo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Semáforo de Caducidades (FEFO Health Monitor) */}
        <section className="adm-card p-5 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Semáforo de Caducidades (Lotes FEFO)</span>
              </h3>
              <p className="text-xs text-zinc-400">Inspección de lotes próximos a vencer (&le; 60 días)</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setLotFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  lotFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({processedLots.length})
              </button>
              <button
                type="button"
                onClick={() => setLotFilter('critical')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  lotFilter === 'critical' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Críticos &le;30d ({processedLots.filter(l => l.isCritical).length})
              </button>
            </div>
          </div>

          {visibleLots.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Inventario en estado óptimo</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">No hay lotes con fecha de vencimiento próxima a 60 días.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {visibleLots.map(lot => (
                <div
                  key={`${lot.sku}-${lot.lot_number}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    lot.isCritical
                      ? 'bg-red-950/20 border-red-800/40 hover:border-red-600/60'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{lot.product}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                      <span>SKU: {lot.sku}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-300">Lote: {lot.lot_number}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      lot.isCritical
                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {lot.daysRemaining <= 0 ? 'VENCE HOY' : `${lot.daysRemaining} días`}
                    </span>
                    <p className="text-[11px] font-medium text-zinc-300 mt-1">
                      {lot.quantity} uds • {lot.expFormatted}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Alertas de Stock Bajo con Barras de Nivel */}
        <section className="adm-card p-5 lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-red-500" />
                <span>Monitoreo de Stock Bajo</span>
              </h3>
              <p className="text-xs text-zinc-400">Variantes en o por debajo de su umbral mínimo</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  stockFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({processedStock.length})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('empty')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  stockFilter === 'empty' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Agotados ({processedStock.filter(s => s.isZero).length})
              </button>
            </div>
          </div>

          {visibleStock.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-zinc-950/60 border border-zinc-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Stock en niveles seguros</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Ningún producto está por debajo de su inventario mínimo.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {visibleStock.map(item => (
                <div
                  key={item.sku}
                  className={`p-3 rounded-xl border space-y-2 transition-colors ${
                    item.isZero
                      ? 'bg-red-950/15 border-red-900/50 hover:border-red-600/50'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.product}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">SKU: {item.sku}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.isZero ? (
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] uppercase tracking-wider">
                          AGOTADO (0)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          {item.available} / mín. {item.minimum}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Level Progress Bar */}
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${item.ratio}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isZero ? 'bg-red-600 w-full' : item.ratio < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-right">
            <Link
              href="/admin/inventario"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              <span>Ir a gestión y entradas de lote en Inventario</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

    </div>
  );
}
