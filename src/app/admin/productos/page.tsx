'use client';

import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { ShieldCheck, ShieldAlert, XCircle, CheckCircle, Plus, AlertOctagon, RefreshCw, Lock } from 'lucide-react';
import { Product, RegulatoryStatus } from '@/types/database.types';

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>(MOCK_PRODUCTS);
  const [prohibitedTestError, setProhibitedTestError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Update regulatory status
  const handleUpdateStatus = (productId: string, newStatus: RegulatoryStatus) => {
    setProductList(prev => prev.map(p => {
      if (p.id === productId) {
        // If approved, set commercial status to active, else set to borrador
        const commercialStatus = newStatus === 'aprobado' ? 'activo' : 'borrador';
        return { ...p, regulatory_status: newStatus, commercial_status: commercialStatus };
      }
      return p;
    }));
  };

  // Test prohibited substance filter constraint (PRD Section 5.0)
  const handleTestCategoryCreation = (e: React.FormEvent) => {
    e.preventDefault();
    const lower = newCategoryName.toLowerCase();
    if (lower.includes('esteroide') || lower.includes('sarm') || lower.includes('hormona') || lower.includes('hgh')) {
      setProhibitedTestError(`[CONTROL TÉCNICO BLOQUEADO] La categoría "${newCategoryName}" viola el filtro regulatorio de sustancias prohibidas (Sección 5.0 PRD). Creación cancelada.`);
    } else {
      setProhibitedTestError(null);
      alert(`Categoría "${newCategoryName}" válida y aprobada para registro.`);
      setNewCategoryName('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Módulo de Control Regulatorio Sanitario (COFEPRIS)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Administración de Catálogo y Revisión</h1>
          <p className="text-xs text-slate-400 mt-1">Ningún producto puede publicarse sin estado de revisión 'aprobado'.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Rol: Compliance Officer</span>
          </div>
        </div>
      </div>

      {/* Interactive Prohibited Category Filter Test Card (PRD Section 5.0) */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertOctagon className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-white">Demostración: Prueba de Restricción Técnica en Base de Datos</h3>
            <p className="text-xs text-slate-400">Prueba registrar una categoría no autorizada (ej. 'SARMs', 'Esteroides', 'Hormona de crecimiento').</p>
          </div>
        </div>

        <form onSubmit={handleTestCategoryCreation} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Escribe el nombre de una categoría a probar..."
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            className="flex-grow bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Probar Validación
          </button>
        </form>

        {prohibitedTestError && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-xs text-red-300 font-mono animate-shake">
            {prohibitedTestError}
          </div>
        )}
      </div>

      {/* Catalog Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-base text-white">Catálogo Registrado en Sistema</h2>
          <span className="text-xs text-slate-400">Total: {productList.length} productos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Producto / Marca</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Precio Reg.</th>
                <th className="p-4">Lote / Caducidad</th>
                <th className="p-4">Estatus Comercial</th>
                <th className="p-4">Estatus COFEPRIS</th>
                <th className="p-4 text-right">Acciones de Aprobación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {productList.map(product => (
                <tr key={product.id} className="hover:bg-slate-900/40 transition-colors">
                  
                  {/* Name */}
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{product.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">SKU: {product.variants?.[0]?.sku || 'N/A'}</div>
                  </td>

                  {/* Category */}
                  <td className="p-4 font-medium text-slate-300">
                    {product.category?.name}
                  </td>

                  {/* Price */}
                  <td className="p-4 font-bold text-white">
                    ${product.price_regular.toFixed(2)}
                  </td>

                  {/* Lot / Expiration */}
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <RefreshCw className="w-3 h-3 text-emerald-400" /> EXN-2026-09
                    </span>
                  </td>

                  {/* Commercial status */}
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      product.commercial_status === 'activo'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {product.commercial_status}
                    </span>
                  </td>

                  {/* Regulatory status */}
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${
                      product.regulatory_status === 'aprobado'
                        ? 'badge-aprobado'
                        : product.regulatory_status === 'pendiente'
                        ? 'badge-pendiente'
                        : 'badge-rechazado'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {product.regulatory_status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right space-x-2">
                    {product.regulatory_status !== 'aprobado' && (
                      <button
                        onClick={() => handleUpdateStatus(product.id, 'aprobado')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 font-bold transition-all"
                      >
                        Aprobar
                      </button>
                    )}

                    {product.regulatory_status !== 'rechazado' && (
                      <button
                        onClick={() => handleUpdateStatus(product.id, 'rechazado')}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 font-bold transition-all"
                      >
                        Rechazar
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
