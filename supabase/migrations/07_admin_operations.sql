-- Apply once, after 03 and 06. Operación administrativa: inventario y lotes, variantes, marcas, categorías,
-- cupones, contenido del sitio, tablero de indicadores y favoritos. Todo se ejecuta solo con service_role.
BEGIN;

CREATE FUNCTION public.assert_admin(p_actor UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
END $$;

-- INVENTARIO ---------------------------------------------------------------------------------------------
CREATE FUNCTION public.receive_stock(p_actor UUID,p_variant UUID,p_lot TEXT,p_expiration DATE,p_qty INT,p_notes TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_consumable BOOLEAN; v_lot UUID; v_number TEXT := NULLIF(TRIM(COALESCE(p_lot,'')),'');
BEGIN
  PERFORM public.assert_admin(p_actor);
  IF p_qty IS NULL OR p_qty NOT BETWEEN 1 AND 100000 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;
  PERFORM pg_advisory_xact_lock(7142026);
  SELECT p.is_consumable INTO v_consumable FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.id = p_variant FOR UPDATE OF pv;
  IF NOT FOUND THEN RAISE EXCEPTION 'VARIANT_NOT_FOUND'; END IF;
  IF v_consumable AND (v_number IS NULL OR p_expiration IS NULL OR p_expiration <= CURRENT_DATE) THEN RAISE EXCEPTION 'LOT_REQUIRED'; END IF;
  IF v_number IS NOT NULL THEN
    IF p_expiration IS NULL THEN RAISE EXCEPTION 'LOT_REQUIRED'; END IF;
    SELECT id INTO v_lot FROM public.inventory_lots WHERE variant_id = p_variant AND lot_number = v_number AND expiration_date = p_expiration FOR UPDATE;
    IF FOUND THEN UPDATE public.inventory_lots SET quantity = quantity + p_qty,is_active = TRUE WHERE id = v_lot;
    ELSE INSERT INTO public.inventory_lots(variant_id,lot_number,expiration_date,quantity) VALUES(p_variant,v_number,p_expiration,p_qty); END IF;
  END IF;
  UPDATE public.product_variants SET stock_available = stock_available + p_qty WHERE id = p_variant;
  INSERT INTO public.inventory_movements(variant_id,movement_type,quantity,notes,created_by) VALUES(p_variant,'entrada',p_qty,NULLIF(TRIM(p_notes),''),p_actor);
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'receive_stock','product_variants',p_variant,jsonb_build_object('lot',v_number,'expiration',p_expiration,'quantity',p_qty));
END $$;

-- Fija la cantidad de un lote (o del stock de una variante sin lotes). Requiere motivo.
CREATE FUNCTION public.adjust_stock(p_actor UUID,p_variant UUID,p_lot UUID,p_new_quantity INT,p_notes TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v RECORD; l RECORD; v_delta INT;
BEGIN
  PERFORM public.assert_admin(p_actor);
  IF LENGTH(TRIM(COALESCE(p_notes,''))) < 5 THEN RAISE EXCEPTION 'NOTES_REQUIRED'; END IF;
  IF p_new_quantity IS NULL OR p_new_quantity < 0 OR p_new_quantity > 1000000 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;
  PERFORM pg_advisory_xact_lock(7142026);
  SELECT pv.id,pv.stock_available,pv.stock_reserved,p.is_consumable INTO v FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.id = p_variant FOR UPDATE OF pv;
  IF NOT FOUND THEN RAISE EXCEPTION 'VARIANT_NOT_FOUND'; END IF;
  IF p_lot IS NOT NULL THEN
    SELECT * INTO l FROM public.inventory_lots WHERE id = p_lot AND variant_id = p_variant FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'LOT_NOT_FOUND'; END IF;
    IF p_new_quantity < l.reserved_quantity THEN RAISE EXCEPTION 'BELOW_RESERVED'; END IF;
    v_delta := p_new_quantity - l.quantity;
    IF v.stock_available + v_delta < v.stock_reserved THEN RAISE EXCEPTION 'BELOW_RESERVED'; END IF;
    UPDATE public.inventory_lots SET quantity = p_new_quantity WHERE id = p_lot;
  ELSE
    IF v.is_consumable THEN RAISE EXCEPTION 'LOT_REQUIRED'; END IF;
    IF p_new_quantity < v.stock_reserved THEN RAISE EXCEPTION 'BELOW_RESERVED'; END IF;
    v_delta := p_new_quantity - v.stock_available;
  END IF;
  IF v_delta = 0 THEN RETURN; END IF;
  UPDATE public.product_variants SET stock_available = stock_available + v_delta WHERE id = p_variant;
  INSERT INTO public.inventory_movements(variant_id,movement_type,quantity,notes,created_by) VALUES(p_variant,'ajuste',v_delta,TRIM(p_notes),p_actor);
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'adjust_stock','product_variants',p_variant,jsonb_build_object('lot',p_lot,'delta',v_delta,'notes',TRIM(p_notes)));
END $$;

-- CATÁLOGO -----------------------------------------------------------------------------------------------
CREATE FUNCTION public.upsert_variant(p_actor UUID,p_product UUID,p_id UUID,p_sku TEXT,p_flavor TEXT,p_size TEXT,p_presentation TEXT,p_price_override NUMERIC,p_barcode TEXT) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id UUID;
BEGIN
  PERFORM public.assert_admin(p_actor);
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id = p_product) THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.product_variants(product_id,sku,flavor,size,presentation,price_override,barcode) VALUES(p_product,p_sku,NULLIF(TRIM(p_flavor),''),NULLIF(TRIM(p_size),''),NULLIF(TRIM(p_presentation),''),p_price_override,NULLIF(TRIM(p_barcode),'')) RETURNING id INTO v_id;
  ELSE
    UPDATE public.product_variants SET sku = p_sku,flavor = NULLIF(TRIM(p_flavor),''),size = NULLIF(TRIM(p_size),''),presentation = NULLIF(TRIM(p_presentation),''),price_override = p_price_override,barcode = NULLIF(TRIM(p_barcode),'') WHERE id = p_id AND product_id = p_product RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'VARIANT_NOT_FOUND'; END IF;
  END IF;
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'upsert_variant','product_variants',v_id,jsonb_build_object('sku',p_sku,'price_override',p_price_override));
  RETURN v_id;
