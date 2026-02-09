-- Montreal Map API - Building Population Script
-- Buildings placed within actual zonage polygons for proper zone association
-- Multiple buildings per zone to demonstrate zone-building relationships

-- Clear existing buildings for fresh data
TRUNCATE TABLE buildings;

-- ============================================================================
-- ZONE 0001 - Two buildings (Residential)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0001-a',
    '1000 Rue Saint-Édouard',
    'Rosemont-La Petite-Patrie',
    1965,
    4,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61920 45.53100,
        -73.61900 45.53100,
        -73.61900 45.53115,
        -73.61920 45.53115,
        -73.61920 45.53100
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0001-b',
    '1010 Rue Saint-Édouard',
    'Rosemont-La Petite-Patrie',
    1972,
    3,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61895 45.53105,
        -73.61875 45.53105,
        -73.61875 45.53120,
        -73.61895 45.53120,
        -73.61895 45.53105
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0002 - Three buildings (Mixed types)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0002-a',
    '2000 Avenue du Parc',
    'Rosemont-La Petite-Patrie',
    1980,
    6,
    'Commercial',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61995 45.53260,
        -73.61975 45.53260,
        -73.61975 45.53280,
        -73.61995 45.53280,
        -73.61995 45.53260
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0002-b',
    '2010 Avenue du Parc',
    'Rosemont-La Petite-Patrie',
    1955,
    2,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61970 45.53265,
        -73.61950 45.53265,
        -73.61950 45.53285,
        -73.61970 45.53285,
        -73.61970 45.53265
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0002-c',
    '2020 Avenue du Parc',
    'Rosemont-La Petite-Patrie',
    2015,
    8,
    'Mixed',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61990 45.53285,
        -73.61970 45.53285,
        -73.61970 45.53300,
        -73.61990 45.53300,
        -73.61990 45.53285
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0006 - Two buildings (Commercial)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0006-a',
    '600 Boulevard Rosemont',
    'Rosemont-La Petite-Patrie',
    1990,
    5,
    'Commercial',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61385 45.52970,
        -73.61365 45.52970,
        -73.61365 45.52990,
        -73.61385 45.52990,
        -73.61385 45.52970
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0006-b',
    '610 Boulevard Rosemont',
    'Rosemont-La Petite-Patrie',
    2005,
    4,
    'Commercial',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61360 45.52975,
        -73.61340 45.52975,
        -73.61340 45.52995,
        -73.61360 45.52995,
        -73.61360 45.52975
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0011 - One building (Industrial)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0011-a',
    '1100 Rue Masson',
    'Rosemont-La Petite-Patrie',
    1945,
    2,
    'Industrial',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61500 45.53295,
        -73.61480 45.53295,
        -73.61480 45.53315,
        -73.61500 45.53315,
        -73.61500 45.53295
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0020 - Three buildings (Residential neighborhood)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0020-a',
    '2000 Rue Beaubien',
    'Rosemont-La Petite-Patrie',
    1960,
    3,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61450 45.52700,
        -73.61430 45.52700,
        -73.61430 45.52720,
        -73.61450 45.52720,
        -73.61450 45.52700
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0020-b',
    '2010 Rue Beaubien',
    'Rosemont-La Petite-Patrie',
    1958,
    2,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61425 45.52705,
        -73.61405 45.52705,
        -73.61405 45.52725,
        -73.61425 45.52725,
        -73.61425 45.52705
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0020-c',
    '2020 Rue Beaubien',
    'Rosemont-La Petite-Patrie',
    2020,
    5,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61445 45.52725,
        -73.61425 45.52725,
        -73.61425 45.52745,
        -73.61445 45.52745,
        -73.61445 45.52725
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0035 - Two buildings (Mixed use area)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0035-a',
    '3500 Rue Saint-Denis',
    'Rosemont-La Petite-Patrie',
    1975,
    4,
    'Mixed',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.61000 45.52820,
        -73.60980 45.52820,
        -73.60980 45.52840,
        -73.61000 45.52840,
        -73.61000 45.52820
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0035-b',
    '3510 Rue Saint-Denis',
    'Rosemont-La Petite-Patrie',
    1968,
    3,
    'Commercial',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.60975 45.52825,
        -73.60955 45.52825,
        -73.60955 45.52845,
        -73.60975 45.52845,
        -73.60975 45.52825
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0050 - Large commercial building (Point geometry)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0050-a',
    '5000 Boulevard Saint-Laurent',
    'Rosemont-La Petite-Patrie',
    2010,
    12,
    'Commercial',
    ST_SetSRID(ST_Point(-73.61183, 45.54231), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0082 - Office building (Point geometry)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0082-a',
    '8200 Avenue Christophe-Colomb',
    'Rosemont-La Petite-Patrie',
    1995,
    7,
    'Commercial',
    ST_SetSRID(ST_Point(-73.60893, 45.54027), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0109 - Residential complex (MultiPolygon - two blocks)
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0109-a',
    '10900 Rue de Lanaudière',
    'Rosemont-La Petite-Patrie',
    2018,
    6,
    'Residential',
    ST_SetSRID(ST_GeomFromText('MULTIPOLYGON(
        ((
            -73.60695 45.54750,
            -73.60675 45.54750,
            -73.60675 45.54770,
            -73.60695 45.54770,
            -73.60695 45.54750
        )),
        ((
            -73.60670 45.54755,
            -73.60650 45.54755,
            -73.60650 45.54775,
            -73.60670 45.54775,
            -73.60670 45.54755
        ))
    )'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0142 - Historic building
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0142-a',
    '1420 Rue Laurier',
    'Rosemont-La Petite-Patrie',
    1925,
    3,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.60375 45.54615,
        -73.60355 45.54615,
        -73.60355 45.54635,
        -73.60375 45.54635,
        -73.60375 45.54615
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0142-b',
    '1430 Rue Laurier',
    'Rosemont-La Petite-Patrie',
    1930,
    2,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.60350 45.54620,
        -73.60330 45.54620,
        -73.60330 45.54640,
        -73.60350 45.54640,
        -73.60350 45.54620
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ZONE 0219 - Modern development
-- ============================================================================
INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0219-a',
    '2190 Avenue Van Horne',
    'Rosemont-La Petite-Patrie',
    2022,
    10,
    'Mixed',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.59535 45.54235,
        -73.59515 45.54235,
        -73.59515 45.54255,
        -73.59535 45.54255,
        -73.59535 45.54235
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES (
    'bldg-z0219-b',
    '2200 Avenue Van Horne',
    'Rosemont-La Petite-Patrie',
    2021,
    8,
    'Residential',
    ST_SetSRID(ST_GeomFromText('POLYGON((
        -73.59510 45.54240,
        -73.59490 45.54240,
        -73.59490 45.54260,
        -73.59510 45.54260,
        -73.59510 45.54240
    ))'), 4326)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Summary: 20 buildings across 10 different zones
-- - Zones with multiple buildings: 0001(2), 0002(3), 0006(2), 0020(3), 0035(2), 0142(2), 0219(2)
-- - Zones with single building: 0011(1), 0050(1), 0082(1), 0109(1)
-- - Building types: Residential(10), Commercial(5), Mixed(4), Industrial(1)
-- - Geometry types: Point(2), Polygon(17), MultiPolygon(1)
-- ============================================================================
