'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore, CatalogStatus } from '@/components/StoreProvider';
import { ProductCard } from '@/components/ProductCard';
import { Search, Filter, ShieldCheck, X } from 'lucide-react';
import { Product } from '@/types/database.types';

function Catalog() {
  const { products, categories, brands, add, loading, error } = useStore();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);
  useEffect(() => { setSelectedCategory(searchParams.get('categoria') || 'all'); }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // PRD Security Policy: In public catalog, ONLY show active products approved by regulatory review
      const isApproved = product.commercial_status === 'activo' && product.regulatory_status === 'aprobado';
      if (!isApproved) return false;

      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description_short.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory || product.category?.slug === selectedCategory;
      const matchesBrand = selectedBrand === 'all' || product.brand_id === selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand]);

  const handleAddToCart = (product: Product) => {
    if (!add(product)) { setNotification('No hay más unidades disponibles.'); return; }
    setNotification(`¡"${product.name}" agregado al carrito!`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border border-emerald-500/50 bg-slate-900/95 text-emerald-400 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Filtro Regulado: Productos 100% Autorizados</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Catálogo de Suplementos</h1>
        <p className="text-sm text-slate-400 mt-1">Explora proteínas, creatina, aminoácidos y fórmulas de bienestar probadas.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por producto, ingrediente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Brand Selector */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">Todas las Marcas</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Active Filters */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Mostrando <strong className="text-white">{filteredProducts.length}</strong> suplementos verificados</span>
        {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchTerm) && (
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setSearchTerm(''); }}
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Limpiar Filtros
          </button>
        )}
      </div>

      {/* Grid of Filtered Products */}
      <CatalogStatus />
      {loading || error ? null : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <Filter className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No se encontraron productos</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Intenta cambiar los términos de búsqueda o selecciona otra categoría o marca.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return <Suspense fallback={<p className="p-8">Cargando catálogo…</p>}><Catalog /></Suspense>;
}