END $$;

CREATE FUNCTION public.upsert_brand(p_actor UUID,p_id UUID,p_name TEXT,p_slug TEXT,p_description TEXT) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id UUID;
BEGIN
  PERFORM public.assert_admin(p_actor);
  IF p_id IS NULL THEN INSERT INTO public.brands(name,slug,description) VALUES(TRIM(p_name),p_slug,NULLIF(TRIM(p_description),'')) RETURNING id INTO v_id;
  ELSE UPDATE public.brands SET name = TRIM(p_name),slug = p_slug,description = NULLIF(TRIM(p_description),'') WHERE id = p_id RETURNING id INTO v_id; IF v_id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF; END IF;
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'upsert_brand','brands',v_id,jsonb_build_object('name',p_name));
  RETURN v_id;
END $$;

-- Control técnico del PRD 5.0: nombre, slug y descripción no pueden referirse a sustancias excluidas.
CREATE FUNCTION public.upsert_category(p_actor UUID,p_id UUID,p_name TEXT,p_slug TEXT,p_description TEXT,p_active BOOLEAN) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id UUID;
BEGIN
  PERFORM public.assert_admin(p_actor);
  IF REGEXP_REPLACE(LOWER(COALESCE(p_name,'') || ' ' || COALESCE(p_slug,'') || ' ' || COALESCE(p_description,'')),'[-_]+',' ','g') SIMILAR TO '%(esteroide|sarm|hormona de crecimiento|somatropina|hgh)%' THEN RAISE EXCEPTION 'PROHIBITED_CATEGORY'; END IF;
  IF p_id IS NULL THEN INSERT INTO public.categories(name,slug,description,is_active) VALUES(TRIM(p_name),p_slug,NULLIF(TRIM(p_description),''),COALESCE(p_active,TRUE)) RETURNING id INTO v_id;
  ELSE UPDATE public.categories SET name = TRIM(p_name),slug = p_slug,description = NULLIF(TRIM(p_description),''),is_active = COALESCE(p_active,TRUE) WHERE id = p_id RETURNING id INTO v_id; IF v_id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF; END IF;
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'upsert_category','categories',v_id,jsonb_build_object('name',p_name,'active',p_active));
  RETURN v_id;
