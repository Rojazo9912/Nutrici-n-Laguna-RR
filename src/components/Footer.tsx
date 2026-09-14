import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Truck, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-slate-400 border-t border-red-950/60 text-sm mt-20">
      
      {/* Guarantees section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-zinc-900 grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Revisión Regulatoria COFEPRIS</h4>
            <p className="text-xs text-slate-500">Solo suplementos permitidos de venta libre</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <Lock className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Pagos Seguros con Webhook</h4>
            <p className="text-xs text-slate-500">Confirmación criptográfica verificada</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <Truck className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Envío Rápido y Rastreado</h4>
            <p className="text-xs text-slate-500">Cobertura nacional garantizada</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <RefreshCw className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-200">Lotes y Caducidades</h4>
            <p className="text-xs text-slate-500">Garantía de frescura en cada producto</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand info with Logo Image */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-red-600 shrink-0 bg-black">
              <img src="/logo.jpg" alt="Nutrición Laguna RR" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-black text-base text-white block">NUTRICIÓN <span className="text-red-600">LAGUNA RR</span></span>
              <span className="text-[10px] text-slate-400 block tracking-widest -mt-1">SUPLEMENTOS • PROTEÍNAS • VITAMINAS</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Plataforma oficial de venta de suplementos deportivos, proteínas, creatinas y productos de bienestar de Nutrición Laguna RR.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-4">Catálogo</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/productos?categoria=proteinas" className="hover:text-red-500">Proteínas Aisladas y Whey</Link></li>
            <li><Link href="/productos?categoria=creatina" className="hover:text-red-500">Creatina Monohidratada</Link></li>
            <li><Link href="/productos?categoria=pre-entrenamientos" className="hover:text-red-500">Pre-Entrenamientos</Link></li>
            <li><Link href="/productos?categoria=salud-bienestar" className="hover:text-red-500">Omega 3 & Multivitamínicos</Link></li>
          </ul>
        </div>

        {/* Legal & Privacy */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-4">Cumplimiento & Legales</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/privacidad" className="hover:text-red-500">Aviso de Privacidad (LFPDPPP)</Link></li>
            <li><Link href="/derechos-arco" className="hover:text-red-500">Derechos ARCO</Link></li>
            <li><Link href="/terminos" className="hover:text-red-500">Términos y Condiciones</Link></li>
            <li><Link href="/regulacion-cofepris" className="hover:text-red-500">Política de Revisión Sanitaria</Link></li>
          </ul>
        </div>

        {/* Excluded Substances Statement */}
        <div>
          <h4 className="font-semibold text-red-500 mb-4 flex items-center gap-1">
            <span>Aviso de Sustancias Excluidas</span>
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-400 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            Esta plataforma comercializa exclusivamente suplementos de venta libre. Queda estrictamente prohibida y excluida por diseño la carga o venta de esteroides anabólicos, SARMs, hormonas de crecimiento o sustancias controladas por la Ley General de Salud.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black py-6 border-t border-zinc-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Nutrición Laguna RR. Todos los derechos reservados.
      </div>
    </footer>
  );
};
