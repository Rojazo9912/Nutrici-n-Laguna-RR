'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product, ProductVariant, Category, Brand } from '@/types/database.types';
import { availableStock, MAX_QUANTITY, parseCart, unitPrice, type CartLine } from '@/lib/commerce';

const STORAGE_KEY = 'laguna-cart-v1';
type ResolvedLine = CartLine & { product: Product; variant: ProductVariant; price: number; available: number };
type Store = {
  products: Product[]; categories: Category[]; brands: Brand[]; loading: boolean; error: string;
  lines: CartLine[]; items: ResolvedLine[]; count: number; subtotal: number; shipping: number;
  add: (product: Product, variant?: ProductVariant) => boolean;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void; clear: () => void; reload: () => Promise<void>;
};
const Context = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<{ products: Product[]; categories: Category[]; brands: Brand[] }>({ products: [], categories: [], brands: [] });
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function reload() {
    setLoading(true);
    try {
      const response = await fetch('/api/catalog', { cache: 'no-store' });
      if (!response.ok) throw new Error('No pudimos cargar el catálogo.');
      setCatalog(await response.json());
      setError('');
    } catch { setError('No pudimos cargar el catálogo. Intenta nuevamente.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    try { setLines(parseCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))); } catch { setLines([]); }
    setHydrated(true);
    void reload();
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        try { setLines(parseCart(JSON.parse(event.newValue || '[]'))); } catch { setLines([]); }
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* Cart still works in memory. */ }
    }
  }, [lines, hydrated]);

  const items = lines.flatMap(line => {
    const product = catalog.products.find(p => p.variants?.some(v => v.id === line.variantId));
    const variant = product?.variants?.find(v => v.id === line.variantId);
    return product && variant ? [{ ...line, product, variant, price: unitPrice(product, variant), available: availableStock(variant) }] : [];
  });
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
  const add = (product: Product, variant = product.variants?.[0]) => {
    if (!variant || availableStock(variant) < 1) return false;
    const existing = lines.find(line => line.variantId === variant.id)?.quantity ?? 0;
    if (existing === 0 && lines.length >= 50) return false;
    if (existing >= Math.min(MAX_QUANTITY, availableStock(variant))) return false;
    setLines(previous => {
      const found = previous.find(line => line.variantId === variant.id);
      if (!found && previous.length >= 50) return previous;
      return found ? previous.map(line => line.variantId === variant.id ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY, availableStock(variant)) } : line) : [...previous, { variantId: variant.id, quantity: 1 }];
    });
    return true;
  };
  const update = (variantId: string, quantity: number) => {
    const item = items.find(i => i.variantId === variantId);
    if (!item || !Number.isInteger(quantity)) return;
    setLines(previous => previous.map(line => line.variantId === variantId ? { ...line, quantity: Math.max(1, Math.min(quantity, MAX_QUANTITY, item.available)) } : line));
  };
  return <Context.Provider value={{ ...catalog, loading: loading || !hydrated, error, lines, items, subtotal, shipping: subtotal > 0 && subtotal < 1500 ? 150 : 0, count: lines.reduce((sum, line) => sum + line.quantity, 0), add, update, remove: id => setLines(previous => previous.filter(line => line.variantId !== id)), clear: () => setLines([]), reload }}>{children}</Context.Provider>;
}

export function useStore() {
  const context = useContext(Context);
  if (!context) throw new Error('StoreProvider requerido');
  return context;
}

export function CatalogStatus() {
  const { loading, error, reload } = useStore();
  if (loading) return <p role="status" className="p-6 text-slate-300">Cargando catálogo…</p>;
  if (error) return <div role="alert" className="p-6 text-red-300">{error} <button className="underline" onClick={() => void reload()}>Reintentar</button></div>;
  return null;
}