END $$;

-- CUPONES ------------------------------------------------------------------------------------------------
CREATE FUNCTION public.upsert_coupon(p_actor UUID,p_id UUID,p_code TEXT,p_type public.discount_type_enum,p_value NUMERIC,p_min NUMERIC,p_limit INT,p_valid_until TIMESTAMPTZ,p_active BOOLEAN) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id UUID; v_code TEXT := UPPER(TRIM(p_code));
BEGIN
  PERFORM public.assert_admin(p_actor);
  IF v_code !~ '^[A-Z0-9_-]{3,32}$' THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;
  IF p_value IS NULL OR p_value <= 0 OR (p_type = 'percentage' AND p_value > 100) THEN RAISE EXCEPTION 'INVALID_VALUE'; END IF;
  IF p_id IS NULL THEN INSERT INTO public.coupons(code,discount_type,discount_value,min_purchase,usage_limit,valid_until,is_active) VALUES(v_code,p_type,p_value,COALESCE(p_min,0),p_limit,p_valid_until,COALESCE(p_active,TRUE)) RETURNING id INTO v_id;
  ELSE UPDATE public.coupons SET code = v_code,discount_type = p_type,discount_value = p_value,min_purchase = COALESCE(p_min,0),usage_limit = p_limit,valid_until = p_valid_until,is_active = COALESCE(p_active,TRUE) WHERE id = p_id RETURNING id INTO v_id; IF v_id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF; END IF;
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'upsert_coupon','coupons',v_id,jsonb_build_object('code',v_code,'value',p_value,'active',p_active));
  RETURN v_id;
END $$;

-- CONTENIDO ----------------------------------------------------------------------------------------------
DROP POLICY content_public ON public.site_content;
CREATE POLICY content_public ON public.site_content FOR SELECT TO anon, authenticated USING (key IN ('privacidad','terminos','derechos-arco','regulacion-cofepris','faq','envios','devoluciones','contacto'));

CREATE FUNCTION public.save_site_content(p_actor UUID,p_key TEXT,p_version TEXT,p_body TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE previous JSONB;
BEGIN
  PERFORM public.assert_admin(p_actor);
  IF p_key NOT IN ('privacidad','terminos','derechos-arco','regulacion-cofepris','faq','envios','devoluciones','contacto') THEN RAISE EXCEPTION 'INVALID_KEY'; END IF;
  IF LENGTH(TRIM(COALESCE(p_version,''))) NOT BETWEEN 1 AND 80 OR LENGTH(TRIM(COALESCE(p_body,''))) NOT BETWEEN 1 AND 100000 THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
  SELECT content INTO previous FROM public.site_content WHERE key = p_key FOR UPDATE;
  IF FOUND AND previous->>'version' = TRIM(p_version) AND previous->>'body' IS DISTINCT FROM p_body THEN RAISE EXCEPTION 'VERSION_REQUIRED'; END IF;
  INSERT INTO public.site_content(key,content,page,updated_at) VALUES(p_key,jsonb_build_object('version',TRIM(p_version),'body',p_body),p_key,NOW())
  ON CONFLICT(key) DO UPDATE SET content = EXCLUDED.content,updated_at = NOW();
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,payload) VALUES(p_actor,'save_site_content','site_content',jsonb_build_object('key',p_key,'version',TRIM(p_version)));
END $$;

