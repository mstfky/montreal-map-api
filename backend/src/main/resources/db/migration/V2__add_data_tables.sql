-- V2: Create tables for all JPA entities that were previously only created by Python import scripts.
-- This ensures Hibernate schema validation passes on a fresh database before any data imports.
-- Uses IF NOT EXISTS so it won't conflict with tables already created by import scripts.

-- Property assessment (building details from Montreal open data)
CREATE TABLE IF NOT EXISTS property_assessment (
    id          BIGSERIAL PRIMARY KEY,
    id_uev      TEXT,
    civic_number_start TEXT,
    civic_number_end   TEXT,
    street_name TEXT,
    suite       TEXT,
    municipality TEXT,
    floors      INTEGER,
    num_units   INTEGER,
    year_built  INTEGER,
    usage_code  TEXT,
    usage_label TEXT,
    category    TEXT,
    matricule   TEXT,
    land_area   NUMERIC,
    building_area NUMERIC,
    borough     TEXT,
    geom        geometry(Polygon, 4326),
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_assessment_geom
    ON property_assessment USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_property_assessment_year
    ON property_assessment (year_built);

CREATE INDEX IF NOT EXISTS idx_property_assessment_matricule
    ON property_assessment (matricule);


-- Administrative boundaries (arrondissements and linked cities)
CREATE TABLE IF NOT EXISTS admin_boundaries (
    id             SERIAL PRIMARY KEY,
    code_id        INTEGER,
    name           TEXT NOT NULL,
    name_official  TEXT,
    code_3c        VARCHAR(10),
    num            INTEGER,
    abbrev         VARCHAR(10),
    boundary_type  TEXT,
    geom           geometry(MultiPolygon, 4326),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_boundaries_geom
    ON admin_boundaries USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_admin_boundaries_name
    ON admin_boundaries (name);

CREATE INDEX IF NOT EXISTS idx_admin_boundaries_type
    ON admin_boundaries (boundary_type);


-- Land use zones (city-wide affectation du sol)
CREATE TABLE IF NOT EXISTS land_use (
    id             SERIAL PRIMARY KEY,
    affectation    TEXT NOT NULL,
    affectation_en TEXT,
    area_sqm       NUMERIC,
    geom           geometry(MultiPolygon, 4326),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_land_use_geom
    ON land_use USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_land_use_affectation
    ON land_use (affectation);


-- Montreal building footprints (from official GeoPackage)
CREATE TABLE IF NOT EXISTS montreal_buildings (
    id             BIGSERIAL PRIMARY KEY,
    source_layer   TEXT,
    superficie     NUMERIC,
    update_date    TEXT,
    source         TEXT,
    version        NUMERIC,
    geom           geometry(MultiPolygon, 4326),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_montreal_buildings_geom
    ON montreal_buildings USING GIST (geom);
