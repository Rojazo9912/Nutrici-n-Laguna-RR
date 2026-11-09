-- 08: Bloqueo de productos con sustancias controladas, de receta o inyectables.
--
-- Problema que corrige: la restricción check_prohibited_substances solo revisa el NOMBRE DE LA
-- CATEGORÍA. Un producto llamado "Testosterona ..." o "Tamoxifeno ..." podía aprobarse y
-- activarse dentro de cualquier categoría (y un script de aprobación masiva lo hizo).
--
-- Esta migración:
--   1. Define public.restricted_product_term(texto): devuelve el término restringido encontrado o NULL.
--   2. Retira (rechazado + oculto) los productos existentes que coinciden, con historial regulatorio.
--   3. Agrega un trigger que impide que un producto coincidente quede 'aprobado' o 'activo',
--      venga del panel, de un RPC o de un script con service_role.
--
-- La detección es por texto (nombre del producto + nombre y slug de su categoría). No sustituye la
-- revisión humana: un producto con nombre comercial engañoso puede no coincidir. Los falsos positivos
-- se corrigen editando la lista de esta función en una migración nueva, nunca desactivando el trigger.
BEGIN;

CREATE OR REPLACE FUNCTION public.restricted_product_term(p_text TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT (regexp_match(
    translate(lower(COALESCE(p_text, '')), 'áéíóúüñ', 'aeiouun'),
    -- Esteroides anabólicos y SARMs
    'esteroide|\msarms?\M|prohormon|anaboli|testosteron|nandrolon|deca[- ]?durabolin|trembolon|trenbolon'
    || '|boldenon|stanozolol|winstrol|masteron|drostanolon|primobolan|metenolon|proviron|mesterolon'
    || '|oximetolon|oxymetholon|anadrol|oxandrol|anavar|fluoxymesteron|halotestin|haloplex|turinabol'
    || '|sustanon|sostenon|equipoise|cardarine|ostarin|ligandrol|\mrad[- ]?140\M|\mmk[- ]?677\M|ibutamoren|\myk[- ]?11\M'
    -- Estimulantes prohibidos
    || '|clenbut|clembut|efedr|ephedr|\mdmaa\M|sibutramin|lipodrene|stimerex|black widow|yellow scorpion|red wasp'
    -- Tratamientos reductivos señalados por COFEPRIS (SBS / Sib Svelt)
    || '|\msbs\M|svelt'
    -- Medicamentos de receta y hormonas
    || '|tamoxif|nolvadex|nolvedex|clomif|\mclomid\M|serophene|arimidex|anastrozol|letrozol|exemestan'
    || '|gonadotrop|\mhcg\M|somatrop|\mhgh\M|\migf|insulina|\mdhea\M|prasteron|triyodotiro|liotironin|levotiroxin'
    || '|orlistat|sildenafil|tadalafil|botox|toxina'
    -- Inyectables y mesoterapia
    || '|inyectable|ampolleta|\mampollas?\M|\mvial(?:es)?\M|\m[0-9]+ ?amp\M|mesoterapia|procaina|\mcoctel'
    || '|liposin|lipofase|lipostabil|lipotrofin|fosfatidilcolina|fostatidilcolina|phosphatidylcholin|deoxicolato'
    || '|dermastabilon|\mtriac\M|nctc|\mvacuna'
  ))[1]
$$;

CREATE OR REPLACE FUNCTION public.product_restricted_term(p_name TEXT, p_category UUID) RETURNS TEXT
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT public.restricted_product_term(
    COALESCE(p_name, '') || ' ' || COALESCE((SELECT name || ' ' || slug FROM public.categories WHERE id = p_category), '')
  )
$$;

-- 2. Retirar lo ya publicado o aprobado. No se borra nada: queda rechazado y oculto, con historial.
WITH withdrawn AS (
  UPDATE public.products p
     SET regulatory_status = 'rechazado', commercial_status = 'oculto', updated_at = NOW()
   WHERE public.product_restricted_term(p.name, p.category_id) IS NOT NULL
     AND (p.regulatory_status <> 'rechazado' OR p.commercial_status <> 'oculto')
  RETURNING p.id, public.product_restricted_term(p.name, p.category_id) AS term
)
INSERT INTO public.product_regulatory_status(product_id, status, notes, reviewed_by)
SELECT id, 'rechazado',
       'Retiro automático (migración 08): coincide con sustancia controlada, de receta o inyectable ("' || term || '"). Requiere revisión del responsable sanitario.',
       NULL
  FROM withdrawn;

-- 3. Impedir que vuelvan a aprobarse o activarse.
CREATE OR REPLACE FUNCTION public.block_restricted_products() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_term TEXT;
BEGIN
  IF NEW.regulatory_status = 'aprobado' OR NEW.commercial_status = 'activo' THEN
    v_term := public.product_restricted_term(NEW.name, NEW.category_id);
    IF v_term IS NOT NULL THEN
      RAISE EXCEPTION 'RESTRICTED_PRODUCT: "%" no puede aprobarse ni activarse', v_term;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS products_block_restricted ON public.products;
CREATE TRIGGER products_block_restricted
  BEFORE INSERT OR UPDATE OF name, category_id, regulatory_status, commercial_status ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.block_restricted_products();

REVOKE ALL ON FUNCTION public.block_restricted_products() FROM PUBLIC, anon, authenticated;

COMMIT;
