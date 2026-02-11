-- V3: Arrondissements reference table (19 Montreal boroughs)
-- Source: liste-arrondissements.csv from Montreal open data

CREATE TABLE IF NOT EXISTS arrondissements (
    id              SERIAL PRIMARY KEY,
    nom_officiel    TEXT NOT NULL,
    nom_abrege      TEXT,
    acronyme        VARCHAR(10),
    code_3l         VARCHAR(5),
    id_uadm         INTEGER,
    no_arro_election INTEGER,
    code_rem        VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_arrondissements_code_rem ON arrondissements (code_rem);
CREATE INDEX IF NOT EXISTS idx_arrondissements_no_arro ON arrondissements (no_arro_election);

INSERT INTO arrondissements (nom_officiel, nom_abrege, acronyme, code_3l, id_uadm, no_arro_election, code_rem) VALUES
('Ahuntsic-Cartierville',                          'AHUNTSIC-CARTIE',  'AC',    'AHU', 56,  1, 'REM23'),
('Anjou',                                           'ANJOU',           'ANJ',   'ANJ', 79,  2, 'REM09'),
('Côte-des-Neiges–Notre-Dame-de-Grâce',            'CDN-NDG',         'CDNNDG','CDN', 59,  3, 'REM34'),
('Lachine',                                          'LACHINE',        'LAC',   'LAC', 88,  4, 'REM27'),
('LaSalle',                                          'LASALLE',        'LAS',   'LAS', 89,  5, 'REM17'),
('Le Plateau-Mont-Royal',                            'PLAT-MT-ROYAL',  'PMR',   'PLA', 54, 11, 'REM21'),
('Le Sud-Ouest',                                     'SUD-OUEST',      'SO',    'LSO', 53, 16, 'REM20'),
('L''Île-Bizard–Sainte-Geneviève',                  'BI-STE-GE',      'IBSG',  'IBI', 76,  6, 'REM32'),
('Mercier–Hochelaga-Maisonneuve',                    'MERC-HOCH-MA',   'MHM',   'MHM', 55,  7, 'REM22'),
('Montréal-Nord',                                    'MONTREAL-NORD',  'MN',    'MTN', 87,  8, 'REM16'),
('Outremont',                                        'OUTREMONT',      'OUTR',  'OUT', 75,  9, 'REM05'),
('Pierrefonds-Roxboro',                              'PIERREF-ROXBORO','PIRO',  'PRF', 82, 10, 'REM31'),
('Rivière-des-Prairies–Pointe-aux-Trembles',        'RDP-PAT',        'RDPPAT','RDP', 51, 12, 'REM33'),
('Rosemont–La Petite-Patrie',                        'RSMT-PETITE-PAT','RPP',   'RPP', 57, 13, 'REM24'),
('Saint-Laurent',                                    'ST-LAURENT',     'SLA',   'VSL', 86, 14, 'REM15'),
('Saint-Léonard',                                    'ST-LEONARD',     'SLE',   'STL', 85, 15, 'REM14'),
('Verdun',                                           'VERDUN',         'VER',   'VER', 83, 17, 'REM12'),
('Ville-Marie',                                      'VILLE-MARIE',   'VM',    'VIM', 52, 18, 'REM19'),
('Villeray–Saint-Michel–Parc-Extension',             'VILL-ST-M-P-EXT','VSMPE', 'VSE', 58, 19, 'REM25');
