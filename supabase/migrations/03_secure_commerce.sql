-- Apply once, after 00/01. Existing orders/products are preserved.
BEGIN;

ALTER TABLE public.orders ADD COLUMN checkout_key UUID UNIQUE;
ALTER TABLE public.orders ADD COLUMN request_hash TEXT;
ALTER TABLE public.orders ADD COLUMN guest_hash TEXT;
ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN payment_expires_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN reserved_until TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN preference_id TEXT;
ALTER TABLE public.orders ADD COLUMN checkout_url TEXT;
ALTER TABLE public.orders ADD COLUMN preference_claimed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN payment_review_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN inventory_committed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN privacy_version TEXT;
ALTER TABLE public.orders ADD COLUMN consent_at TIMESTAMPTZ;
ALTER TABLE public.inventory_lots ADD COLUMN reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0 AND reserved_quantity <= quantity);
ALTER TABLE public.payments ADD COLUMN provider_updated_at TIMESTAMPTZ;
CREATE TABLE public.order_lot_allocations (
  order_id UUID NOT NULL REFERENCES public.orders(id),
  lot_id UUID NOT NULL REFERENCES public.inventory_lots(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, lot_id)
);
CREATE INDEX orders_expiry ON public.orders(reserved_until) WHERE status = 'pendiente';
CREATE INDEX orders_guest_created ON public.orders(guest_hash, created_at);
CREATE INDEX lots_variant_expiration ON public.inventory_lots(variant_id, expiration_date);

-- Replace the prototype policies. Browser clients cannot write financial or role fields.
DO $$ DECLARE p RECORD; BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN
    ('profiles','brands','categories','products','product_variants','product_images','inventory_lots','inventory_movements','product_regulatory_status','privacy_consents','addresses','carts','cart_items','orders','order_items','payments','shipments','coupons','reviews','admin_audit_logs','site_content','order_lot_allocations')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename); END LOOP;
END $$;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lot_allocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles, public.products, public.product_variants, public.product_images, public.orders, public.order_items, public.payments, public.inventory_lots, public.inventory_movements, public.product_regulatory_status, public.admin_audit_logs, public.coupons, public.site_content, public.order_lot_allocations FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.product_variants, public.product_images, public.orders, public.order_items, public.site_content TO authenticated;
GRANT SELECT ON public.product_variants, public.product_images, public.site_content TO anon;
GRANT SELECT (id,name,slug,description_short,description_long,brand_id,category_id,is_consumable,price_regular,price_promo,stock_minimum,weight_grams,dimensions_cm,commercial_status,regulatory_status,seo_title,seo_meta_description,created_at,updated_at) ON public.products TO anon, authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;
GRANT ALL ON public.order_lot_allocations TO service_role;

CREATE POLICY products_public ON public.products FOR SELECT TO anon, authenticated USING (commercial_status = 'activo' AND regulatory_status = 'aprobado');
CREATE POLICY variants_public ON public.product_variants FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id));
CREATE POLICY images_public ON public.product_images FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id));
CREATE POLICY categories_public ON public.categories FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY brands_public ON public.brands FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY profiles_own_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_own_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY addresses_own ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY consents_own_read ON public.privacy_consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY carts_own ON public.carts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND session_id IS NULL);
CREATE POLICY cart_items_own ON public.cart_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));
CREATE POLICY orders_own_read ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY items_own_read ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY content_public ON public.site_content FOR SELECT TO anon, authenticated USING (key IN ('privacidad', 'terminos', 'derechos-arco', 'regulacion-cofepris'));
CREATE POLICY reviews_public ON public.reviews FOR SELECT TO anon, authenticated USING (is_moderated);

CREATE OR REPLACE FUNCTION public.handle_new_profile() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles(id,email,full_name,role) VALUES(NEW.id,NEW.email,NEW.raw_user_meta_data->>'full_name','client') ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER commerce_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
INSERT INTO public.profiles(id,email,role) SELECT id,email,'client' FROM auth.users WHERE email IS NOT NULL ON CONFLICT(id) DO NOTHING;

CREATE FUNCTION public.commerce_ready() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$ SELECT TRUE $$;

-- Serialize short inventory transactions, never external payment HTTP calls.
CREATE FUNCTION public.expire_orders() RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE o RECORD; item RECORD; a RECORD; n INT := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(7142026);
  FOR o IN SELECT * FROM public.orders WHERE status = 'pendiente' AND reserved_until < NOW() AND NOT inventory_committed AND NOT payment_review_required ORDER BY id FOR UPDATE LOOP
    FOR item IN SELECT * FROM public.order_items WHERE order_id = o.id ORDER BY variant_id LOOP
      UPDATE public.product_variants SET stock_reserved = stock_reserved - item.quantity WHERE id = item.variant_id;
    END LOOP;
    FOR a IN SELECT * FROM public.order_lot_allocations WHERE order_id = o.id ORDER BY lot_id LOOP
      UPDATE public.inventory_lots SET reserved_quantity = reserved_quantity - a.quantity WHERE id = a.lot_id;
    END LOOP;
    IF o.coupon_id IS NOT NULL THEN UPDATE public.coupons SET times_used = GREATEST(0,COALESCE(times_used,0)-1) WHERE id = o.coupon_id; END IF;
    UPDATE public.orders SET status = 'cancelado', updated_at = NOW() WHERE id = o.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

