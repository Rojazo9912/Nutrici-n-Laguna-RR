'use client';

import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { ShieldCheck, ShoppingCart, Check, RefreshCw, AlertCircle, ArrowLeft, Truck, Award } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  // Find product by slug or default to first product
  const product = MOCK_PRODUCTS.find(p => p.slug === params.slug) || MOCK_PRODUCTS[0];
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const selectedVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];
  const hasPromo = product.price_promo !== null && product.price_promo !== undefined && product.price_promo < product.price_regular;
  const activePrice = selectedVariant?.price_override || (hasPromo ? product.price_promo! : product.price_regular);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Back Button */}
      <Link href="/productos" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Image & Badges */}
        <div className="space-y-4">
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex items-center justify-center bg-slate-900/60 relative aspect-square overflow-hidden">
            
            {/* COFEPRIS Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="badge-aprobado text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <ShieldCheck className="w-4 h-4" />
                Aprobación Sanitaria COFEPRIS
              </span>
            </div>

            <img
              src={product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800'}
              alt={product.name}
              className="w-full h-full object-contain max-h-[420px]"
            />
          </div>

          {/* Consumable Lot & Expiration Card (PRD Section 3.5 & 5.0 Requirement) */}
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-slate-900/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Trazabilidad de Lote Activo</span>
                <span className="text-slate-400 text-[11px]">Lote: EXN-2026-09A • Caducidad: Octubre 2027</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 font-mono text-[11px] border border-emerald-800">
              Verificado
            </span>
          </div>
        </div>

        {/* Right Column: Details & Variant Selection */}
        <div className="space-y-6">
          
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              {product.brand?.name || 'Extrem Labs'}
            </span>
            <h1 className="text-3xl font-extrabold text-white leading-tight">{product.name}</h1>
            
            <p className="text-xs text-slate-400 mt-2 font-mono">
              SKU: {selectedVariant?.sku || 'N/A'} • Categoría: {product.category?.name}
            </p>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-baseline gap-4">
            <span className="text-3xl font-black text-white">${activePrice.toFixed(2)} MXN</span>
            {hasPromo && (
              <span className="text-base text-slate-500 line-through">
                ${product.price_regular.toFixed(2)} MXN
              </span>
            )}
            <span className="text-xs text-emerald-400 font-semibold ml-auto">
              ✓ Envío Inmediato
            </span>
          </div>

          {/* Short Description */}
          <p className="text-sm text-slate-300 leading-relaxed">
            {product.description_short}
          </p>

          {/* Variant Selector (Flavors / Sizes) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Selecciona Sabor y Presentación:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      selectedVariantIndex === idx
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{variant.flavor || variant.presentation}</span>
                    <span className="text-slate-500 ml-1.5">({variant.size})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Stock disponible en almacén principal: <strong className="text-white">{selectedVariant?.stock_available || 45} unidades</strong></span>
          </div>

          {/* Add to Cart CTA */}
          <div className="pt-2">
            <button
              onClick={handleAdd}
              disabled={added}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-80"
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>¡Agregado al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Agregar al Carrito • ${(activePrice).toFixed(2)} MXN</span>
                </>
              )}
            </button>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Despacho en 24 Horas</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Sustancias Libres de Dopaje</span>
            </div>
          </div>

        </div>
      </div>

      {/* Description & Detailed Information Tab */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-xl font-bold text-white">Detalles del Producto e Información Nutrimental</h3>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {product.description_long || product.description_short}
        </p>

        {/* Legal Disclaimer per PRD Section 5 */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Aviso Legal y de Salud:</p>
          <p>Este producto es un suplemento alimenticio y no es un medicamento. El consumo de este producto es responsabilidad de quien lo recomienda y de quien lo usa.</p>
        </div>
      </div>

    </div>
  );
}
