import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Truck, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm mt-20">
      
      {/* Guarantees section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-900 grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Revisión Regulatoria COFEPRIS</h4>
            <p className="text-xs text-slate-500">Solo suplementos permitidos de venta libre</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <Lock className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Pagos Seguros con Webhook</h4>
            <p className="text-xs text-slate-500">Confirmación criptográfica verificada</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <Truck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Envío Rápido y Rastreado</h4>
            <p className="text-xs text-slate-500">Cobertura nacional garantizada</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Lotes y Caducidades</h4>
            <p className="text-xs text-slate-500">Garantía de frescura en cada producto</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-xs">
              NLRR
            </div>
            <span className="font-bold text-base text-white">NUTRICIÓN LAGUNA RR</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Plataforma especializada en venta de suplementos deportivos, proteínas, aminoácidos y productos de bienestar con riguroso cumplimiento normativo.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-4">Catálogo</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/productos?categoria=proteinas" className="hover:text-emerald-400">Proteínas Aisladas y Whey</Link></li>
            <li><Link href="/productos?categoria=creatina" className="hover:text-emerald-400">Creatina Monohidratada</Link></li>
            <li><Link href="/productos?categoria=pre-entrenamientos" className="hover:text-emerald-400">Pre-Entrenamientos</Link></li>
            <li><Link href="/productos?categoria=salud-bienestar" className="hover:text-emerald-400">Omega 3 & Multivitamínicos</Link></li>
          </ul>
        </div>

        {/* Legal & Privacy */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-4">Cumplimiento & Legales</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/privacidad" className="hover:text-emerald-400">Aviso de Privacidad (LFPDPPP)</Link></li>
            <li><Link href="/derechos-arco" className="hover:text-emerald-400">Derechos ARCO</Link></li>
            <li><Link href="/terminos" className="hover:text-emerald-400">Términos y Condiciones</Link></li>
            <li><Link href="/regulacion-cofepris" className="hover:text-emerald-400">Política de Revisión Sanitaria</Link></li>
          </ul>
        </div>

        {/* Excluded Substances Statement (PRD Section 5.0) */}
        <div>
          <h4 className="font-semibold text-amber-400 mb-4 flex items-center gap-1">
            <span>Aviso de Sustancias Excluidas</span>
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-500 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            Esta plataforma comercializa exclusivamente suplementos de venta libre. Queda estrictamente prohibida y excluida por diseño la carga o venta de esteroides anabólicos, SARMs, hormonas de crecimiento o sustancias controladas por la Ley General de Salud.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-slate-950 py-6 border-t border-slate-900 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Nutrición Laguna RR. Todos los derechos reservados.
      </div>
    </footer>
  );
};
