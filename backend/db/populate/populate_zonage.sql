DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='raw' AND table_name='raw_zonage'
  ) THEN
    RAISE NOTICE 'raw.raw_zonage not found. Skipping populate.';
    RETURN;
END IF;
END $$;

TRUNCATE TABLE public.zonage;

INSERT INTO public.zonage (
    zone_code, arrondissement, district, secteur,
    classe1, classe2, classe3, classe4, classe5, classe6,
    etage_min, etage_max,
    densite_min, densite_max,
    taux_min, taux_max,
    note, info,
    geom
)
SELECT
    numero,
    arrond,
    district,
    secteur,
    classe1, classe2, classe3, classe4, classe5, classe6,
    etmin,
    etmax,
    CASE
        WHEN densite_mi IS NULL OR btrim(densite_mi) = '' THEN NULL
        WHEN replace(btrim(densite_mi), ',', '.') ~ '^-?[0-9]+(\.[0-9]+)?$'
          THEN replace(btrim(densite_mi), ',', '.')::numeric
        ELSE NULL
END,
    CASE
    WHEN densite_ma IS NULL OR btrim(densite_ma::text) = '' THEN NULL
    WHEN replace(btrim(densite_ma::text), ',', '.') ~ '^-?[0-9]+(\.[0-9]+)?$'
      THEN replace(btrim(densite_ma::text), ',', '.')::numeric
    ELSE NULL
END,
    taux_min,
    taux_max,
    note_2,
    info,
    ST_Multi(ST_Force2D(geom))
FROM raw.raw_zonage
WHERE geom IS NOT NULL;
