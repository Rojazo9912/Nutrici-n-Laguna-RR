import { Product, Category, Brand } from '@/types/database.types';

export const MOCK_BRANDS: Brand[] = [
  { id: 'b1', name: 'Optimum Nutrition', slug: 'optimum-nutrition', logo_url: '/brands/on.png', description: 'Líder mundial en nutrición deportiva', created_at: new Date().toISOString() },
  { id: 'b2', name: 'Muscletech', slug: 'muscletech', logo_url: '/brands/muscletech.png', description: 'Innovación y suplementos avanzados', created_at: new Date().toISOString() },
  { id: 'b3', name: 'Dymatize', slug: 'dymatize', logo_url: '/brands/dymatize.png', description: 'Proteínas aisladas de máxima pureza', created_at: new Date().toISOString() },
  { id: 'b4', name: 'Laguna Labs', slug: 'laguna-labs', logo_url: '/brands/laguna.png', description: 'Fórmulas premium de nutrición y bienestar', created_at: new Date().toISOString() },
  { id: 'b5', name: 'Cellucor', slug: 'cellucor', logo_url: '/brands/cellucor.png', description: 'Rendimiento deportivo y pre-entrenamientos', created_at: new Date().toISOString() },
  { id: 'b6', name: 'Insane Labz', slug: 'insane-labz', logo_url: '/brands/insane.png', description: 'Potencia y energía extrema', created_at: new Date().toISOString() },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Proteínas', slug: 'proteinas', description: 'Whey Protein, Aisladas y Proteína Vegana', parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'c2', name: 'Creatina', slug: 'creatina', description: 'Creatina Monohidratada y Micronizada para fuerza', parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'c3', name: 'Pre-Entrenamientos', slug: 'pre-entrenamientos', description: 'Energía, concentración y óxido nítrico', parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'c4', name: 'Aminoácidos & BCAA', slug: 'aminoacidos', description: 'Recuperación muscular e hidratación', parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'c5', name: 'Salud & Bienestar', slug: 'salud-bienestar', description: 'Multivitamínicos, Omega 3, Minerales', parent_id: null, is_active: true, created_at: new Date().toISOString() },
];

