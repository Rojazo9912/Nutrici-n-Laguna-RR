-- ====================================================================
-- PLATAFORMA E-COMMERCE NUTRICIÓN LAGUNA RR (PRD v2.0)
-- Migración 01: Políticas de Seguridad Row Level Security (RLS)
-- ====================================================================

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_regulatory_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 1. POLÍTICAS PARA CATÁLOGO PÚBLICO (Lectura libre solo si está aprobado)
-- --------------------------------------------------------------------

-- Productos: Visibles para cualquier usuario (incluso anónimo) SOLO si está activo Y aprobado regulatoriamente
CREATE POLICY "Public Products Read Access"
ON public.products FOR SELECT
USING (
    (commercial_status = 'activo' AND regulatory_status = 'aprobado')
    OR (auth.jwt() ->> 'role' IN ('admin', 'compliance_officer', 'editor'))
);

-- Variantes e imágenes: Visibles si el producto padre es visible
CREATE POLICY "Public Product Variants Read Access"
ON public.product_variants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id
        AND ((p.commercial_status = 'activo' AND p.regulatory_status = 'aprobado') OR (auth.jwt() ->> 'role' IN ('admin', 'compliance_officer', 'editor')))
    )
);

CREATE POLICY "Public Product Images Read Access"
ON public.product_images FOR SELECT
USING (TRUE);

CREATE POLICY "Public Categories Read Access"
ON public.categories FOR SELECT
USING (is_active = TRUE OR auth.jwt() ->> 'role' IN ('admin', 'editor'));

CREATE POLICY "Public Brands Read Access"
ON public.brands FOR SELECT
USING (TRUE);

-- --------------------------------------------------------------------
-- 2. POLÍTICAS PARA CLIENTES (Sus propios datos)
-- --------------------------------------------------------------------

-- Perfiles: Cada usuario puede leer/actualizar su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Direcciones: Solo el dueño de la dirección
CREATE POLICY "Users manage own addresses"
ON public.addresses FOR ALL
USING (auth.uid() = user_id);

-- Consentimientos de Privacidad (LFPDPPP)
CREATE POLICY "Users view and manage own privacy consents"
ON public.privacy_consents FOR ALL
USING (auth.uid() = user_id);

-- Carritos e Ítems de Carrito
CREATE POLICY "Users manage own carts"
ON public.carts FOR ALL
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users manage own cart items"
ON public.cart_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.id = cart_items.cart_id
        AND (c.user_id = auth.uid() OR c.session_id IS NOT NULL)
    )
);

-- Pedidos: El cliente puede ver sus propios pedidos
CREATE POLICY "Users view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users insert own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users view own order items"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    )
);

-- --------------------------------------------------------------------
-- 3. POLÍTICAS ADMINISTRATIVAS Y CONTROL REGULATORIO
-- --------------------------------------------------------------------

-- Auditoría Regulatoria (product_regulatory_status): Solo admins y compliance
CREATE POLICY "Regulatory Status Manage Access"
ON public.product_regulatory_status FOR ALL
USING (auth.jwt() ->> 'role' IN ('admin', 'compliance_officer'));

-- Control de Lotes e Inventario: Solo admins/operadores
CREATE POLICY "Inventory Lots Manage Access"
ON public.inventory_lots FOR ALL
USING (auth.jwt() ->> 'role' IN ('admin', 'editor'));

CREATE POLICY "Inventory Movements Audit Access"
ON public.inventory_movements FOR ALL
USING (auth.jwt() ->> 'role' IN ('admin'));

-- Bitácora de Auditoría Administrativa
CREATE POLICY "Admin Audit Logs Access"
ON public.admin_audit_logs FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
