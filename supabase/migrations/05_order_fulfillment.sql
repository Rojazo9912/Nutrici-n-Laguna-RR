-- Apply once, after 03. Cumplimiento de pedidos: pagado -> preparando -> enviado -> entregado.
BEGIN;

CREATE FUNCTION public.advance_order(p_order UUID,p_actor UUID,p_status public.order_status_enum,p_carrier TEXT,p_tracking TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = p_order FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF o.payment_review_required THEN RAISE EXCEPTION 'PAYMENT_REVIEW'; END IF;
  IF NOT ((o.status = 'pagado' AND p_status = 'preparando') OR (o.status = 'preparando' AND p_status = 'enviado') OR (o.status = 'enviado' AND p_status = 'entregado')) THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
  IF p_status = 'enviado' THEN
    IF LENGTH(TRIM(COALESCE(p_carrier,''))) < 2 OR LENGTH(TRIM(COALESCE(p_tracking,''))) < 3 THEN RAISE EXCEPTION 'TRACKING_REQUIRED'; END IF;
    INSERT INTO public.shipments(order_id,carrier,tracking_number,status,shipped_at) VALUES(p_order,TRIM(p_carrier),TRIM(p_tracking),'enviado',NOW())
    ON CONFLICT(order_id) DO UPDATE SET carrier = EXCLUDED.carrier,tracking_number = EXCLUDED.tracking_number,status = 'enviado',shipped_at = NOW();
  ELSIF p_status = 'entregado' THEN
    UPDATE public.shipments SET status = 'entregado' WHERE order_id = p_order;
  END IF;
  UPDATE public.orders SET status = p_status,updated_at = NOW() WHERE id = p_order;
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'advance_order','orders',p_order,jsonb_build_object('from',o.status,'to',p_status,'carrier',p_carrier,'tracking',p_tracking));
END $$;

REVOKE ALL ON FUNCTION public.advance_order(UUID,UUID,public.order_status_enum,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.advance_order(UUID,UUID,public.order_status_enum,TEXT,TEXT) TO service_role;
COMMIT;
