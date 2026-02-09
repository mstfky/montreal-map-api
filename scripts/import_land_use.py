"""
Montreal Land Use (Affectation du sol) Import Script
Imports city-wide land use zones covering all Montreal arrondissements

Usage: python import_land_use.py
"""

import json
import sys
from pathlib import Path

import psycopg2
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer

# Configuration
GEOJSON_PATH = Path(r"C:\Users\camus\Downloads\montreal_zonage\graffectations.json")

DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "montreal",
    "user": "montreal",
    "password": "montreal"
}

# Source CRS is EPSG:32188 (NAD83 / MTM zone 8), target is WGS84
SOURCE_CRS = "EPSG:32188"
TARGET_CRS = "EPSG:4326"


def create_table(conn):
    """Create the land_use table"""
    with conn.cursor() as cur:
        cur.execute("""
            DROP TABLE IF EXISTS land_use CASCADE;

            CREATE TABLE land_use (
                id SERIAL PRIMARY KEY,
                affectation TEXT NOT NULL,
                affectation_en TEXT,
                area_sqm NUMERIC,
                geom geometry(MultiPolygon, 4326),
                created_at TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE INDEX idx_land_use_geom ON land_use USING GIST (geom);
            CREATE INDEX idx_land_use_affectation ON land_use (affectation);
        """)
        conn.commit()
        print("Created table: land_use")


def translate_affectation(fr_name):
    """Translate French affectation names to English"""
    translations = {
        "Activités diversifiées": "Mixed Use",
        "Agricole": "Agricultural",
        "Centre-ville d'agglomération": "Downtown Core",
        "Conservation": "Conservation",
        "Dominante résidentielle": "Residential",
        "Grand espace vert ou récréation": "Parks & Recreation",
        "Grande emprise ou grande infrastructure publique": "Public Infrastructure",
        "Industrie": "Industrial"
    }
    return translations.get(fr_name, fr_name)


def load_geojson(path):
    """Load GeoJSON file"""
    print(f"Loading {path.name}...")
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data['features'])} features")
    return data


def insert_land_use(conn, geojson_data):
    """Insert land use zones into PostgreSQL"""
    print("Transforming and inserting land use zones...")

    # Create coordinate transformer
    transformer = Transformer.from_crs(SOURCE_CRS, TARGET_CRS, always_xy=True)

    def transform_coords(x, y):
        return transformer.transform(x, y)

    records = []

    for feat in geojson_data['features']:
        props = feat['properties']
        geom = shape(feat['geometry'])

        # Transform to WGS84
        geom_wgs84 = transform(transform_coords, geom)

        # Ensure it's a MultiPolygon
        if geom_wgs84.geom_type == 'Polygon':
            from shapely.geometry import MultiPolygon
            geom_wgs84 = MultiPolygon([geom_wgs84])

        affectation = props.get('AFFECTATIO', 'Unknown')
        area = props.get('Shape_Area')

        records.append({
            'affectation': affectation,
            'affectation_en': translate_affectation(affectation),
            'area_sqm': area,
            'geom': geom_wgs84.wkb_hex
        })

    with conn.cursor() as cur:
        for rec in records:
            cur.execute("""
                INSERT INTO land_use (affectation, affectation_en, area_sqm, geom)
                VALUES (%(affectation)s, %(affectation_en)s, %(area_sqm)s,
                        ST_SetSRID(%(geom)s::geometry, 4326))
            """, rec)
        conn.commit()

    print(f"Inserted {len(records)} land use zones")


def print_summary(conn):
    """Print import summary"""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM land_use")
        total = cur.fetchone()[0]

        cur.execute("""
            SELECT affectation_en, COUNT(*) as cnt,
                   ROUND(SUM(area_sqm)::numeric / 1000000, 2) as area_km2
            FROM land_use
            GROUP BY affectation_en
            ORDER BY cnt DESC
        """)
        by_type = cur.fetchall()

    print("\n" + "="*60)
    print("IMPORT SUMMARY")
    print("="*60)
    print(f"Total land use zones: {total}")
    print("\nBy type:")
    for name, cnt, area in by_type:
        print(f"  {name}: {cnt} zones ({area} km²)")


def main():
    print("="*60)
    print("Montreal Land Use Import")
    print("="*60)

    if not GEOJSON_PATH.exists():
        print(f"ERROR: File not found: {GEOJSON_PATH}")
        sys.exit(1)

    print(f"Connecting to database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    conn = psycopg2.connect(**DB_CONFIG)

    try:
        create_table(conn)
        geojson_data = load_geojson(GEOJSON_PATH)
        insert_land_use(conn, geojson_data)
        print_summary(conn)

        print("\n" + "="*60)
        print("IMPORT COMPLETE!")
        print("="*60)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
