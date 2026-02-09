"""
Montreal Property Assessment Import Script
Imports property assessment data with building attributes (year, floors, type, address)

Usage: python import_property_assessment.py [--limit N]
"""

import argparse
import sys
from pathlib import Path

import geopandas as gpd
import psycopg2
from shapely import wkb

# Configuration
SHP_PATH = Path(r"C:\Users\camus\Downloads\montreal_property_assessment\uniteevaluationfonciere.shp")

DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "montreal",
    "user": "montreal",
    "password": "montreal"
}

TARGET_CRS = "EPSG:4326"  # WGS84


def create_table(conn):
    """Create the property_assessment table"""
    with conn.cursor() as cur:
        cur.execute("""
            DROP TABLE IF EXISTS property_assessment CASCADE;

            CREATE TABLE property_assessment (
                id BIGSERIAL PRIMARY KEY,
                id_uev TEXT,
                civic_number_start TEXT,
                civic_number_end TEXT,
                street_name TEXT,
                suite TEXT,
                municipality TEXT,
                floors INTEGER,
                num_units INTEGER,
                year_built INTEGER,
                usage_code TEXT,
                usage_label TEXT,
                category TEXT,
                matricule TEXT,
                land_area NUMERIC,
                building_area NUMERIC,
                borough TEXT,
                geom geometry(Polygon, 4326),
                created_at TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE INDEX idx_property_assessment_geom
                ON property_assessment USING GIST (geom);

            CREATE INDEX idx_property_assessment_year
                ON property_assessment (year_built);

            CREATE INDEX idx_property_assessment_matricule
                ON property_assessment (matricule);
        """)
        conn.commit()
        print("Created table: property_assessment")


def read_shapefile(shp_path, limit=None):
    """Read shapefile data"""
    print(f"Reading {shp_path.name}...")

    if limit:
        gdf = gpd.read_file(shp_path, rows=limit)
    else:
        gdf = gpd.read_file(shp_path)

    print(f"Read {len(gdf)} features")
    return gdf


def transform_to_wgs84(gdf):
    """Transform geometries to WGS84"""
    print("Transforming coordinates to WGS84...")
    gdf_wgs84 = gdf.to_crs(TARGET_CRS)
    print(f"Transformed {len(gdf_wgs84)} features")
    return gdf_wgs84


def safe_int(val):
    """Safely convert to int"""
    if val is None or (isinstance(val, float) and (val != val)):  # nan check
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def safe_str(val):
    """Safely convert to string"""
    if val is None or (isinstance(val, float) and (val != val)):  # nan check
        return None
    return str(val).strip() if val else None


def insert_properties(conn, gdf):
    """Insert properties into PostgreSQL"""
    print("Inserting properties into database...")

    records = []
    skipped = 0

    for idx, row in gdf.iterrows():
        geom = row.geometry
        if geom is None:
            skipped += 1
            continue

        # Only handle Polygon and MultiPolygon
        if geom.geom_type == 'MultiPolygon':
            # Take the largest polygon from MultiPolygon
            geom = max(geom.geoms, key=lambda g: g.area)
        elif geom.geom_type != 'Polygon':
            skipped += 1
            continue

        geom_wkb = geom.wkb_hex

        records.append({
            'id_uev': safe_str(row.get('ID_UEV')),
            'civic_number_start': safe_str(row.get('CIVIQUE_DE')),
            'civic_number_end': safe_str(row.get('CIVIQUE_FI')),
            'street_name': safe_str(row.get('NOM_RUE')),
            'suite': safe_str(row.get('SUITE_DEBU')),
            'municipality': safe_str(row.get('MUNICIPALI')),
            'floors': safe_int(row.get('ETAGE_HORS')),
            'num_units': safe_int(row.get('NOMBRE_LOG')),
            'year_built': safe_int(row.get('ANNEE_CONS')),
            'usage_code': safe_str(row.get('CODE_UTILI')),
            'usage_label': safe_str(row.get('LIBELLE_UT')),
            'category': safe_str(row.get('CATEGORIE_')),
            'matricule': safe_str(row.get('MATRICULE8')),
            'land_area': row.get('SUPERFICIE') if row.get('SUPERFICIE') == row.get('SUPERFICIE') else None,
            'building_area': row.get('SUPERFIC_1') if row.get('SUPERFIC_1') == row.get('SUPERFIC_1') else None,
            'borough': safe_str(row.get('NO_ARROND_')),
            'geom': geom_wkb
        })

    with conn.cursor() as cur:
        batch_size = 1000
        total = len(records)

        for i in range(0, total, batch_size):
            batch = records[i:i+batch_size]
            cur.executemany("""
                INSERT INTO property_assessment
                    (id_uev, civic_number_start, civic_number_end, street_name, suite,
                     municipality, floors, num_units, year_built, usage_code, usage_label,
                     category, matricule, land_area, building_area, borough, geom)
                VALUES
                    (%(id_uev)s, %(civic_number_start)s, %(civic_number_end)s, %(street_name)s, %(suite)s,
                     %(municipality)s, %(floors)s, %(num_units)s, %(year_built)s, %(usage_code)s, %(usage_label)s,
                     %(category)s, %(matricule)s, %(land_area)s, %(building_area)s, %(borough)s,
                     ST_SetSRID(%(geom)s::geometry, 4326))
            """, batch)
            conn.commit()
            print(f"  Inserted {min(i + batch_size, total)}/{total} properties...")

    print(f"Inserted {len(records)} properties (skipped {skipped} invalid geometries)")


def print_summary(conn):
    """Print import summary"""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM property_assessment")
        total = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM property_assessment WHERE year_built IS NOT NULL")
        with_year = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM property_assessment WHERE floors IS NOT NULL")
        with_floors = cur.fetchone()[0]

        cur.execute("SELECT MIN(year_built), MAX(year_built) FROM property_assessment WHERE year_built > 1600")
        year_range = cur.fetchone()

        cur.execute("""
            SELECT usage_label, COUNT(*) as cnt
            FROM property_assessment
            WHERE usage_label IS NOT NULL
            GROUP BY usage_label
            ORDER BY cnt DESC
            LIMIT 10
        """)
        top_usages = cur.fetchall()

    print("\n" + "="*60)
    print("IMPORT SUMMARY")
    print("="*60)
    print(f"Total properties: {total:,}")
    print(f"With year_built: {with_year:,} ({100*with_year/total:.1f}%)")
    print(f"With floors: {with_floors:,} ({100*with_floors/total:.1f}%)")
    print(f"Year range: {year_range[0]} - {year_range[1]}")
    print("\nTop 10 building types:")
    for usage, cnt in top_usages:
        print(f"  {usage}: {cnt:,}")


def main():
    parser = argparse.ArgumentParser(description='Import Montreal property assessment data')
    parser.add_argument('--limit', type=int, help='Limit number of features to import')
    args = parser.parse_args()

    print("="*60)
    print("Montreal Property Assessment Import")
    print("="*60)

    if not SHP_PATH.exists():
        print(f"ERROR: File not found: {SHP_PATH}")
        sys.exit(1)

    print(f"Connecting to database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    conn = psycopg2.connect(**DB_CONFIG)

    try:
        create_table(conn)
        gdf = read_shapefile(SHP_PATH, limit=args.limit)

        if len(gdf) == 0:
            print("No features found!")
            return

        gdf_wgs84 = transform_to_wgs84(gdf)
        insert_properties(conn, gdf_wgs84)
        print_summary(conn)

        print("\n" + "="*60)
        print("IMPORT COMPLETE!")
        print("="*60)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
