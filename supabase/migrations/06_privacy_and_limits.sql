-- Apply once, after 03. Limitación de tasa, solicitudes ARCO y registro de consentimientos.
BEGIN;

-- Contadores de ventana fija. La clave ya llega como hash: no se guardan IP ni correos en claro.
CREATE TABLE public.rate_limits (
  key TEXT PRIMARY KEY,
  hits INT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.hit_rate_limit(p_key TEXT,p_limit INT,p_window INTERVAL) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_hits INT;
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '1 day' AND key <> p_key;
  INSERT INTO public.rate_limits(key,hits,window_start) VALUES(p_key,1,NOW())
  ON CONFLICT(key) DO UPDATE SET
    hits = CASE WHEN public.rate_limits.window_start < NOW() - p_window THEN 1 ELSE public.rate_limits.hits + 1 END,
    window_start = CASE WHEN public.rate_limits.window_start < NOW() - p_window THEN NOW() ELSE public.rate_limits.window_start END
  RETURNING hits INTO v_hits;
  RETURN v_hits <= p_limit;
END $$;

-- Solicitudes de derechos ARCO (acceso, rectificación, cancelación y oposición).
CREATE TABLE public.arco_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL CHECK (LENGTH(requester_name) BETWEEN 2 AND 200),
  requester_email TEXT NOT NULL CHECK (LENGTH(requester_email) BETWEEN 5 AND 254),
  request_type TEXT NOT NULL CHECK (request_type IN ('acceso','rectificacion','cancelacion','oposicion')),
  details TEXT NOT NULL CHECK (LENGTH(details) BETWEEN 10 AND 4000),
  status TEXT NOT NULL DEFAULT 'recibida' CHECK (status IN ('recibida','en_proceso','resuelta','rechazada')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.arco_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.arco_requests FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.update_arco_request(p_request UUID,p_actor UUID,p_status TEXT,p_notes TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_status NOT IN ('en_proceso','resuelta','rechazada') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF p_status <> 'en_proceso' AND LENGTH(TRIM(COALESCE(p_notes,''))) < 5 THEN RAISE EXCEPTION 'NOTES_REQUIRED'; END IF;
  UPDATE public.arco_requests SET status = p_status,resolution_notes = NULLIF(TRIM(p_notes),''),resolved_by = p_actor,resolved_at = CASE WHEN p_status = 'en_proceso' THEN NULL ELSE NOW() END WHERE id = p_request;
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;
  INSERT INTO public.admin_audit_logs(admin_user_id,action,entity_type,entity_id,payload) VALUES(p_actor,'update_arco_request','arco_requests',p_request,jsonb_build_object('status',p_status));
END $$;

-- Consentimientos: cada cambio agrega una fila (historial); el estado vigente es la fila más reciente por tipo.
CREATE FUNCTION public.set_consent(p_user UUID,p_type TEXT,p_granted BOOLEAN,p_version TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_type NOT IN ('marketing','terminos_condiciones') THEN RAISE EXCEPTION 'INVALID_CONSENT'; END IF;
  INSERT INTO public.privacy_consents(user_id,consent_type,privacy_policy_version,is_granted,granted_at,revoked_at)
  VALUES(p_user,p_type,COALESCE(NULLIF(p_version,''),'sin-version'),p_granted,clock_timestamp(),CASE WHEN p_granted THEN NULL ELSE clock_timestamp() END);
END $$;

REVOKE ALL ON FUNCTION public.hit_rate_limit(TEXT,INT,INTERVAL), public.update_arco_request(UUID,UUID,TEXT,TEXT), public.set_consent(UUID,TEXT,BOOLEAN,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(TEXT,INT,INTERVAL), public.update_arco_request(UUID,UUID,TEXT,TEXT), public.set_consent(UUID,TEXT,BOOLEAN,TEXT) TO service_role;
COMMIT;
