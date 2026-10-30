'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore, CatalogStatus } from '@/components/StoreProvider';
import { ProductCard } from '@/components/ProductCard';
import { Search, Filter, ShieldCheck, X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types/database.types';
import { availableStock, unitPrice } from '@/lib/commerce';
import { MACRO_CATEGORIES, productMatchesCategory } from '@/lib/macro-categories';

const ITEMS_PER_PAGE = 24;

function Catalog() {
  const { products, brands, add, loading, error } = useStore();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(searchParams.get('categoria') || 'all');
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, sortBy]);

  const filteredProducts = useMemo(() => {
    const list = products.filter(product => {
      // PRD Security Policy: In public catalog, ONLY show active products approved by regulatory review
      const isApproved = product.commercial_status === 'activo' && product.regulatory_status === 'aprobado';
      if (!isApproved) return false;

      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description_short && product.description_short.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = productMatchesCategory(product, selectedCategory);
      const matchesBrand = selectedBrand === 'all' || product.brand_id === selectedBrand;

      return matchesSearch && matchesCategory && matchesBrand;
    });

    // Sorting logic
    if (sortBy === 'price-asc') {
      list.sort((a, b) => unitPrice(a, a.variants?.[0]) - unitPrice(b, b.variants?.[0]));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => unitPrice(b, b.variants?.[0]) - unitPrice(a, a.variants?.[0]));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Featured default: stock first, then products with images
      list.sort((a, b) => {
        const aStock = availableStock(a.variants?.[0]) > 0 ? 1 : 0;
        const bStock = availableStock(b.variants?.[0]) > 0 ? 1 : 0;
        if (aStock !== bStock) return bStock - aStock;
        const aHasImg = (a.images?.length ?? 0) > 0 ? 1 : 0;
        const bHasImg = (b.images?.length ?? 0) > 0 ? 1 : 0;
        return bHasImg - aHasImg;
      });
    }

    return list;
  }, [products, searchTerm, selectedCategory, selectedBrand, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!add(product)) {
      setNotification('No hay más existencias disponibles.');
      return;
    }
    setNotification(`¡"${product.name}" agregado al carrito!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSearchTerm('');
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border border-red-500/60 bg-zinc-950/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-6 h-6 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-red-600/40 text-red-400 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          <span>Catálogo de Fórmulas Verificadas • Revisión Sanitaria 100% Aprobada</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
          Catálogo Oficial de Suplementación
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Proteínas de suero, creatina monohidratada, aminoácidos esenciales y pre-entrenamientos con existencias reales y caducidad garantizada.
        </p>
      </div>

      {/* Quick Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
          }`}
        >
          Todos los Suplementos
        </button>
        {MACRO_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.slug
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-zinc-900/80 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {cat.shortTitle}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por suplemento, sabor, ingrediente..."
              aria-label="Buscar productos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
              aria-label="Filtrar por categoría"
            >
              <option value="all">Todas las Categorías</option>
              {MACRO_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.title}</option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
              aria-label="Filtrar por marca"
            >
              <option value="all">Todas las Marcas</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
              aria-label="Ordenar productos"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre: A - Z</option>
            </select>
          </div>

        </div>
      </div>

      {/* Results Count & Active Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          {filteredProducts.length > 0 ? (
            <span>
              Mostrando <strong className="text-white font-bold">{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)}</strong> de{' '}
              <strong className="text-white font-bold">{filteredProducts.length}</strong> suplementos activos
            </span>
          ) : (
            <span>Mostrando <strong className="text-white font-bold">0</strong> suplementos activos</span>
          )}
        </div>

        {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchTerm || sortBy !== 'featured') && (
          <button
            onClick={handleResetFilters}
            className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Restablecer filtros</span>
          </button>
        )}
      </div>

      {/* Grid of Filtered Products */}
      <CatalogStatus />

      {loading || error ? null : filteredProducts.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Paginación del catálogo" className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <button
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:border-red-500/50 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - safePage) <= 2)
                  .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                    if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-zinc-500">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => handlePageChange(item)}
                        aria-current={safePage === item ? 'page' : undefined}
                        className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-bold transition-all ${
                          safePage === item
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                            : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:border-red-500/50 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          )}
        </div>
      ) : (
        <div className="glass-panel p-12 sm:p-16 rounded-3xl text-center space-y-4 border border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white font-display">No se encontraron productos</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            No hay suplementos que coincidan con los filtros seleccionados o el término de búsqueda.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 rounded-xl glow-button text-white text-xs font-bold"
          >
            Ver todos los suplementos
          </button>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-400">Cargando catálogo oficial…</div>}>
      <Catalog />
    </Suspense>
  );
}
