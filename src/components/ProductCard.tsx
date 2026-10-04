'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/database.types';
import { availableStock, unitPrice } from '@/lib/commerce';
import { ShieldCheck, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const primaryImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800';
  const mainVariant = product.variants?.[0];
  const hasPromo = product.price_promo !== null && product.price_promo !== undefined && product.price_promo < product.price_regular;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden group hover:border-red-600/50 transition-all duration-300 flex flex-col h-full hover:shadow-xl hover:shadow-red-950/30">
      
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-zinc-950/80 p-6 flex items-center justify-center border-b border-zinc-800/60">
        
        {/* Regulatory Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="badge-aprobado text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            Revisión interna aprobada
          </span>
        </div>

        {/* Promo tag */}
        {hasPromo && (
          <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md">
            Oferta
          </div>
        )}

        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Product Information */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          {/* Brand */}
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
            {product.brand?.name || 'Laguna Labs'}
          </span>

          {/* Title */}
          <Link href={`/productos/${product.slug}`} className="block mt-1">
            <h3 className="font-bold text-white text-base group-hover:text-red-400 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {product.description_short}
          </p>

          {/* Variant tag */}
          {mainVariant && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-slate-300">
              <span>{mainVariant.flavor || mainVariant.presentation}</span>
              <span>•</span>
              <span className="font-medium text-slate-400">{mainVariant.size}</span>
            </div>
          )}
        </div>

        {/* Price & Cart CTA */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white">
                ${unitPrice(product, mainVariant).toFixed(2)} MXN
              </span>
              {hasPromo && (
                <span className="text-xs text-slate-500 line-through">
                  ${product.price_regular.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-red-400 font-medium block">
              {availableStock(mainVariant) > 0 ? `${availableStock(mainVariant)} disponibles` : 'Agotado'}
            </span>
          </div>

          <button
            disabled={availableStock(mainVariant) === 0}
            onClick={() => onAddToCart && onAddToCart(product)}
            className="p-3 rounded-xl bg-gradient-to-tr from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center"
            title="Agregar al Carrito"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