CREATE FUNCTION public.quote_order(p_items JSONB, p_coupon TEXT DEFAULT '') RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE item RECORD; v RECORD; c RECORD; subtotal NUMERIC := 0; discount NUMERIC := 0; shipping NUMERIC; price NUMERIC; lot_stock INT; line_items JSONB := '[]'; coupon_id UUID;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'INVALID_CART'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_items) x WHERE (x->>'quantity') !~ '^[0-9]+$' OR x->>'variantId' IS NULL OR x->>'quantity' IS NULL) THEN RAISE EXCEPTION 'INVALID_CART'; END IF;
  IF (SELECT COUNT(DISTINCT x->>'variantId') FROM jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items) THEN RAISE EXCEPTION 'INVALID_CART'; END IF;
  FOR item IN SELECT (x->>'variantId')::UUID id,(x->>'quantity')::INT qty FROM jsonb_array_elements(p_items) x ORDER BY 1 LOOP
    IF item.qty NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;
    SELECT pv.*,p.name,p.price_regular,p.price_promo,p.is_consumable INTO v FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = item.id AND p.commercial_status = 'activo' AND p.regulatory_status = 'aprobado';
    IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
    IF v.stock_available - v.stock_reserved < item.qty THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK'; END IF;
    IF v.is_consumable THEN
      SELECT COALESCE(SUM(quantity-reserved_quantity),0) INTO lot_stock FROM public.inventory_lots WHERE variant_id = v.id AND is_active AND expiration_date > CURRENT_DATE;
      IF lot_stock < item.qty THEN RAISE EXCEPTION 'INSUFFICIENT_LOTS'; END IF;
    END IF;
    price := COALESCE(v.price_override, LEAST(v.price_regular,COALESCE(v.price_promo,v.price_regular)));
    subtotal := subtotal + price * item.qty;
    line_items := line_items || jsonb_build_array(jsonb_build_object('variantId',v.id,'name',v.name,'variant',concat_ws(' / ',v.flavor,v.size,v.presentation),'price',price,'quantity',item.qty));
  END LOOP;
  IF COALESCE(p_coupon,'') <> '' THEN
    SELECT * INTO c FROM public.coupons WHERE code = UPPER(TRIM(p_coupon)) AND is_active AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until > NOW());
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_COUPON'; END IF;
    IF subtotal < COALESCE(c.min_purchase,0) OR (c.usage_limit IS NOT NULL AND COALESCE(c.times_used,0) >= c.usage_limit) OR (c.discount_type = 'percentage' AND c.discount_value > 100) THEN RAISE EXCEPTION 'INVALID_COUPON'; END IF;
    discount := LEAST(subtotal, ROUND(CASE WHEN c.discount_type = 'percentage' THEN subtotal * c.discount_value / 100 ELSE c.discount_value END,2));
    coupon_id := c.id;
  END IF;
  shipping := CASE WHEN subtotal >= 1500 THEN 0 ELSE 150 END;
  IF subtotal - discount + shipping <= 0 THEN RAISE EXCEPTION 'INVALID_TOTAL'; END IF;
  RETURN jsonb_build_object('items',line_items,'subtotal',subtotal,'discount',discount,'shipping',shipping,'total',subtotal-discount+shipping,'couponId',coupon_id);
END $$;