export const MOCK_PRODUCTS: Product[] = [
  // 1. Proteína Gold Standard Whey
  {
    id: 'p1',
    name: 'Gold Standard 100% Whey 5lb',
    slug: 'gold-standard-100-whey-5lb',
    description_short: 'Proteína aislada e concentrada de suero de leche de alta pureza con 24g de proteína por porción.',
    description_long: 'Gold Standard 100% Whey de Optimum Nutrition proporciona 24g de proteína de suero de alta calidad por servicio, 5.5g de BCAAs naturales y solo 1g de grasa. Ideal para el desarrollo muscular y rápida recuperación post-entrenamiento.',
    brand_id: 'b1',
    category_id: 'c1',
    is_consumable: true,
    price_regular: 1499.00,
    price_promo: 1299.00,
    cost_internal: 950.00,
    stock_minimum: 10,
    weight_grams: 2270,
    dimensions_cm: '25x20x30',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    seo_title: 'Gold Standard 100% Whey 5lb - Nutrición Laguna RR',
    seo_meta_description: 'Compra Gold Standard 100% Whey con envío rápido y garantía COFEPRIS.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[0],
    category: MOCK_CATEGORIES[0],
    images: [
      { id: 'img1', product_id: 'p1', image_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v1', product_id: 'p1', sku: 'ON-GSW-CHO-5LB', flavor: 'Doble Chocolate Rich', size: '5 lb (2.27 kg)', presentation: 'Bote', stock_available: 45, stock_reserved: 3, created_at: new Date().toISOString() },
      { id: 'v2', product_id: 'p1', sku: 'ON-GSW-VAN-5LB', flavor: 'Vainilla Ice Cream', size: '5 lb (2.27 kg)', presentation: 'Bote', stock_available: 30, stock_reserved: 0, created_at: new Date().toISOString() }
    ]
  },

  // 2. Creatina Monohidratada 500g
  {
    id: 'p2',
    name: 'Creatine Monohydrate 100% Pure 500g',
    slug: 'creatine-monohydrate-100-pure-500g',
    description_short: 'Creatina monohidratada ultra micronizada de alta absorción para potenciar fuerza y masa muscular.',
    description_long: 'Nuestra Creatina Monohidratada 100% pura proporciona 5g de creatina Creapure® por porción. Sin saborizantes, sin rellenos. Registro de aviso de funcionamiento COFEPRIS comprobado.',
    brand_id: 'b4',
    category_id: 'c2',
    is_consumable: true,
    price_regular: 599.00,
    price_promo: 499.00,
    cost_internal: 280.00,
    stock_minimum: 15,
    weight_grams: 500,
    dimensions_cm: '15x15x20',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    seo_title: 'Creatina Monohidratada 500g 100% Pura - Nutrición Laguna RR',
    seo_meta_description: 'Aumenta tu potencia muscular con nuestra creatina micronizada de alta resolución.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[3],
    category: MOCK_CATEGORIES[1],
    images: [
      { id: 'img2', product_id: 'p2', image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v3', product_id: 'p2', sku: 'NLRR-CRE-500G', flavor: 'Sin Sabor (Natural)', size: '500 g (100 servicios)', presentation: 'Bote', stock_available: 80, stock_reserved: 5, created_at: new Date().toISOString() }
    ]
  },

  // 3. ISO 100 Dymatize
  {
    id: 'p3',
    name: 'ISO100 Hydrolyzed 3lb',
    slug: 'iso100-hydrolyzed-3lb',
    description_short: 'Proteína 100% Aislada e Hidrolizada de suero de leche de absorción ultra rápida.',
    description_long: 'Dymatize ISO100 es una de las proteínas más galardonadas del mundo. Con 25g de proteína hidrolizada, 0g de grasa y menos de 1g de azúcar por porción, es perfecta para etapas de definición muscular.',
    brand_id: 'b3',
    category_id: 'c1',
    is_consumable: true,
    price_regular: 1699.00,
    price_promo: 1549.00,
    cost_internal: 1100.00,
    stock_minimum: 8,
    weight_grams: 1360,
    dimensions_cm: '20x20x25',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[2],
    category: MOCK_CATEGORIES[0],
    images: [
      { id: 'img3', product_id: 'p3', image_url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v4', product_id: 'p3', sku: 'DYM-ISO-GBC-3LB', flavor: 'Gourmet Chocolate', size: '3 lb (1.36 kg)', presentation: 'Bote', stock_available: 22, stock_reserved: 1, created_at: new Date().toISOString() }
    ]
  },

  // 4. Pre-Entrenamiento VaporX5
  {
    id: 'p4',
    name: 'VaporX5 Pre-Workout Extreme 30 Serv',
    slug: 'vaporx5-pre-workout-30serv',
    description_short: 'Fórmula pre-entrenamiento explosiva con cafeína, beta-alanina y nitrato de betapower.',
    description_long: 'Diseñado para proporcionar energía extrema, bombeos musculares intensos y concentración láser. Libre de sustancias prohibidas en el listado WADA/COFEPRIS.',
    brand_id: 'b2',
    category_id: 'c3',
    is_consumable: true,
    price_regular: 799.00,
    price_promo: null,
    cost_internal: 450.00,
    stock_minimum: 10,
    weight_grams: 300,
    dimensions_cm: '12x12x15',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[1],
    category: MOCK_CATEGORIES[2],
    images: [
      { id: 'img4', product_id: 'p4', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v5', product_id: 'p4', sku: 'MT-VX5-BLU-30S', flavor: 'Blue Razz Freeze', size: '30 Servicios', presentation: 'Tarro', stock_available: 35, stock_reserved: 2, created_at: new Date().toISOString() }
    ]
  },

  // 5. C4 Original Cellucor
  {
    id: 'p5',
    name: 'C4 Original Pre-Workout 60 Serv',
    slug: 'c4-original-pre-workout-60serv',
    description_short: 'El pre-entrenamiento #1 en ventas mundial con nitrato de creatina y CarnoSyn Beta-Alanina.',
    description_long: 'Energía explosiva, resistencia muscular mejorada y enfoque mental agudo. 150mg de cafeína anhidra por porción, ideal para principiantes y atletas intermedios.',
    brand_id: 'b5',
    category_id: 'c3',
    is_consumable: true,
    price_regular: 899.00,
    price_promo: 799.00,
    cost_internal: 500.00,
    stock_minimum: 12,
    weight_grams: 390,
    dimensions_cm: '13x13x16',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[4],
    category: MOCK_CATEGORIES[2],
    images: [
      { id: 'img5', product_id: 'p5', image_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v6', product_id: 'p5', sku: 'CEL-C4-FP-60S', flavor: 'Fruit Punch', size: '60 Servicios (390g)', presentation: 'Tarro', stock_available: 50, stock_reserved: 2, created_at: new Date().toISOString() }
    ]
  },

  // 6. Omega 3 Fish Oil
  {
    id: 'p6',
    name: 'Laguna RR Omega 3 Fish Oil Ultra 1000mg',
    slug: 'laguna-rr-omega-3-1000mg',
    description_short: 'Ácidos grasos esenciales EPA (500mg) / DHA (250mg) destilados molecularmente.',
    description_long: 'Suplemento alimenticio de aceite de pescado con alta concentración de Omega 3 libre de metales pesados. Apoya la salud cardiovascular, cerebral y articular.',
    brand_id: 'b4',
    category_id: 'c5',
    is_consumable: true,
    price_regular: 420.00,
    price_promo: 359.00,
    cost_internal: 180.00,
    stock_minimum: 20,
    weight_grams: 200,
    dimensions_cm: '10x10x15',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[3],
    category: MOCK_CATEGORIES[4],
    images: [
      { id: 'img6', product_id: 'p6', image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v7', product_id: 'p6', sku: 'NLRR-OMG3-120C', flavor: 'Softgels Neutras', size: '120 Softgels', presentation: 'Frasco', stock_available: 60, stock_reserved: 0, created_at: new Date().toISOString() }
    ]
  },

  // 7. Multivitamínico Opti-Men
  {
    id: 'p7',
    name: 'Opti-Men Multivitamin 150 Tabs',
    slug: 'opti-men-multivitamin-150tabs',
    description_short: 'Sistema de optimización de nutrientes completo con más de 75 ingredientes activos.',
    description_long: 'Opti-Men incluye 4 mezclas exclusivas para cubrir las necesidades diarias de atletas masculinos activos: Amino-Blend, Viri-Blend, Phyto-Blend y Enzy-Blend.',
    brand_id: 'b1',
    category_id: 'c5',
    is_consumable: true,
    price_regular: 650.00,
    price_promo: 579.00,
    cost_internal: 360.00,
    stock_minimum: 10,
    weight_grams: 350,
    dimensions_cm: '11x11x17',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[0],
    category: MOCK_CATEGORIES[4],
    images: [
      { id: 'img7', product_id: 'p7', image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v8', product_id: 'p7', sku: 'ON-OPTMEN-150T', flavor: 'Tabletas recubiertas', size: '150 Tabletas (50 servicios)', presentation: 'Frasco', stock_available: 40, stock_reserved: 1, created_at: new Date().toISOString() }
    ]
  },

  // 8. Colágeno Hidrolizado con Vitamina C
  {
    id: 'p8',
    name: 'Laguna RR Colágeno Hidrolizado + Vitamina C 450g',
    slug: 'laguna-rr-colageno-hidrolizado-450g',
    description_short: 'Colágeno bovino tipo I y III hidrolizado enzomáticamente con Vitamina C y Ácido Hialurónico.',
    description_long: 'Mejora la elasticidad de la piel, fortalece articulaciones, ligamentos, cabello y uñas. Libre de gluten y sin azúcares añadidos.',
    brand_id: 'b4',
    category_id: 'c5',
    is_consumable: true,
    price_regular: 480.00,
    price_promo: 399.00,
    cost_internal: 210.00,
    stock_minimum: 15,
    weight_grams: 450,
    dimensions_cm: '14x14x18',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[3],
    category: MOCK_CATEGORIES[4],
    images: [
      { id: 'img8', product_id: 'p8', image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v9', product_id: 'p8', sku: 'NLRR-COL-NARA-450G', flavor: 'Naranja Cítrica', size: '450 g (30 servicios)', presentation: 'Tarro', stock_available: 55, stock_reserved: 4, created_at: new Date().toISOString() }
    ]
  },

  // 9. BCAA + Electrolitos (Pendiente de aprobación COFEPRIS para prueba de admin)
  {
    id: 'p9',
    name: 'BCAA + Hydration Electrolytes 300g',
    slug: 'bcaa-hydration-electrolytes-300g',
    description_short: 'Aminoácidos ramificados ratio 2:1:1 enriquecidos con electrolitos clave para intra-entrenamiento.',
    description_long: 'Fórmula de BCAAs intra-entrenamiento que previene el catabolismo y promueve la hidratación celular durante sesiones intensas de entrenamiento.',
    brand_id: 'b4',
    category_id: 'c4',
    is_consumable: true,
    price_regular: 520.00,
    price_promo: null,
    cost_internal: 240.00,
    stock_minimum: 12,
    weight_grams: 300,
    dimensions_cm: '12x12x16',
    commercial_status: 'borrador',
    regulatory_status: 'pendiente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[3],
    category: MOCK_CATEGORIES[3],
    images: [
      { id: 'img9', product_id: 'p9', image_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v10', product_id: 'p9', sku: 'NLRR-BCAA-WAT-300G', flavor: 'Sandía Refresh', size: '300 g', presentation: 'Tarro', stock_available: 25, stock_reserved: 0, created_at: new Date().toISOString() }
    ]
  },

  // 10. Psychotic Insane Labz
  {
    id: 'p10',
    name: 'Psychotic Gold Pre-Workout 35 Serv',
    slug: 'psychotic-gold-pre-workout-35serv',
    description_short: 'Pre-entrenamiento de alta estimulación formulado para atletas de resistencia avanzada.',
    description_long: 'Psychotic Gold combina AMPiberry® con ingredientes energéticos para un enfoque sostenido sin bajones repentinos.',
    brand_id: 'b6',
    category_id: 'c3',
    is_consumable: true,
    price_regular: 850.00,
    price_promo: 749.00,
    cost_internal: 480.00,
    stock_minimum: 8,
    weight_grams: 220,
    dimensions_cm: '10x10x14',
    commercial_status: 'activo',
    regulatory_status: 'aprobado',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand: MOCK_BRANDS[5],
    category: MOCK_CATEGORIES[2],
    images: [
      { id: 'img10', product_id: 'p10', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800', display_order: 1, is_primary: true, created_at: new Date().toISOString() }
    ],
    variants: [
      { id: 'v11', product_id: 'p10', sku: 'INS-PSY-PUNCH-35S', flavor: 'Gummy Candy', size: '35 Servicios', presentation: 'Tarro', stock_available: 28, stock_reserved: 1, created_at: new Date().toISOString() }
    ]
  }
];
