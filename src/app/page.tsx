'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore, CatalogStatus } from '@/components/StoreProvider';
import { ProductCard } from '@/components/ProductCard';
import { RegulatoryBanner } from '@/components/RegulatoryBanner';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Award,
  Truck,
  CalendarCheck,
  CreditCard,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Product } from '@/types/database.types';
import { MACRO_CATEGORIES, MACRO_CATEGORY_ICONS } from '@/lib/macro-categories';

export default function HomePage() {
  const { products, categories, add } = useStore();
  const [notification, setNotification] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    if (!add(product)) {
      setNotification('No hay más existencias disponibles de este producto.');
      return;
    }
    setNotification(`¡"${product.name}" agregado a tu carrito!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Only display active and approved products on the public homepage
  const publicProducts = products.filter(
    p => p.commercial_status === 'activo' && p.regulatory_status === 'aprobado'
  );

  return (
    <div className="space-y-20 pb-20">
      
      {/* Floating Island Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border border-red-500/60 bg-zinc-950/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-red-950/50 flex items-center gap-3 animate-bounce">
          <div className="w-7 h-7 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{notification}</p>
            <Link href="/carrito" className="text-[11px] text-red-400 hover:text-red-300 font-bold underline">
              Ver carrito de compra →
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section Athletic & Dynamic */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Ambient Red Glow Mesh */}
        <div className="ambient-glow-red top-10 left-1/2 -translate-x-1/2" />

        <div className="relative z-10 text-center space-y-6 max-w-4xl mx-auto">
          
          {/* Official Verification Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/90 border border-red-600/40 text-xs font-semibold text-zinc-200 shadow-xl shadow-red-950/30 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span>Nutrición Laguna RR • Suplementación Deportiva 100% Original</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] font-display">
            POTENCIA TU FÍSICO AL <br />
            <span className="gradient-text">MÁXIMO NIVEL</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Proteínas aisladas, creatina pura, aminoácidos y pre-entrenamientos seleccionados con riguroso control de lote, fecha de caducidad y autenticidad garantizada.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link
              href="/productos"
              className="w-full sm:w-auto px-8 py-4 rounded-xl glow-button text-white font-black text-base flex items-center justify-center gap-2 group tracking-wide"
            >
              <span>Explorar Catálogo Completo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/productos?categoria=proteinas"
              className="w-full sm:w-auto px-7 py-4 rounded-xl glass-panel hover:bg-zinc-900/80 border border-zinc-800 text-zinc-200 hover:text-white font-bold text-base transition-all flex items-center justify-center gap-2 hover:border-zinc-700"
            >
              <Flame className="w-5 h-5 text-red-500" />
              <span>Ver Proteínas Más Vendidas</span>
            </Link>
          </div>

          {/* Four Trust Pillars */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t border-zinc-800/80 max-w-4xl mx-auto">
            <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 text-left space-y-1">
              <div className="w-8 h-8 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-400 mb-2">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Envíos a Todo México</h4>
              <p className="text-xs text-zinc-400">Gratis en compras desde $1,500 MXN con guía rastreable.</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 text-left space-y-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Lote & Caducidad</h4>
              <p className="text-xs text-zinc-400">Trazabilidad FEFO. Sin lotes vencidos ni cerca de expirar.</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 text-left space-y-1">
              <div className="w-8 h-8 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-400 mb-2">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">100% Auténtico</h4>
              <p className="text-xs text-zinc-400">Fórmulas directas de laboratorio con sellos de garantía.</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 text-left space-y-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                <CreditCard className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Pago Protegido</h4>
              <p className="text-xs text-zinc-400">Checkout Pro de Mercado Pago con tarjetas, OXXO o transferencia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section aria-labelledby="featured-categories" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-500">
              Líneas de Suplementación
            </p>
            <h2 id="featured-categories" className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
              Categorías Principales
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Selecciona tu objetivo y encuentra las presentaciones óptimas para tu rutina.
            </p>
          </div>
          <Link
            href="/productos"
            className="group inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-bold text-zinc-200 transition-all hover:border-red-500/60 hover:text-white"
          >
            <span>Ver todo el catálogo</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-red-500" />
          </Link>
        </div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 sm:overflow-visible sm:px-0">
          {MACRO_CATEGORIES.map(cat => {
            const IconComponent = MACRO_CATEGORY_ICONS[cat.iconName] || Zap;
            return (
              <Link
                key={cat.id}
                href={`/productos?categoria=${cat.slug}`}
                aria-label={`Ver productos de ${cat.title}`}
                className="group relative min-w-[240px] snap-start overflow-hidden rounded-2xl glass-card p-5 transition-all duration-300 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:min-w-0 flex flex-col justify-between"
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-red-600/10 blur-xl transition-all duration-300 group-hover:bg-red-600/25" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-gradient-to-tr from-red-600/20 to-red-900/20 text-red-400 transition-all duration-300 group-hover:scale-110 group-hover:border-red-500 group-hover:text-red-300 shadow-md">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400/90 bg-red-950/40 border border-red-900/40 px-2 py-0.5 rounded-md">
                      {cat.badgeText}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-base font-bold text-white transition-colors group-hover:text-red-400 font-display">
                    {cat.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-auto flex items-center justify-between text-xs font-semibold text-red-400 group-hover:text-red-300">
                  <span>Explorar línea</span>
                  <span className="transform transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Regulatory Banner (COFEPRIS & Sanidad) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RegulatoryBanner />
      </div>

      {/* Featured Products Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-widest mb-1">
              <Award className="w-4 h-4" />
              Selección Oficial
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
              Suplementos Destacados
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Fórmulas verificadas con stock disponible para despacho inmediato.
            </p>
          </div>

          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-zinc-900 hover:bg-zinc-800 px-5 py-3 rounded-xl border border-zinc-800 transition-all hover:border-red-600/40 self-start sm:self-auto"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-4 h-4 text-red-500" />
          </Link>
        </div>

        <CatalogStatus />

        {publicProducts.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-zinc-800 space-y-3">
            <ShieldCheck className="w-10 h-10 text-zinc-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Actualizando Catálogo</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Los productos se encuentran en proceso de revisión regulatoria y actualización de lotes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust & AI Roadmap Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-red-950/60 bg-gradient-to-br from-zinc-950 via-zinc-900/60 to-red-950/25 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-red-600/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 text-red-400 text-xs font-bold border border-red-900/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Innovación Continua</span>
              </div>
              <h3 className="text-2xl font-black text-white font-display">
                Asesoría de Suplementación Inteligente
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Estamos implementando un recomendador digital diseñado para ayudarte a elegir la combinación exacta de proteína, creatina y suplementos según tu peso, objetivo y frecuencia de entrenamiento, bajo supervisión regulatoria.
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-3">
              <span className="px-4 py-2 rounded-xl bg-red-600/15 text-red-300 border border-red-600/30 text-xs font-bold">
                Próximamente en Fase 2
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
