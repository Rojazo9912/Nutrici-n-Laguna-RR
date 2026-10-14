import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: cats } = await supabase.from('categories').select('id, name, slug').order('name');
const { data: prods } = await supabase.from('products').select('id, name, category_id, commercial_status, regulatory_status');

const categoryMap = {
  proteinas: {
    title: 'Proteínas & Aislados',
    description: 'Whey Protein, Isoladas, Hidrolizadas y barras proteicas.',
    slugs: ['proteinas', 'proteinas-zero-y-low-carb', 'proteina-liquida-y-en-barra', 'suplementos-alimenticios-compralo-hoy'],
    keywords: ['proteina', 'protein', 'whey', 'isolate', 'sobres', 'casein']
  },
  creatina: {
    title: 'Creatinas & Fuerza',
    description: 'Creatina monohidratada, micronizada y fórmulas de potencia.',
    slugs: ['creatina', 'creatinas-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-suplemento'],
    keywords: ['creatina', 'creatine', 'creapure']
  },
  aminoacidos: {
    title: 'Aminoácidos & BCAAs',
    description: 'BCAA 2:1:1, EAAs y Glutamina para acelerar tu recuperación muscular.',
    slugs: ['aminoacidos', 'aminoacidos-y-bcaas-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-', 'glutaminas-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-suplement'],
    keywords: ['amino', 'bcaa', 'glutamina', 'eaa']
  },
  'pre-entreno': {
    title: 'Pre-Entreno & Energía',
    description: 'Óxido nítrico, bombeo muscular, resistencia y enfoque explosivo.',
    slugs: ['pre-entrenamientos', 'pre-entrenamiento-compralo-hoy', 'oxido-nitrico-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-suplem'],
    keywords: ['pre-entreno', 'pre workout', 'pump', 'oxido', 'nitrico', 'c4']
  },
  quemadores: {
    title: 'Control de Peso & Quemadores',
    description: 'Termogénicos, L-Carnitina, CLA y fórmulas para definición.',
    slugs: ['quemadores-de-grasa-aprovecha-los-mejores-precios-del-universo-te-damos-el-mas-bajo-costo-en-toda-la-linea-de-', 'adelgazantes-compralo-hoy', 'anticelulitis-compralo-hoy', 'reafirmantes-compralo-hoy'],
    keywords: ['quemador', 'carnitina', 'cla', 'lipo', 'thermo', 'adelgazante']
  },
  ganadores: {
    title: 'Ganadores de Masa (Mass Gainers)',
    description: 'Hipercalóricos y carbohidratos complejos para volumen limpio.',
    slugs: ['ganadores-compralo-hoy'],
    keywords: ['ganador', 'gainer', 'mass', 'calorias']
  },
  vitaminas: {
    title: 'Salud, Vitaminas & Bienestar',
    description: 'Multivitamínicos, Omega 3, Colágeno, articulaciones y longevidad.',
    slugs: ['vitaminas-compralo-hoy', 'antiedad-compralo-hoy', 'articulaciones-compralo-hoy', 'salud-bienestar', 'protectores-limpiadores-compralo-hoy'],
    keywords: ['vitamina', 'multivitaminico', 'colageno', 'omega', 'antiedad', 'articulacion']
  },
  accesorios: {
    title: 'Shakers & Accesorios',
    description: 'Mezcladores, vasos deportivos y equipamiento de entrenamiento.',
    slugs: ['shakers-y-accesorios-compralo-hoy'],
    keywords: ['shaker', 'vaso', 'mezclador', 'termo']
  }
};

const categoryBySlug = {};
for (const c of cats) categoryBySlug[c.slug] = c;

console.log('--- REPORTE DE MACRO-CATEGORÍAS ---');
for (const [key, group] of Object.entries(categoryMap)) {
  const catIds = group.slugs.map(s => {
    // Find matching category in DB
    const found = cats.find(c => c.slug === s || c.slug.startsWith(s.slice(0, 30)));
    return found?.id;
  }).filter(Boolean);

  const matchedProds = prods.filter(p => catIds.includes(p.category_id));
  console.log(`${group.title}: ${matchedProds.length} productos asociados.`);
}
