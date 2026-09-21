-- Apply once, after 03. Alta de productos desde el panel: siempre nace en borrador/pendiente.
BEGIN;

CREATE FUNCTION public.create_product(
  p_actor UUID, p_name TEXT, p_slug TEXT, p_description_short TEXT, p_description_long TEXT,
  p_brand UUID, p_category UUID, p_is_consumable BOOLEAN, p_price_regular NUMERIC, p_price_promo NUMERIC,
  p_stock_minimum INT, p_weight_grams INT, p_dimensions TEXT, p_sku TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_price_promo IS NOT NULL AND p_price_promo > p_price_regular THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;
  INSERT INTO public.products(name,slug,description_short,description_long,brand_id,category_id,is_consumable,price_regular,price_promo,stock_minimum,weight_grams,dimensions_cm,commercial_status,regulatory_status)
  VALUES(p_name,p_slug,p_description_short,p_description_long,p_brand,p_category,p_is_consumable,p_price_regular,p_price_promo,p_stock_minimum,p_weight_grams,p_dimensions,'borrador','pendiente')
  RETURNING id INTO v_id;
  INSERT INTO public.product_variants(product_id,sku) VALUES(v_id,p_sku);
  INSERT INTO public.product_regulatory_status(product_id,status,notes,reviewed_by) VALUES(v_id,'pendiente','Alta del producto: pendiente de revisión regulatoria.',p_actor);
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'create_product','products',v_id,jsonb_build_object('name',p_name,'slug',p_slug,'sku',p_sku));
  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.create_product(UUID,TEXT,TEXT,TEXT,TEXT,UUID,UUID,BOOLEAN,NUMERIC,NUMERIC,INT,INT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_product(UUID,TEXT,TEXT,TEXT,TEXT,UUID,UUID,BOOLEAN,NUMERIC,NUMERIC,INT,INT,TEXT,TEXT) TO service_role;

-- Bucket de imágenes: lectura pública, escritura solo con service_role (sin políticas de escritura).
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('products','products',TRUE,3145728,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = 3145728, allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

COMMIT;
