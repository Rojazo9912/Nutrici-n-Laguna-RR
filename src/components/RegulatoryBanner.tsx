import React from 'react';
import { ShieldCheck, FileCheck, Lock, AlertOctagon } from 'lucide-react';

export const RegulatoryBanner: React.FC = () => {
  return (
    <section className="my-12 glass-panel rounded-3xl p-8 border border-emerald-500/20 relative overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
        <div className="space-y-4 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Marco Regulatorio y Seguridad Sanitaria (Sección 5 PRD)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transparencia Total: Ningún Suplemento sin Validación COFEPRIS
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            En <strong className="text-emerald-400">Nutrición Laguna RR</strong>, la protección al consumidor y el cumplimiento de la Ley General de Salud condicionan nuestro modelo de catálogo desde el día uno. Cada producto publicado cuenta con trazabilidad de lotes, fecha de caducidad y estatus regulatorio verificado.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-start gap-2.5 text-left">
              <FileCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs text-white block">Revisión Sanitaria</span>
                <span className="text-[11px] text-slate-400">Sin aprobación previa, el producto no pasa a catálogo activo.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-left">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
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

        {/* Badge Card Visual */}
        <div className="shrink-0 w-full sm:w-auto">
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 text-center space-y-3 bg-slate-900/90 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">100% De Venta Libre</span>
              <span className="text-xs text-emerald-400 font-medium">Verificación Sanitaria en Regla</span>
            </div>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800">
              Registro RLS & Auditoría DB Activa
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
