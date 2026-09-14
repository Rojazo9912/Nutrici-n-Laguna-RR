'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Tag, Plus, Minus } from 'lucide-react';
import { MOCK_PRODUCTS } from '@/data/mockData';

export default function CartPage() {
  const [items, setItems] = useState([
    {
      product: MOCK_PRODUCTS[0], // Gold Standard Whey
      variant: MOCK_PRODUCTS[0].variants![0],
      quantity: 1,
    },
    {
      product: MOCK_PRODUCTS[1], // Creatine
      variant: MOCK_PRODUCTS[1].variants![0],
      quantity: 1,
    }
  ]);

  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  const updateQuantity = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => {
    const price = item.product.price_promo || item.product.price_regular;
    return acc + (price * item.quantity);
  }, 0);

  const discount = discountApplied ? subtotal * 0.10 : 0;
  const shippingThreshold = 1500;
  const shippingCost = subtotal >= shippingThreshold || subtotal === 0 ? 0 : 150;
  const total = subtotal - discount + shippingCost;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'EXTREM10' || couponCode.toUpperCase() === 'DESCUENTO10') {
      setDiscountApplied(true);
    } else {
      alert('Cupón no válido. Intenta con EXTREM10');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Tu Carrito de Compras</h1>
          <p className="text-xs text-slate-400">Revisa tus productos y aplica cupones antes del checkout</p>
        </div>
      </div>

      {/* Free shipping progress bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex justify-between text-xs text-slate-300">
          <span>
            {subtotal >= shippingThreshold
              ? '🎉 ¡Felicidades! Tienes Envío GRATIS en tu pedido'
              : `Agrega $${(shippingThreshold - subtotal).toFixed(2)} MXN más para obtener Envío GRATIS`}
          </span>
          <span className="font-semibold text-emerald-400">{Math.min(100, Math.round((subtotal / shippingThreshold) * 100))}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
          ></div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, idx) => {
              const unitPrice = item.product.price_promo || item.product.price_regular;
              return (
                <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.product.images?.[0]?.image_url}
                      alt={item.product.name}
                      className="w-20 h-20 object-contain rounded-xl bg-slate-900/60 p-2 shrink-0 border border-slate-800"
                    />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.product.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{item.variant.flavor || item.variant.presentation} • {item.variant.size}</p>
                      <span className="text-xs font-bold text-emerald-400 block mt-2">${unitPrice.toFixed(2)} MXN c/u</span>
                    </div>
                  </div>

                  {/* Quantity Controls & Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                      <button onClick={() => updateQuantity(idx, -1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-white w-24 text-right">
                      ${(unitPrice * item.quantity).toFixed(2)}
                    </span>

                    <button onClick={() => removeItem(idx)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary & Coupon Card */}
          <div className="space-y-6">
            
            {/* Coupon Application Form */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" /> Cupón de Descuento
              </h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. EXTREM10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-grow bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-emerald-500"
                />
                <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-slate-700">
                  Aplicar
                </button>
              </form>
              {discountApplied && (
                <p className="text-xs text-emerald-400 font-semibold">✓ Cupón EXTREM10 aplicado (-10%)</p>
              )}
            </div>

            {/* Total Summary */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">Resumen del Pedido</h3>
              
              <div className="space-y-2 text-xs text-slate-300 border-b border-slate-800 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)} MXN</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Descuento (10%)</span>
                    <span>-${discount.toFixed(2)} MXN</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Costo de Envío</span>
                  <span>{shippingCost === 0 ? <strong className="text-emerald-400">GRATIS</strong> : `$${shippingCost.toFixed(2)} MXN`}</span>
                </div>
              </div>

              <div className="flex justify-between text-base font-extrabold text-white pt-1">
                <span>Total a Pagar</span>
                <span className="text-emerald-400">${total.toFixed(2)} MXN</span>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Proceder al Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Pago seguro tokenizado (PCI SAQ A)
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-4">
          <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto" />
          <h2 className="text-xl font-bold text-white">Tu carrito está vacío</h2>
          <p className="text-xs text-slate-400">Explora nuestro catálogo verificado y agrega suplementos a tu pedido.</p>
          <Link href="/productos" className="inline-block px-6 py-3 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400">
            Ir al Catálogo
          </Link>
        </div>
      )}

    </div>
  );
}
