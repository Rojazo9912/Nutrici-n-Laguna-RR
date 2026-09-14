'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/data/mockData';
import { ProductCard } from '@/components/ProductCard';
import { RegulatoryBanner } from '@/components/RegulatoryBanner';
import { ArrowRight, Flame, ShieldCheck, Zap, Sparkles, Award } from 'lucide-react';
import { Product } from '@/types/database.types';

export default function HomePage() {
  const [notification, setNotification] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    setNotification(`¡"${product.name}" agregado al carrito de compras!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Only display active and approved products on the public homepage
  const publicProducts = MOCK_PRODUCTS.filter(
    p => p.commercial_status === 'activo' && p.regulatory_status === 'aprobado'
  );

  return (
    <div className="space-y-16 pb-12">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border border-red-500/50 bg-zinc-950/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <ShieldCheck className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Red Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-red-600/20 to-red-900/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 text-center space-y-6 max-w-4xl mx-auto">
          
          {/* Logo Brand Header Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/90 border border-red-600/40 text-xs font-semibold text-white shadow-lg shadow-red-600/10">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-red-500 shrink-0 bg-black">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span>Nutrición Laguna RR • Suplementos, Proteínas y Vitaminas</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Alcanza Tu Máximo Nivel con <span className="gradient-text">Nutrición Laguna RR</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tienda oficial de suplementos deportivos, proteínas de alta pureza, creatina, pre-entrenamientos y multivitaminas con trazabilidad de lotes y cumplimiento sanitario COFEPRIS.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/productos"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-base shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/productos"
              className="w-full sm:w-auto px-6 py-4 rounded-xl glass-panel hover:bg-zinc-900/80 border border-zinc-800 text-slate-200 font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Ver Módulo Regulatorio</span>
            </Link>
          </div>

          {/* Metrics bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-800/80 max-w-3xl mx-auto">
            <div>
              <span className="text-2xl font-black text-white block">100%</span>
              <span className="text-xs text-slate-400">Verificado COFEPRIS</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">24/7</span>
              <span className="text-xs text-slate-400">Envíos Seguros</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">Lote & Exp</span>
              <span className="text-xs text-slate-400">Garantizado en Consumibles</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">&lt; 2.5s</span>
              <span className="text-xs text-slate-400">Velocidad LCP</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Categorías Destacadas</h2>
            <p className="text-xs text-slate-400 mt-1">Selecciona la línea de suplementación para tu objetivo</p>
          </div>
          <Link href="/productos" className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {MOCK_CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              href={`/productos?categoria=${cat.slug}`}
              className="glass-panel p-5 rounded-2xl border border-zinc-800/80 hover:border-red-600/50 hover:bg-zinc-900/80 transition-all text-center space-y-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-900 text-red-500 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-red-600/20 transition-all">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white group-hover:text-red-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Regulatory Banner (PRD Section 5) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RegulatoryBanner />
      </div>

      {/* Featured Products Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              Catálogo Oficial Nutrición Laguna RR
            </div>
            <h2 className="text-2xl font-bold text-white">Suplementos Destacados</h2>
          </div>

          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 rounded-xl border border-zinc-800 transition-all self-start sm:self-auto"
          >
            Explorar Catálogo Completo
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {publicProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

      {/* Post-MVP AI Roadmap Feature Preview (PRD Section 11) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="glass-panel p-8 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-red-950/20 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-red-400 text-xs font-semibold border border-red-900/50">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hoja de Ruta (Fase Posterior PRD 11.0)</span>
              </div>
              <h3 className="text-xl font-bold text-white">Asistente de Compra Inteligente con IA</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Próximamente integraremos recomendaciones personalizadas de suplementación Nutrición Laguna RR según tus objetivos físicos con contenido filtrado regulatoriamente.
              </p>
            </div>
            <div className="shrink-0">
              <span className="px-4 py-2 rounded-xl bg-red-600/20 text-red-300 border border-red-600/30 text-xs font-bold">
                En Desarrollo (Fase 2)
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
