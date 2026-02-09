"""
Montreal Administrative Boundaries Import Script
Imports arrondissements and linked cities boundaries

Usage: python import_admin_boundaries.py
"""

import json
import sys
from pathlib import Path

import psycopg2
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer

# Configuration
GEOJSON_PATH = Path(r"C:\Users\camus\Downloads\montreal_zonage\limites-administratives-agglomeration-nad83.geojson")

DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "montreal",
    "user": "montreal",
    "password": "montreal"
}

# Source CRS is NAD83 MTM zone 8, target is WGS84
SOURCE_CRS = "EPSG:32188"
TARGET_CRS = "EPSG:4326"


def create_table(conn):
    """Create the admin_boundaries table"""
    with conn.cursor() as cur:
        cur.execute("""
            DROP TABLE IF EXISTS admin_boundaries CASCADE;

            CREATE TABLE admin_boundaries (
                id SERIAL PRIMARY KEY,
                code_id INTEGER,
                name TEXT NOT NULL,
                name_official TEXT,
                code_3c VARCHAR(10),
                num INTEGER,
                abbrev VARCHAR(10),
                boundary_type TEXT,
                geom geometry(MultiPolygon, 4326),
                created_at TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE INDEX idx_admin_boundaries_geom ON admin_boundaries USING GIST (geom);
            CREATE INDEX idx_admin_boundaries_name ON admin_boundaries (name);
            CREATE INDEX idx_admin_boundaries_type ON admin_boundaries (boundary_type);
        """)
        conn.commit()
        print("Created table: admin_boundaries")


def load_geojson(path):
    """Load GeoJSON file"""
    print(f"Loading {path.name}...")
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data['features'])} features")
    return data


def insert_boundaries(conn, geojson_data):
    """Insert boundaries into PostgreSQL"""
    print("Transforming and inserting boundaries...")

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

        records.append({
            'code_id': props.get('CODEID'),
            'name': props.get('NOM', 'Unknown'),
            'name_official': props.get('NOM_OFFICIEL'),
            'code_3c': props.get('CODE_3C'),
            'num': props.get('NUM'),
            'abbrev': props.get('ABREV'),
            'boundary_type': props.get('TYPE'),
            'geom': geom_wgs84.wkb_hex
        })

    with conn.cursor() as cur:
        for rec in records:
            cur.execute("""
                INSERT INTO admin_boundaries
                    (code_id, name, name_official, code_3c, num, abbrev, boundary_type, geom)
                VALUES
                    (%(code_id)s, %(name)s, %(name_official)s, %(code_3c)s, %(num)s,
                     %(abbrev)s, %(boundary_type)s, ST_SetSRID(%(geom)s::geometry, 4326))
            """, rec)
        conn.commit()

    print(f"Inserted {len(records)} boundaries")


def print_summary(conn):
    """Print import summary"""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM admin_boundaries")
        total = cur.fetchone()[0]

        cur.execute("""
            SELECT boundary_type, COUNT(*) as cnt
            FROM admin_boundaries
            GROUP BY boundary_type
            ORDER BY cnt DESC
        """)
        by_type = cur.fetchall()

    print("\n" + "="*60)
    print("IMPORT SUMMARY")
    print("="*60)
    print(f"Total boundaries: {total}")
    print("\nBy type:")
    for btype, cnt in by_type:
        print(f"  {btype}: {cnt}")


def main():
    print("="*60)
    print("Montreal Administrative Boundaries Import")
    print("="*60)

    if not GEOJSON_PATH.exists():
        print(f"ERROR: File not found: {GEOJSON_PATH}")
        sys.exit(1)

    print(f"Connecting to database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    conn = psycopg2.connect(**DB_CONFIG)

    try:
        create_table(conn)
        geojson_data = load_geojson(GEOJSON_PATH)
        insert_boundaries(conn, geojson_data)
        print_summary(conn)

        print("\n" + "="*60)
        print("IMPORT COMPLETE!")
        print("="*60)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
