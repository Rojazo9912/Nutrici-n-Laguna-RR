-- ====================================================================
-- PLATAFORMA E-COMMERCE NUTRICIÓN LAGUNA RR (PRD v2.0)
-- Migración 02: Datos de Prueba e Inicialización (Seed Data SQL)
-- ====================================================================

-- 1. INSERTAR MARCAS
INSERT INTO public.brands (id, name, slug, logo_url, description) VALUES
('b1000000-0000-0000-0000-000000000001', 'Optimum Nutrition', 'optimum-nutrition', '/brands/on.png', 'Líder mundial en nutrición deportiva'),
('b2000000-0000-0000-0000-000000000002', 'Muscletech', 'muscletech', '/brands/muscletech.png', 'Innovación y suplementos avanzados'),
('b3000000-0000-0000-0000-000000000003', 'Dymatize', 'dymatize', '/brands/dymatize.png', 'Proteínas aisladas de máxima pureza'),
('b4000000-0000-0000-0000-000000000004', 'Laguna Labs', 'laguna-labs', '/brands/laguna.png', 'Fórmulas premium de nutrición y bienestar'),
('b5000000-0000-0000-0000-000000000005', 'Cellucor', 'cellucor', '/brands/cellucor.png', 'Rendimiento deportivo y pre-entrenamientos')
ON CONFLICT (id) DO NOTHING;

