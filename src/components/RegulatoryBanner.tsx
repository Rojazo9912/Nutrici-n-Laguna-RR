import React from 'react';
import { ShieldCheck, FileCheck, Lock, AlertOctagon } from 'lucide-react';

export const RegulatoryBanner: React.FC = () => {
  return (
    <section className="my-12 glass-panel rounded-3xl p-8 border border-red-600/30 relative overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
        <div className="space-y-4 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>Marco Regulatorio y Seguridad Sanitaria (Sección 5 PRD)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transparencia Total: Ningún Suplemento sin Validación COFEPRIS
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            En <strong className="text-red-500">Nutrición Laguna RR</strong>, la protección al consumidor y el cumplimiento de la Ley General de Salud condicionan nuestro modelo de catálogo desde el día uno. Cada producto publicado cuenta con trazabilidad de lotes, fecha de caducidad y estatus regulatorio verificado.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-start gap-2.5 text-left">
              <FileCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">Revisión Sanitaria</span>
                <span className="text-[11px] text-slate-400">Sin aprobación previa, el producto no pasa a catálogo activo.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-left">
              <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">Protección LFPDPPP</span>
                <span className="text-[11px] text-slate-400">Consentimiento explícito y gestión de datos sensibles.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-left">
              <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">Filtro de Exclusión</span>
                <span className="text-[11px] text-slate-400">Bloqueo automático de esteroides, SARMs u hormonas.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Card Visual with Logo */}
        <div className="shrink-0 w-full sm:w-auto">
          <div className="glass-panel p-6 rounded-2xl border border-red-600/40 text-center space-y-3 bg-zinc-950 shadow-2xl">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-600 mx-auto shadow-lg shadow-red-600/30 bg-black">
              <img src="/logo.jpg" alt="Nutrición Laguna RR" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-base font-black text-white block">NUTRICIÓN LAGUNA RR</span>
              <span className="text-xs text-red-400 font-semibold">100% De Venta Libre</span>
            </div>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-zinc-800">
              Verificación Sanitaria & RLS Activa
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
