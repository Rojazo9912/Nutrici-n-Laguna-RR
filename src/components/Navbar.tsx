'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, ShieldCheck, User, Menu, X, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  cartCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount = 2 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      {/* Top Banner - Regulatory Compliance Notice */}
      <div className="bg-emerald-950/80 text-emerald-400 text-xs py-1.5 px-4 text-center border-b border-emerald-800/40 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Garantía Nutrición Laguna RR: Productos 100% Verificados en Cumplimiento Sanitario COFEPRIS</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center font-black text-sm text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              NLRR
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block">NUTRICIÓN LAGUNA</span>
              <span className="text-[10px] tracking-widest text-emerald-400 font-semibold block -mt-1">SUPLEMENTOS & BIENESTAR</span>
            </div>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Inicio</Link>
            <Link href="/productos" className="hover:text-emerald-400 transition-colors">Catálogo</Link>
            <Link href="/productos?categoria=proteinas" className="hover:text-emerald-400 transition-colors">Proteínas</Link>
            <Link href="/productos?categoria=creatina" className="hover:text-emerald-400 transition-colors">Creatina</Link>
            <Link href="/admin/productos" className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-full text-xs">
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
            <Link href="/carrito" className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white transition-all">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
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
        <div className="md:hidden glass-panel border-t border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <Link href="/" className="block py-2 text-slate-200 hover:text-emerald-400" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
          <Link href="/productos" className="block py-2 text-slate-200 hover:text-emerald-400" onClick={() => setMobileMenuOpen(false)}>Catálogo Completo</Link>
          <Link href="/carrito" className="block py-2 text-slate-200 hover:text-emerald-400" onClick={() => setMobileMenuOpen(false)}>Ver Carrito</Link>
          <Link href="/admin/productos" className="block py-2 text-amber-400 hover:text-amber-300 font-medium" onClick={() => setMobileMenuOpen(false)}> Panel Regulatorio COFEPRIS</Link>
        </div>
      )}
    </header>
  );
};