-- 2. INSERTAR CATEGORÍAS
INSERT INTO public.categories (id, name, slug, description, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'Proteínas', 'proteinas', 'Whey Protein, Aisladas y Proteína Vegana', TRUE),
('c2000000-0000-0000-0000-000000000002', 'Creatina', 'creatina', 'Creatina Monohidratada y Micronizada para fuerza', TRUE),
('c3000000-0000-0000-0000-000000000003', 'Pre-Entrenamientos', 'pre-entrenamientos', 'Energía, concentración y óxido nítrico', TRUE),
('c4000000-0000-0000-0000-000000000004', 'Aminoácidos & BCAA', 'aminoacidos', 'Recuperación muscular e hidratación', TRUE),
('c5000000-0000-0000-0000-000000000005', 'Salud & Bienestar', 'salud-bienestar', 'Multivitamínicos, Omega 3, Minerales', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. INSERTAR PRODUCTOS PRODUCTOS APROBADOS COFEPRIS
INSERT INTO public.products (
    id, name, slug, description_short, description_long,
    brand_id, category_id, is_consumable, price_regular, price_promo, cost_internal,
    stock_minimum, weight_grams, commercial_status, regulatory_status
) VALUES
(
    'p1000000-0000-0000-0000-000000000001',
    'Gold Standard 100% Whey 5lb',
    'gold-standard-100-whey-5lb',
    'Proteína aislada e concentrada de suero de leche de alta pureza con 24g de proteína por porción.',
    'Gold Standard 100% Whey de Optimum Nutrition proporciona 24g de proteína de suero por servicio.',
    'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', TRUE, 1499.00, 1299.00, 950.00, 10, 2270, 'activo', 'aprobado'
),
(
    'p2000000-0000-0000-0000-000000000002',
    'Creatine Monohydrate 100% Pure 500g',
    'creatine-monohydrate-100-pure-500g',
    'Creatina monohidratada ultra micronizada de alta absorción para potenciar fuerza y masa muscular.',
    'Nuestra Creatina Monohidratada 100% pura proporciona 5g de creatina Creapure por porción.',
    'b4000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000002', TRUE, 599.00, 499.00, 280.00, 15, 500, 'activo', 'aprobado'
),
(
    'p3000000-0000-0000-0000-000000000003',
    'ISO100 Hydrolyzed 3lb',
    'iso100-hydrolyzed-3lb',
    'Proteína 100% Aislada e Hidrolizada de suero de leche de absorción ultra rápida.',
    'Dymatize ISO100 es una de las proteínas más galardonadas del mundo con 25g por servicio.',
    'b3000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', TRUE, 1699.00, 1549.00, 1100.00, 8, 1360, 'activo', 'aprobado'
),
(
    'p4000000-0000-0000-0000-000000000004',
    'C4 Original Pre-Workout 60 Serv',
    'c4-original-pre-workout-60serv',
    'El pre-entrenamiento #1 en ventas mundial con nitrato de creatina y CarnoSyn Beta-Alanina.',
    'Energía explosiva, resistencia muscular mejorada y enfoque mental agudo.',
    'b5000000-0000-0000-0000-000000000005', 'c3000000-0000-0000-0000-000000000003', TRUE, 899.00, 799.00, 500.00, 12, 390, 'activo', 'aprobado'
),
(
    'p5000000-0000-0000-0000-000000000005',
    'Laguna RR Omega 3 Fish Oil Ultra 1000mg',
    'laguna-rr-omega-3-1000mg',
    'Ácidos grasos esenciales EPA (500mg) / DHA (250mg) destilados molecularmente.',
    'Suplemento alimenticio de aceite de pescado con alta concentración de Omega 3.',
    'b4000000-0000-0000-0000-000000000004', 'c5000000-0000-0000-0000-000000000005', TRUE, 420.00, 359.00, 180.00, 20, 200, 'activo', 'aprobado'
)
ON CONFLICT (id) DO NOTHING;

-- 4. INSERTAR VARIANTES DE PRODUCTO
INSERT INTO public.product_variants (id, product_id, sku, flavor, size, presentation, stock_available) VALUES
('v1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'ON-GSW-CHO-5LB', 'Doble Chocolate Rich', '5 lb (2.27 kg)', 'Bote', 45),
('v2000000-0000-0000-0000-000000000002', 'p2000000-0000-0000-0000-000000000002', 'NLRR-CRE-500G', 'Sin Sabor (Natural)', '500 g (100 servicios)', 'Bote', 80),
('v3000000-0000-0000-0000-000000000003', 'p3000000-0000-0000-0000-000000000003', 'DYM-ISO-GBC-3LB', 'Gourmet Chocolate', '3 lb (1.36 kg)', 'Bote', 22),
('v4000000-0000-0000-0000-000000000004', 'p4000000-0000-0000-0000-000000000004', 'CEL-C4-FP-60S', 'Fruit Punch', '60 Servicios', 'Tarro', 50),
('v5000000-0000-0000-0000-000000000005', 'p5000000-0000-0000-0000-000000000005', 'NLRR-OMG3-120C', 'Softgels Neutras', '120 Softgels', 'Frasco', 60)
ON CONFLICT (id) DO NOTHING;

-- 5. INSERTAR IMÁGENES DE PRODUCTO
INSERT INTO public.product_images (id, product_id, image_url, is_primary) VALUES
('i1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800', TRUE),
('i2000000-0000-0000-0000-000000000002', 'p2000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=800', TRUE),
('i3000000-0000-0000-0000-000000000003', 'p3000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&q=80&w=800', TRUE),
('i4000000-0000-0000-0000-000000000004', 'p4000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800', TRUE),
('i5000000-0000-0000-0000-000000000005', 'p5000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. INSERTAR LOTES Y CADUCIDADES (OBLIGATORIO SECCIÓN 5.0 PRD)
INSERT INTO public.inventory_lots (variant_id, lot_number, expiration_date, quantity) VALUES
('v1000000-0000-0000-0000-000000000001', 'LOTE-NLRR-202609A', '2027-10-31', 45),
('v2000000-0000-0000-0000-000000000002', 'LOTE-NLRR-202609B', '2028-05-15', 80),
('v3000000-0000-0000-0000-000000000003', 'LOTE-NLRR-202609C', '2027-12-31', 22),
('v4000000-0000-0000-0000-000000000004', 'LOTE-NLRR-202609D', '2027-08-20', 50),
('v5000000-0000-0000-0000-000000000005', 'LOTE-NLRR-202609E', '2028-02-28', 60);
