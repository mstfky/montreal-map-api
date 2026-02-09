"""
Montreal Building Import Script
Imports building footprints from official Montreal GeoPackage files into PostgreSQL/PostGIS

Usage: python import_montreal_buildings.py [--limit N] [--bbox minLng,minLat,maxLng,maxLat]
"""

import argparse
import sys
from pathlib import Path

import geopandas as gpd
import psycopg2
from psycopg2.extras import execute_values
from shapely import wkb
from shapely.ops import transform
import pyproj

# Configuration
GPKG_PATH = Path(r"C:\Users\camus\Downloads\batiments_2d_2016_arrondissements\CARTO_BAT_TOIT.gpkg")
LAYER_NAME = "cartobattoit"

DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "montreal",
    "user": "montreal",
    "password": "montreal"
}

# Source CRS (NAD83 MTM Zone 8) to WGS84
SOURCE_CRS = "EPSG:32188"  # NAD83 MTM Zone 8
TARGET_CRS = "EPSG:4326"   # WGS84


def create_table(conn):
    """Create or update the montreal_buildings table"""
    with conn.cursor() as cur:
        # Drop and recreate for clean import
        cur.execute("""
            DROP TABLE IF EXISTS montreal_buildings CASCADE;

            CREATE TABLE montreal_buildings (
                id BIGSERIAL PRIMARY KEY,
                source_layer TEXT,
                superficie NUMERIC,
                update_date TEXT,
                source TEXT,
                version NUMERIC,
                geom geometry(MultiPolygon, 4326),
                created_at TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE INDEX idx_montreal_buildings_geom
                ON montreal_buildings USING GIST (geom);
        """)
        conn.commit()
        print("Created table: montreal_buildings")


def read_gpkg_data(gpkg_path, layer_name, limit=None, bbox=None):
    """Read GeoPackage data with optional filtering"""
    print(f"Reading {gpkg_path.name}, layer: {layer_name}...")

    # Read with geopandas
    if bbox:
        # bbox should be in WGS84, convert to source CRS for filtering
        transformer = pyproj.Transformer.from_crs(TARGET_CRS, SOURCE_CRS, always_xy=True)
        minx, miny = transformer.transform(bbox[0], bbox[1])
        maxx, maxy = transformer.transform(bbox[2], bbox[3])
        gdf = gpd.read_file(gpkg_path, layer=layer_name, bbox=(minx, miny, maxx, maxy))
    else:
        gdf = gpd.read_file(gpkg_path, layer=layer_name)

    print(f"Read {len(gdf)} features")

    if limit:
        gdf = gdf.head(limit)
        print(f"Limited to {len(gdf)} features")

    return gdf


def transform_to_wgs84(gdf):
    """Transform geometries from source CRS to WGS84"""
    print("Transforming coordinates to WGS84...")

    # Set the source CRS if not already set
    if gdf.crs is None:
        gdf = gdf.set_crs(SOURCE_CRS)

    # Transform to WGS84
    gdf_wgs84 = gdf.to_crs(TARGET_CRS)

    print(f"Transformed {len(gdf_wgs84)} features to WGS84")
    return gdf_wgs84


