'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/database.types';
import { availableStock, unitPrice } from '@/lib/commerce';
import { ShieldCheck, ShoppingBag, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [justAdded, setJustAdded] = useState(false);
  const primaryImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800';
  const mainVariant = product.variants?.[0];
  const currentPrice = unitPrice(product, mainVariant);
  const regularPrice = product.price_regular;
  const hasPromo = product.price_promo !== null && product.price_promo !== undefined && product.price_promo < regularPrice;
  const stock = availableStock(mainVariant);
  const isOutOfStock = stock === 0;

  // Calculate discount percentage
  const discountPercent = hasPromo && regularPrice > 0
    ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || !onAddToCart) return;
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden group transition-all duration-300 flex flex-col h-full relative">
      
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 p-6 flex items-center justify-center border-b border-zinc-800/60">
        
        {/* Subtle radial ambient shine */}
        <div className="absolute inset-0 bg-radial-gradient from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Regulatory Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/90 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wide backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Verificado</span>
          </span>
        </div>

        {/* Discount badge */}
        {hasPromo && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
            <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-lg shadow-red-600/40">
              {discountPercent > 0 ? `-${discountPercent}%` : 'OFERTA'}
            </span>
          </div>
        )}

        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4 group-hover:scale-108 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Product Information */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-1.5">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">
              {product.brand?.name || 'Nutrición Laguna'}
            </span>
            {/* Stock pill */}
            <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-red-500' : stock <= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {isOutOfStock ? 'Agotado' : stock <= 5 ? `Últimas ${stock} pzas` : 'Disponible'}
            </span>
          </div>

          {/* Title */}
          <Link href={`/productos/${product.slug}`} className="block group-hover:text-red-400 transition-colors">
            <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          {product.description_short && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {product.description_short}
            </p>
          )}

          {/* Variant tag */}
          {mainVariant && (mainVariant.flavor || mainVariant.presentation || mainVariant.size) && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 font-medium">
                {mainVariant.flavor || mainVariant.presentation || 'Estándar'}
                {mainVariant.size && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400">{mainVariant.size}</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Price & Cart CTA */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium block">
              Precio Online
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white tracking-tight">
                ${currentPrice.toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-zinc-400">MXN</span>
              {hasPromo && (
                <span className="text-xs text-zinc-500 line-through">
                  ${regularPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40'
                : 'glow-button text-white'
            }`}
            title={isOutOfStock ? 'Producto agotado' : 'Agregar al carrito'}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 animate-scale-in" />
                <span>¡Listo!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
