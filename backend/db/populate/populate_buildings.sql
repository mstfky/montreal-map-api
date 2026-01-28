INSERT INTO buildings (id, address, neighborhood, year_built, floors, building_type, geom)
VALUES
    ('bldg-1001', 'Rue Billeron O, Montréal', 'Saint-Laurent', 1968, 12, 'Residential',
     ST_SetSRID(ST_Point(-73.692781, 45.5094459), 4326)),
    ('bldg-1002', '2404 Rue Harriet Quimby H4R 3E4, Montréal', 'Bois-Franc', 2003, 3, 'Residential',
     ST_SetSRID(ST_Point(-73.7078825,  45.5129002), 4326)),
    ('bldg-1003', '2000 Boulevard René-Lévesque O, Montréal', 'Ville-Marie', 1985, 25, 'Mixed',
     ST_SetSRID(ST_Point(-73.540235, 45.4672016), 4326))ON CONFLICT (id) DO NOTHING;



INSERT INTO buildings (
    id, address, neighborhood, year_built, floors, building_type, geom
)
VALUES (
           'bldg-1004',
           '100 Rue Sainte-Catherine O',
           'Ville-Marie',
           1985,
           12,
           'Commercial',
           ST_SetSRID(
                   ST_GeomFromText(
                           'POLYGON((
                             -73.56790 45.50160,
                             -73.56770 45.50160,
                             -73.56770 45.50180,
                             -73.56790 45.50180,
                             -73.56790 45.50160
                           ))'
                   ),
                   4326
           )
       )ON CONFLICT (id) DO NOTHING;


INSERT INTO buildings (
    id, address, neighborhood, year_built, floors, building_type, geom
)
VALUES (
           'bldg-1005',
           '4500 Rue Saint-Denis',
           'Plateau-Mont-Royal',
           1920,
           3,
           'Residential',
           ST_SetSRID(
                   ST_GeomFromText(
                           'POLYGON((
                             -73.57520 45.52310,
                             -73.57500 45.52310,
                             -73.57500 45.52330,
                             -73.57520 45.52330,
                             -73.57520 45.52310
                           ))'
                   ),
                   4326
           )
       )ON CONFLICT (id) DO NOTHING;


INSERT INTO buildings (
    id, address, neighborhood, year_built, floors, building_type, geom
)
VALUES (
           'bldg-1006',
           '200 Rue Peel',
           'Griffintown',
           2018,
           18,
           'Residential',
           ST_SetSRID(
                   ST_GeomFromText(
                           'POLYGON((
                             -73.55980 45.49220,
                             -73.55960 45.49220,
                             -73.55960 45.49245,
                             -73.55980 45.49245,
                             -73.55980 45.49220
                           ))'
                   ),
                   4326
           )
       )ON CONFLICT (id) DO NOTHING;


INSERT INTO buildings (
    id, address, neighborhood, year_built, floors, building_type, geom
)
VALUES (
           'bldg-mp-1007',
           'Complex Building – Two Blocks',
           'Ville-Marie',
           2005,
           10,
           'Commercial',
           ST_SetSRID(
                   ST_GeomFromText(
                           'MULTIPOLYGON(
                             (
                               (
                                 -73.56820 45.50120,
                                 -73.56800 45.50120,
                                 -73.56800 45.50140,
                                 -73.56820 45.50140,
                                 -73.56820 45.50120
                               )
                             ),
                             (
                               (
                                 -73.56790 45.50120,
                                 -73.56770 45.50120,
                                 -73.56770 45.50140,
                                 -73.56790 45.50140,
                                 -73.56790 45.50120
                               )
                             )
                           )'
                   ),
                   4326
           )
       ) ON CONFLICT (id) DO NOTHING;

