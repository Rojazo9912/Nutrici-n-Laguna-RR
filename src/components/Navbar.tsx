'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/StoreProvider';
import { ShoppingBag, Search, ShieldCheck, User, Menu, X, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  cartCount?: number;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { count: cartCount } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      {/* Top Banner - Regulatory Compliance Notice */}
      <div className="bg-red-950/80 text-red-300 text-xs py-1.5 px-4 text-center border-b border-red-800/40 flex items-center justify-center gap-2 font-medium">
        <ShieldCheck className="w-4 h-4 text-red-400" />
        <span>Nutrición Laguna RR: Suplementos, Proteínas y Vitaminas</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo with Image */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-red-600/80 shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform bg-black">
              <img
                src="/logo.jpg"
                alt="Nutrición Laguna RR Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-xl tracking-tight text-white">NUTRICION</span>
                <span className="font-black text-xl tracking-tight text-red-600">LAGUNA</span>
              </div>
              <span className="text-[10px] tracking-widest text-slate-400 font-semibold block -mt-1 uppercase">
                Suplementos • Proteínas • Vitaminas
              </span>
            </div>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-red-500 transition-colors">Inicio</Link>
            <Link href="/productos" className="hover:text-red-500 transition-colors">Catálogo</Link>
            <Link href="/productos?categoria=proteinas" className="hover:text-red-500 transition-colors">Proteínas</Link>
            <Link href="/productos?categoria=creatina" className="hover:text-red-500 transition-colors">Creatina</Link>
            <Link href="/admin/productos" className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors bg-amber-950/40 border border-amber-800/50 px-3 py-1 rounded-full text-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              Panel Regulatorio
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-4">
            {/* Quick Search */}
            <Link href="/productos" className="p-2 text-slate-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </Link>

            {/* Account Link */}
            <Link href="/cuenta" className="p-2 text-slate-400 hover:text-white transition-colors hidden sm:block">
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Icon with Counter */}
            <Link href="/carrito" className="relative p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-red-900/50 text-white transition-all">
              <ShoppingBag className="w-5 h-5 text-red-500" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-red-600/50">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-zinc-800 px-4 pt-2 pb-6 space-y-3">
          <Link href="/" className="block py-2 text-slate-200 hover:text-red-500 font-medium" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
          <Link href="/productos" className="block py-2 text-slate-200 hover:text-red-500 font-medium" onClick={() => setMobileMenuOpen(false)}>Catálogo Completo</Link>
          <Link href="/carrito" className="block py-2 text-slate-200 hover:text-red-500 font-medium" onClick={() => setMobileMenuOpen(false)}>Ver Carrito</Link>
          <Link href="/admin/productos" className="block py-2 text-amber-400 hover:text-amber-300 font-medium" onClick={() => setMobileMenuOpen(false)}>Administración</Link>
        </div>
      )}
    </header>
  );
};