CREATE FUNCTION public.create_checkout_order(p_key UUID,p_hash TEXT,p_guest TEXT,p_user UUID,p_items JSONB,p_customer JSONB,p_coupon TEXT,p_privacy TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE o public.orders; quote JSONB; item RECORD; lot RECORD; remaining INT; take INT;
BEGIN
  PERFORM pg_advisory_xact_lock(7142026);
  SELECT * INTO o FROM public.orders WHERE checkout_key = p_key;
  IF FOUND THEN
    IF o.guest_hash IS DISTINCT FROM p_guest OR o.request_hash IS DISTINCT FROM p_hash THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
    RETURN to_jsonb(o);
  END IF;
  PERFORM public.expire_orders();
  IF (SELECT COUNT(*) FROM public.orders WHERE guest_hash = p_guest AND created_at > NOW()-INTERVAL '1 hour') >= 10 THEN RAISE EXCEPTION 'RATE_LIMIT'; END IF;
  IF p_privacy IS NULL OR NOT EXISTS (SELECT 1 FROM public.site_content WHERE key = 'privacidad' AND content->>'version' = p_privacy AND LENGTH(TRIM(content->>'body')) > 0) THEN RAISE EXCEPTION 'PRIVACY_UNAVAILABLE'; END IF;
  -- Locks also protect against legitimate manual stock changes during creation.
  PERFORM 1 FROM public.products WHERE id IN (SELECT product_id FROM public.product_variants WHERE id IN (SELECT (x->>'variantId')::UUID FROM jsonb_array_elements(p_items) x)) ORDER BY id FOR SHARE;
  PERFORM 1 FROM public.product_variants WHERE id IN (SELECT (x->>'variantId')::UUID FROM jsonb_array_elements(p_items) x) ORDER BY id FOR UPDATE;
  IF COALESCE(p_coupon,'') <> '' THEN PERFORM 1 FROM public.coupons WHERE code = UPPER(TRIM(p_coupon)) FOR UPDATE; END IF;
  quote := public.quote_order(p_items,p_coupon);
  INSERT INTO public.orders(user_id,subtotal,discount,shipping_cost,total,shipping_address,customer_email,customer_phone,payment_method,checkout_key,request_hash,guest_hash,coupon_id,payment_expires_at,reserved_until,privacy_version,consent_at)
  VALUES(p_user,(quote->>'subtotal')::NUMERIC,(quote->>'discount')::NUMERIC,(quote->>'shipping')::NUMERIC,(quote->>'total')::NUMERIC,p_customer - 'email',p_customer->>'email',p_customer->>'phone','mercado_pago',p_key,p_hash,p_guest,(quote->>'couponId')::UUID,NOW()+INTERVAL '30 minutes',NOW()+INTERVAL '45 minutes',p_privacy,NOW()) RETURNING * INTO o;
  FOR item IN SELECT * FROM jsonb_to_recordset(quote->'items') AS x("variantId" UUID,name TEXT,variant TEXT,price NUMERIC,quantity INT) LOOP
    INSERT INTO public.order_items(order_id,variant_id,product_name,variant_name,price_at_purchase,quantity) VALUES(o.id,item."variantId",item.name,item.variant,item.price,item.quantity);
    UPDATE public.product_variants SET stock_reserved = stock_reserved + item.quantity WHERE id = item."variantId";
    IF (SELECT p.is_consumable FROM public.products p JOIN public.product_variants v ON v.product_id = p.id WHERE v.id = item."variantId") THEN
      remaining := item.quantity;
      FOR lot IN SELECT * FROM public.inventory_lots WHERE variant_id = item."variantId" AND is_active AND expiration_date > CURRENT_DATE AND quantity > reserved_quantity ORDER BY expiration_date,id FOR UPDATE LOOP
        take := LEAST(remaining,lot.quantity-lot.reserved_quantity);
        INSERT INTO public.order_lot_allocations VALUES(o.id,lot.id,take);
        UPDATE public.inventory_lots SET reserved_quantity = reserved_quantity + take WHERE id = lot.id;
        remaining := remaining - take;
        EXIT WHEN remaining = 0;
      END LOOP;
      IF remaining <> 0 THEN RAISE EXCEPTION 'INSUFFICIENT_LOTS'; END IF;
    END IF;
  END LOOP;
  IF o.coupon_id IS NOT NULL THEN UPDATE public.coupons SET times_used = COALESCE(times_used,0)+1 WHERE id = o.coupon_id; END IF;
  RETURN to_jsonb(o);
END $$;

CREATE FUNCTION public.apply_verified_payment(p_order UUID,p_transaction TEXT,p_status TEXT,p_amount NUMERIC,p_currency TEXT,p_updated TIMESTAMPTZ) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE o public.orders; previous public.payments; item RECORD; a RECORD;
BEGIN
  PERFORM pg_advisory_xact_lock(7142026);
  SELECT * INTO o FROM public.orders WHERE id = p_order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF p_amount <> o.total OR p_currency <> 'MXN' THEN RAISE EXCEPTION 'PAYMENT_MISMATCH'; END IF;
  SELECT * INTO previous FROM public.payments WHERE transaction_id = p_transaction;
  IF FOUND THEN
    IF previous.order_id <> p_order THEN RAISE EXCEPTION 'PAYMENT_MISMATCH'; END IF;
    IF previous.provider_updated_at >= p_updated THEN RETURN 'duplicate'; END IF;
  END IF;
  INSERT INTO public.payments(order_id,provider,transaction_id,status,amount,provider_updated_at) VALUES(p_order,'mercado_pago',p_transaction,p_status,p_amount,p_updated)
  ON CONFLICT(transaction_id) DO UPDATE SET status = EXCLUDED.status,provider_updated_at = EXCLUDED.provider_updated_at;
  IF p_status IN ('refunded','charged_back') THEN
    UPDATE public.orders SET payment_review_required = TRUE,updated_at = NOW() WHERE id = o.id;
    RETURN 'review_required'; -- Return inspection/refund reconciliation must precede stock restoration.
  END IF;
  IF p_status <> 'approved' THEN RETURN 'recorded'; END IF;
  IF EXISTS(SELECT 1 FROM public.payments WHERE order_id = o.id AND transaction_id <> p_transaction AND status IN ('approved','refunded','charged_back')) OR o.status <> 'pendiente' OR o.payment_review_required THEN
    IF o.inventory_committed AND previous.status = 'approved' THEN RETURN 'duplicate'; END IF;
    UPDATE public.orders SET payment_review_required = TRUE,updated_at = NOW() WHERE id = o.id;
    RETURN 'review_required';
  END IF;
  -- Expiry may have released the reservation; never take stock from another order.
  IF o.inventory_committed THEN RETURN 'duplicate'; END IF;
  IF EXISTS(SELECT 1 FROM public.order_items oi JOIN public.product_variants pv ON pv.id = oi.variant_id JOIN public.products p ON p.id = pv.product_id WHERE oi.order_id = o.id AND (p.commercial_status <> 'activo' OR p.regulatory_status <> 'aprobado')) THEN
    UPDATE public.orders SET payment_review_required = TRUE WHERE id = o.id;
    RETURN 'review_required';
  END IF;
  IF EXISTS(SELECT 1 FROM public.order_lot_allocations allocation JOIN public.inventory_lots l ON l.id = allocation.lot_id WHERE allocation.order_id = o.id AND (NOT l.is_active OR l.expiration_date <= CURRENT_DATE)) THEN
    UPDATE public.orders SET payment_review_required = TRUE WHERE id = o.id;
    RETURN 'review_required';
  END IF;
  FOR item IN SELECT * FROM public.order_items WHERE order_id = o.id ORDER BY variant_id LOOP
    UPDATE public.product_variants SET stock_available = stock_available-item.quantity,stock_reserved = stock_reserved-item.quantity WHERE id = item.variant_id;
    INSERT INTO public.inventory_movements(variant_id,movement_type,quantity,notes) VALUES(item.variant_id,'salida',item.quantity,'Pedido ' || o.id);
  END LOOP;
  FOR a IN SELECT * FROM public.order_lot_allocations WHERE order_id = o.id ORDER BY lot_id LOOP
    UPDATE public.inventory_lots SET quantity = quantity-a.quantity,reserved_quantity = reserved_quantity-a.quantity WHERE id = a.lot_id;
  END LOOP;
  UPDATE public.orders SET status = 'pagado',inventory_committed = TRUE,updated_at = NOW() WHERE id = o.id;
  RETURN 'paid';
END $$;

CREATE FUNCTION public.review_product(p_product UUID,p_actor UUID,p_status public.regulatory_status_enum,p_notes TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_actor AND role IN ('admin','compliance_officer')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF LENGTH(TRIM(COALESCE(p_notes,''))) < 5 THEN RAISE EXCEPTION 'NOTES_REQUIRED'; END IF;
  UPDATE public.products SET regulatory_status = p_status,commercial_status = CASE WHEN p_status = 'aprobado' THEN 'activo'::public.commercial_status_enum ELSE 'borrador'::public.commercial_status_enum END,updated_at = NOW() WHERE id = p_product;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
  INSERT INTO public.product_regulatory_status(product_id,status,notes,reviewed_by) VALUES(p_product,p_status,p_notes,p_actor);
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'review_product','products',p_product,jsonb_build_object('status',p_status,'notes',p_notes));
END $$;

-- PostgreSQL grants function execution to PUBLIC by default: explicitly revoke it.
REVOKE ALL ON FUNCTION public.handle_new_profile() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.commerce_ready(), public.expire_orders(), public.quote_order(JSONB,TEXT), public.create_checkout_order(UUID,TEXT,TEXT,UUID,JSONB,JSONB,TEXT,TEXT), public.apply_verified_payment(UUID,TEXT,TEXT,NUMERIC,TEXT,TIMESTAMPTZ), public.review_product(UUID,UUID,public.regulatory_status_enum,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_ready(), public.expire_orders(), public.quote_order(JSONB,TEXT), public.create_checkout_order(UUID,TEXT,TEXT,UUID,JSONB,JSONB,TEXT,TEXT), public.apply_verified_payment(UUID,TEXT,TEXT,NUMERIC,TEXT,TIMESTAMPTZ), public.review_product(UUID,UUID,public.regulatory_status_enum,TEXT) TO service_role;
COMMIT;
