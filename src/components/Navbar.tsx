'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/StoreProvider';
import { ShoppingBag, Search, ShieldCheck, User, Menu, X, ShieldAlert, Sparkles, Truck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { count: cartCount } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      {/* Top Banner - Shipping & Trust Incentive */}
      <div className="bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 text-zinc-300 text-xs py-1.5 px-4 text-center border-b border-red-900/40 flex items-center justify-center gap-4 font-medium tracking-wide">
        <div className="flex items-center gap-1.5 text-red-400">
          <Truck className="w-3.5 h-3.5" />
          <span>Envío GRATIS desde $1,500 MXN</span>
        </div>
        <span className="hidden sm:inline text-zinc-700">•</span>
        <div className="hidden sm:flex items-center gap-1.5 text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Garantía de Autenticidad y Caducidad</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo with Image and Sports Typography */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-red-600/60 shadow-lg shadow-red-600/25 group-hover:scale-105 group-hover:border-red-500 transition-all duration-300 bg-black shrink-0">
              <img
                src="/logo.jpg"
                alt="Nutrición Laguna RR Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white font-display">NUTRICIÓN</span>
                <span className="font-extrabold text-xl tracking-tight text-red-500 font-display">LAGUNA</span>
              </div>
              <span className="text-[10px] tracking-widest text-zinc-400 font-semibold block -mt-1 uppercase">
                Sport Nutrition & Wellness
              </span>
            </div>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-zinc-300">
            <Link href="/" className="hover:text-red-400 transition-colors py-1 relative group">
              Inicio
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/productos" className="hover:text-red-400 transition-colors py-1 relative group">
              Catálogo
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/productos?categoria=proteinas" className="hover:text-red-400 transition-colors py-1 relative group">
              Proteínas
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/productos?categoria=creatina" className="hover:text-red-400 transition-colors py-1 relative group">
              Creatina
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/admin/productos"
              className="flex items-center gap-1.5 text-amber-400/90 hover:text-amber-300 transition-all bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 px-3 py-1 rounded-full text-xs font-medium"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Panel Regulatorio</span>
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Search */}
            <Link
              href="/productos"
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
              title="Buscar productos"
              aria-label="Buscar productos"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Account Link */}
            <Link
              href="/cuenta"
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all hidden sm:flex items-center gap-2"
              title="Mi Cuenta"
              aria-label="Mi Cuenta"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Icon with Dynamic Counter & Glow */}
            <Link
              href="/carrito"
              className={`relative p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                cartCount > 0
                  ? 'bg-zinc-900/90 border-red-600/60 shadow-lg shadow-red-600/20 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
              aria-label={`Ver carrito con ${cartCount} productos`}
            >
              <ShoppingBag className={`w-5 h-5 ${cartCount > 0 ? 'text-red-500' : 'text-zinc-400'}`} />
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-red-600/50 animate-pulse-subtle">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl md:hidden text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-zinc-800/80 px-5 pt-3 pb-6 space-y-2 animate-scale-in">
          <Link
            href="/"
            className="flex items-center justify-between py-2.5 px-3 rounded-lg text-zinc-200 hover:bg-zinc-900 hover:text-red-400 font-semibold text-sm transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Inicio
          </Link>
          <Link
            href="/productos"
            className="flex items-center justify-between py-2.5 px-3 rounded-lg text-zinc-200 hover:bg-zinc-900 hover:text-red-400 font-semibold text-sm transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Catálogo Completo
          </Link>
          <Link
            href="/productos?categoria=proteinas"
            className="flex items-center justify-between py-2.5 px-3 rounded-lg text-zinc-200 hover:bg-zinc-900 hover:text-red-400 font-semibold text-sm transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Proteínas
          </Link>
          <Link
            href="/productos?categoria=creatina"
            className="flex items-center justify-between py-2.5 px-3 rounded-lg text-zinc-200 hover:bg-zinc-900 hover:text-red-400 font-semibold text-sm transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Creatina
          </Link>
          <Link
            href="/carrito"
            className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-zinc-900 border border-red-900/40 text-red-400 font-semibold text-sm transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Ver Carrito de Compra</span>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/productos"
            className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-amber-400 hover:bg-amber-950/30 text-xs font-medium transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Módulo de Administración Regulatoria</span>
          </Link>
        </div>
      )}
    </header>
  );
};