def insert_buildings(conn, gdf):
    """Insert buildings into PostgreSQL"""
    print("Inserting buildings into database...")

    records = []
    for idx, row in gdf.iterrows():
        geom = row.geometry
        if geom is None:
            continue

        # Ensure MultiPolygon
        if geom.geom_type == 'Polygon':
            from shapely.geometry import MultiPolygon
            geom = MultiPolygon([geom])
        elif geom.geom_type != 'MultiPolygon':
            continue

        # Convert to WKB hex
        geom_wkb = geom.wkb_hex

        records.append((
            row.get('calque', 'CARTO-BAT-TOIT'),
            row.get('superficie'),
            row.get('MAJ'),
            row.get('source'),
            row.get('version'),
            geom_wkb
        ))

    with conn.cursor() as cur:
        # Batch insert
        sql = """
            INSERT INTO montreal_buildings
                (source_layer, superficie, update_date, source, version, geom)
            VALUES %s
        """
        template = "(%(source_layer)s, %(superficie)s, %(update_date)s, %(source)s, %(version)s, ST_SetSRID(%(geom)s::geometry, 4326))"

        # Convert to dict format for execute_values
        records_dict = [
            {
                'source_layer': r[0],
                'superficie': r[1],
                'update_date': r[2],
                'source': r[3],
                'version': r[4],
                'geom': r[5]
            }
            for r in records
        ]

        # Insert in batches
        batch_size = 1000
        total = len(records_dict)
        for i in range(0, total, batch_size):
            batch = records_dict[i:i+batch_size]
            cur.executemany("""
                INSERT INTO montreal_buildings
                    (source_layer, superficie, update_date, source, version, geom)
                VALUES
                    (%(source_layer)s, %(superficie)s, %(update_date)s, %(source)s, %(version)s,
                     ST_SetSRID(%(geom)s::geometry, 4326))
            """, batch)
            conn.commit()
            print(f"  Inserted {min(i + batch_size, total)}/{total} buildings...")

    print(f"Inserted {len(records)} buildings total")


def create_view_for_api(conn):
    """Create a view that combines montreal_buildings with the existing buildings API format"""
    with conn.cursor() as cur:
        cur.execute("""
            -- Create a view that provides API-compatible format
            DROP VIEW IF EXISTS v_all_buildings;

            CREATE VIEW v_all_buildings AS
            SELECT
                id::text AS id,
                NULL AS address,
                NULL AS neighborhood,
                NULL AS year_built,
                NULL AS floors,
                'Building' AS building_type,
                geom,
                created_at,
                created_at AS updated_at
            FROM montreal_buildings

            UNION ALL

            SELECT
                id,
                address,
                neighborhood,
                year_built,
                floors,
                building_type,
                geom,
                created_at,
                updated_at
            FROM buildings;
        """)
        conn.commit()
        print("Created view: v_all_buildings")


def main():
    parser = argparse.ArgumentParser(description='Import Montreal building data')
    parser.add_argument('--limit', type=int, help='Limit number of features to import')
    parser.add_argument('--bbox', type=str, help='Bounding box filter: minLng,minLat,maxLng,maxLat')
    parser.add_argument('--sample', action='store_true', help='Import only a sample (1000 buildings near downtown)')
    args = parser.parse_args()

    bbox = None
    limit = args.limit

    if args.sample:
        # Sample area: Downtown Montreal
        bbox = (-73.62, 45.49, -73.54, 45.52)
        limit = limit or 5000
        print(f"Sample mode: importing up to {limit} buildings in downtown area")
    elif args.bbox:
        bbox = tuple(map(float, args.bbox.split(',')))

    print("="*60)
    print("Montreal Building Import")
    print("="*60)

    # Check if file exists
    if not GPKG_PATH.exists():
        print(f"ERROR: File not found: {GPKG_PATH}")
        sys.exit(1)

    # Connect to database
    print(f"Connecting to database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    conn = psycopg2.connect(**DB_CONFIG)

    try:
        # Create table
        create_table(conn)

        # Read data
        gdf = read_gpkg_data(GPKG_PATH, LAYER_NAME, limit=limit, bbox=bbox)

        if len(gdf) == 0:
            print("No features found!")
            return

        # Transform to WGS84
        gdf_wgs84 = transform_to_wgs84(gdf)

        # Insert into database
        insert_buildings(conn, gdf_wgs84)

        # Create combined view
        create_view_for_api(conn)

        # Print summary
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM montreal_buildings")
            count = cur.fetchone()[0]

            cur.execute("""
                SELECT ST_XMin(ST_Extent(geom)), ST_YMin(ST_Extent(geom)),
                       ST_XMax(ST_Extent(geom)), ST_YMax(ST_Extent(geom))
                FROM montreal_buildings
            """)
            extent = cur.fetchone()

        print("\n" + "="*60)
        print("IMPORT COMPLETE")
        print("="*60)
        print(f"Total buildings imported: {count}")
        print(f"Bounding box: {extent}")
        print("\nTo use in API, update BuildingRepository to query 'montreal_buildings' or 'v_all_buildings'")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
