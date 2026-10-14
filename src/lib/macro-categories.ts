import {
  Dumbbell,
  Zap,
  Dna,
  Flame,
  Target,
  TrendingUp,
  HeartPulse,
  PackageCheck,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import type { Product } from '@/types/database.types';

export interface MacroCategory {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  badgeText: string;
  associatedSlugs: string[];
}

export const MACRO_CATEGORIES: MacroCategory[] = [
  {
    id: 'proteinas',
    slug: 'proteinas',
    title: 'Proteínas & Aislados',
    shortTitle: 'Proteínas',
    description: 'Whey Protein, Isoladas, Hidrolizadas, Zero Carb y barras de proteína de alta absorción.',
    iconName: 'Dumbbell',
    badgeText: 'Masa Muscular',
    associatedSlugs: [
      'proteinas',
      'proteinas-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-suplemento',
      'proteinas-zero-y-low-carb-compralo-hoy',
      'proteina-liquida-y-en-barra-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-l',
      'suplementos-alimenticios-compralo-hoy',
    ],
  },
  {
    id: 'creatina',
    slug: 'creatina',
    title: 'Creatinas & Fuerza',
    shortTitle: 'Creatinas',
    description: 'Creatina monohidratada micronizada y fórmulas puras para potencia y resistencia muscular.',
    iconName: 'Zap',
    badgeText: 'Fuerza & Potencia',
    associatedSlugs: [
      'creatina',
      'creatinas-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-suplemento',
    ],
  },
  {
    id: 'aminoacidos',
    slug: 'aminoacidos',
    title: 'Aminoácidos & BCAAs',
    shortTitle: 'Aminoácidos',
    description: 'BCAAs 2:1:1, EAAs esenciales y L-Glutamina para recuperación muscular rápida.',
    iconName: 'Dna',
    badgeText: 'Recuperación',
    associatedSlugs: [
      'aminoacidos',
      'aminoacidos-y-bcaas-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-',
      'glutaminas-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-suplement',
    ],
  },
  {
    id: 'pre-entreno',
    slug: 'pre-entreno',
    title: 'Pre-Entreno & Energía',
    shortTitle: 'Pre-Entreno',
    description: 'Óxido nítrico, bombeo muscular y fórmulas energéticas para entrenamientos intensos.',
    iconName: 'Flame',
    badgeText: 'Máxima Activación',
    associatedSlugs: [
      'pre-entreno',
      'pre-entrenamientos',
      'pre-entrenamiento-compralo-hoy',
      'oxido-nitrico-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-suplem',
    ],
  },
  {
    id: 'quemadores',
    slug: 'quemadores',
    title: 'Control de Peso & Quemadores',
    shortTitle: 'Quemadores',
    description: 'Termogénicos, L-Carnitina líquida, CLA y suplementos para definición física.',
    iconName: 'Target',
    badgeText: 'Definición',
    associatedSlugs: [
      'quemadores',
      'quemadores-de-grasa-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-',
      'adelgazantes-compralo-hoy',
      'anticelulitis-compralo-hoy',
      'reafirmantes-compralo-hoy',
    ],
  },
  {
    id: 'ganadores',
    slug: 'ganadores',
    title: 'Ganadores de Masa',
    shortTitle: 'Gainers',
    description: 'Hipercalóricos y carbohidratos complejos para incremento de peso y volumen limpio.',
    iconName: 'TrendingUp',
    badgeText: 'Volumen',
    associatedSlugs: ['ganadores', 'ganadores-compralo-hoy'],
  },
  {
    id: 'vitaminas',
    slug: 'vitaminas',
    title: 'Salud, Vitaminas & Bienestar',
    shortTitle: 'Vitaminas',
    description: 'Multivitamínicos diarios, Omega 3, Colágeno hidrolizado y soporte para articulaciones.',
    iconName: 'HeartPulse',
    badgeText: 'Salud Integral',
    associatedSlugs: [
      'vitaminas',
      'vitaminas-compralo-hoy',
      'antiedad-compralo-hoy',
      'articulaciones-compralo-hoy',
      'salud-bienestar',
      'protectores-limpiadores-compralo-hoy',
    ],
  },
  {
    id: 'stacks',
    slug: 'stacks',
    title: 'Combos & Stacks Deportivos',
    shortTitle: 'Stacks',
    description: 'Combinaciones diseñadas para objetivos de volumen, fuerza o definición acelerada.',
    iconName: 'Layers',
    badgeText: 'Ahorro & Rendimiento',
    associatedSlugs: [
      'stacks',
      'stacks-kits-de-entrenamiento-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-',
      'combos-y-cocteles-compralo-hoy',
      'paquetes-mayoreo-compralo-hoy',
    ],
  },
  {
    id: 'accesorios',
    slug: 'accesorios',
    title: 'Shakers & Accesorios',
    shortTitle: 'Accesorios',
    description: 'Mezcladores deportivos con bola batidora, pastilleros y termos de hidratación.',
    iconName: 'PackageCheck',
    badgeText: 'Equipamiento',
    associatedSlugs: ['accesorios', 'shakers-y-accesorios-compralo-hoy'],
  },
];

export const MACRO_CATEGORY_ICONS: Record<string, LucideIcon> = {
  Dumbbell,
  Zap,
  Dna,
  Flame,
  Target,
  TrendingUp,
  HeartPulse,
  Layers,
  PackageCheck,
};

// Categorías que NUNCA deben mostrarse públicamente (sustancias restringidas / reguladas por COFEPRIS)
export const RESTRICTED_CATEGORY_SLUGS = new Set([
  'anadrol-oximetolona-descuento-hot',
  'factor-de-crecimiento-igf-descuento-hot',
  'linea-de-peptidos-compralo-hoy',
  'trembolona-descuento-hot',
  'turinabol-halotestin-y-otros-descuento-hot',
  'boldenona-descuento-hot',
  'deca-nandrolona-descuento-hot',
  'masteron-descuento-hot',
  'primobolan-descuento-hot',
  'proviron-mesterolona-descuento-hot',
  'stanozolol-winstrol-descuento-hot',
  'testosterona-cipionato-descuento-hot',
  'testosterona-combinacion-descuento-hot',
  'testosterona-enantato-descuento-hot',
  'testosterona-propionato-descuento-hot',
  'rellenos-y-toxinas-compralo-hoy',
  'aumentadores-de-testosterona-compralo-hoy',
]);

/**
 * Determina si un producto pertenece a una macro-categoría dada.
 */
export function productMatchesCategory(product: Product, selectedCategorySlug: string): boolean {
  if (selectedCategorySlug === 'all') return true;

  const macro = MACRO_CATEGORIES.find(m => m.slug === selectedCategorySlug);
  if (macro) {
    const prodCatSlug = product.category?.slug || '';
    const prodCatId = product.category_id || '';
    if (macro.associatedSlugs.includes(prodCatSlug) || macro.associatedSlugs.includes(selectedCategorySlug)) {
      return true;
    }
    // Coincidencia por coincidencia de prefijo o ID
    return macro.associatedSlugs.some(s => prodCatSlug.startsWith(s.slice(0, 25)));
  }

  // Fallback: coincidencia exacta por ID o slug tradicional
  return (
    product.category_id === selectedCategorySlug ||
    product.category?.slug === selectedCategorySlug
  );
}