-- TABLERO ------------------------------------------------------------------------------------------------
CREATE FUNCTION public.admin_dashboard() RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'sales_30d', COALESCE((SELECT SUM(total) FROM public.orders WHERE status IN ('pagado','preparando','enviado','entregado') AND created_at > NOW() - INTERVAL '30 days'),0),
    'orders_30d', (SELECT COUNT(*) FROM public.orders WHERE status IN ('pagado','preparando','enviado','entregado') AND created_at > NOW() - INTERVAL '30 days'),
    'by_status', (SELECT COALESCE(jsonb_object_agg(status,c),'{}'::JSONB) FROM (SELECT status,COUNT(*) c FROM public.orders GROUP BY status) s),
    'customers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'client'),
    'payment_reviews', (SELECT COUNT(*) FROM public.orders WHERE payment_review_required),
    'open_arco', (SELECT COUNT(*) FROM public.arco_requests WHERE status IN ('recibida','en_proceso')),
    'pending_products', (SELECT COUNT(*) FROM public.products WHERE regulatory_status = 'pendiente'),
    'low_stock', (SELECT COALESCE(jsonb_agg(x),'[]'::JSONB) FROM (SELECT p.name AS product,pv.sku,pv.stock_available - pv.stock_reserved AS available,p.stock_minimum AS minimum FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id WHERE pv.stock_available - pv.stock_reserved <= p.stock_minimum ORDER BY 3,1 LIMIT 20) x),
    'expiring_lots', (SELECT COALESCE(jsonb_agg(x),'[]'::JSONB) FROM (SELECT p.name AS product,pv.sku,l.lot_number,l.expiration_date,l.quantity FROM public.inventory_lots l JOIN public.product_variants pv ON pv.id = l.variant_id JOIN public.products p ON p.id = pv.product_id WHERE l.quantity > 0 AND l.expiration_date <= CURRENT_DATE + 60 ORDER BY l.expiration_date LIMIT 20) x),
    'top_products', (SELECT COALESCE(jsonb_agg(x),'[]'::JSONB) FROM (SELECT oi.product_name AS name,SUM(oi.quantity)::INT AS units FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id WHERE o.status IN ('pagado','preparando','enviado','entregado') AND o.created_at > NOW() - INTERVAL '30 days' GROUP BY oi.product_name ORDER BY 2 DESC LIMIT 5) x)
  )
$$;

-- FAVORITOS ----------------------------------------------------------------------------------------------
CREATE TABLE public.wishlists (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id,product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wishlists FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.assert_admin(UUID), public.receive_stock(UUID,UUID,TEXT,DATE,INT,TEXT), public.adjust_stock(UUID,UUID,UUID,INT,TEXT), public.upsert_variant(UUID,UUID,UUID,TEXT,TEXT,TEXT,TEXT,NUMERIC,TEXT), public.upsert_brand(UUID,UUID,TEXT,TEXT,TEXT), public.upsert_category(UUID,UUID,TEXT,TEXT,TEXT,BOOLEAN), public.upsert_coupon(UUID,UUID,TEXT,public.discount_type_enum,NUMERIC,NUMERIC,INT,TIMESTAMPTZ,BOOLEAN), public.save_site_content(UUID,TEXT,TEXT,TEXT), public.admin_dashboard() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assert_admin(UUID), public.receive_stock(UUID,UUID,TEXT,DATE,INT,TEXT), public.adjust_stock(UUID,UUID,UUID,INT,TEXT), public.upsert_variant(UUID,UUID,UUID,TEXT,TEXT,TEXT,TEXT,NUMERIC,TEXT), public.upsert_brand(UUID,UUID,TEXT,TEXT,TEXT), public.upsert_category(UUID,UUID,TEXT,TEXT,TEXT,BOOLEAN), public.upsert_coupon(UUID,UUID,TEXT,public.discount_type_enum,NUMERIC,NUMERIC,INT,TIMESTAMPTZ,BOOLEAN), public.save_site_content(UUID,TEXT,TEXT,TEXT), public.admin_dashboard() TO service_role;
COMMIT;
