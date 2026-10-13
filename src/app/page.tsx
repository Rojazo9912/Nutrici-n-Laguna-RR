'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore, CatalogStatus } from '@/components/StoreProvider';
import { ProductCard } from '@/components/ProductCard';
import { RegulatoryBanner } from '@/components/RegulatoryBanner';
import { ArrowRight, Flame, ShieldCheck, Zap, Sparkles, Award } from 'lucide-react';
import { Product } from '@/types/database.types';

export default function HomePage() {
  const { products, categories, add } = useStore();
  const [notification, setNotification] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    if (!add(product)) { setNotification('No hay más unidades disponibles.'); return; }
    setNotification(`¡"${product.name}" agregado al carrito de compras!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Only display active and approved products on the public homepage
  const publicProducts = products.filter(
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
            Suplementos deportivos, proteínas, creatina, pre-entrenamientos y multivitaminas. Explora el catálogo y elige tu presentación.
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
              <span className="text-xs text-slate-400">Revisión interna</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">24/7</span>
              <span className="text-xs text-slate-400">Envíos Seguros</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">Lote & Exp</span>
              <span className="text-xs text-slate-400">Control de consumibles</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">MXN</span>
              <span className="text-xs text-slate-400">Precios en pesos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section aria-labelledby="featured-categories" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-red-400">Encuentra tu objetivo</p>
            <h2 id="featured-categories" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Categorías destacadas</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Explora nuestras líneas de suplementación y encuentra lo que necesitas para tu entrenamiento.</p>
          </div>
          <Link href="/productos" className="group inline-flex w-fit items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-red-500 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            Ver catálogo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {categories.slice(0, 10).map(cat => (
            <Link key={cat.id} href={`/productos?categoria=${cat.slug}`} aria-label={`Ver productos de ${cat.name}`} className="group relative min-w-[220px] snap-start overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 transition duration-300 hover:-translate-y-1 hover:border-red-500/60 hover:shadow-[0_12px_35px_rgba(239,68,68,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:min-w-0">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-600/10 blur-2xl transition group-hover:bg-red-600/20" />
              <div className="relative flex min-h-[156px] flex-col">
                <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition group-hover:scale-105 group-hover:bg-red-500/20"><Zap className="h-5 w-5" /></div>
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-white transition group-hover:text-red-300">{cat.name}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{cat.description || 'Suplementos seleccionados para acompañar tu objetivo.'}</p>
                <span className="mt-auto pt-4 text-xs font-semibold text-red-400 opacity-0 transition group-hover:opacity-100">Explorar línea <span aria-hidden="true">→</span></span>
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

        <CatalogStatus />
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
                <span>Próximamente</span>
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
