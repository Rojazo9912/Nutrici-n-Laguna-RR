import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

nextEnv.loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const restrictedSlugs = [
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
  'rellenos-y-toxinas-compralo-hoy'
];

const { data: prods } = await supabase.from('products')
  .select('id, name, commercial_status, regulatory_status, category:categories(name, slug)')
  .in('category.slug', restrictedSlugs);

console.log('Productos en categorias restringidas:', prods?.length);
for (const p of prods || []) {
  if (p.category) {
    console.log(`[${p.regulatory_status}] ${p.name} | Cat: ${p.category.name}`);
  }
}
