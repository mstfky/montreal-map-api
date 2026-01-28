CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS raw;

CREATE TABLE buildings (
                           id            VARCHAR(64) PRIMARY KEY,
                           address       TEXT,
                           neighborhood  TEXT,
                           year_built    INT,
                           floors        INT,
                           building_type TEXT,
                           geom          geometry(Geometry, 4326),

                           created_at    TIMESTAMP NOT NULL DEFAULT now(),
                           updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX buildings_geom_gix ON buildings USING GIST (geom);
CREATE INDEX buildings_neighborhood_idx ON buildings (neighborhood);


CREATE TABLE IF NOT EXISTS public.zonage (
                                             id BIGSERIAL PRIMARY KEY,
                                             zone_code TEXT,
                                             arrondissement TEXT,
                                             district TEXT,
                                             secteur TEXT,
                                             classe1 TEXT,
                                             classe2 TEXT,
                                             classe3 TEXT,
                                             classe4 TEXT,
                                             classe5 TEXT,
                                             classe6 TEXT,
                                             etage_min NUMERIC,
                                             etage_max NUMERIC,
                                             densite_min NUMERIC,
                                             densite_max NUMERIC,
                                             taux_min NUMERIC,
                                             taux_max NUMERIC,
                                             note TEXT,
                                             info TEXT,
                                             geom geometry(MultiPolygon, 4326)
    );

CREATE INDEX IF NOT EXISTS idx_zonage_geom
    ON public.zonage
    USING GIST (geom);



CREATE TABLE IF NOT EXISTS raw.raw_zonage_tab (
                                                  ogc_fid BIGSERIAL PRIMARY KEY,
                                                  wkb_geometry geometry(Polygon, 4326),
    numero_complet VARCHAR(14)
    );