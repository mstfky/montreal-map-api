#!/bin/bash

# Montreal Map API - Database Population Script
# Populates the database with zoning data and verifies all tables.
#
# For large datasets (property_assessment, montreal_buildings, land_use,
# admin_boundaries), use the Python import scripts directly:
#   python scripts/import_property_assessment.py
#   python scripts/import_montreal_buildings.py
#   python scripts/import_land_use.py
#   python scripts/import_admin_boundaries.py

set -e

CONTAINER="montreal-postgis"
DB_USER="montreal"
DB_NAME="montreal"

echo "=== Montreal Map API - Database Population ==="
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "Error: Container '${CONTAINER}' is not running."
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo "[1/2] Loading zonage data (Rosemont arrondissement)..."
echo "      Loading raw zoning geometries..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -f /db/raw/raw_zonage.sql" > /dev/null
echo "      Done - raw zonage loaded"

echo "      Transforming into public.zonage..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -f /db/populate/populate_zonage.sql" > /dev/null
echo "      Done - zonage table populated"

echo "      Loading raw zonage tab (lot boundaries)..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -f /db/raw/raw_zonage_tab.sql" 2>/dev/null || true
echo "      Done - raw_zonage_tab loaded"

echo ""
echo "[2/2] Verifying data..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -c \"SELECT 'property_assessment' as table_name, COUNT(*) FROM property_assessment UNION ALL SELECT 'montreal_buildings', COUNT(*) FROM montreal_buildings UNION ALL SELECT 'land_use', COUNT(*) FROM land_use UNION ALL SELECT 'admin_boundaries', COUNT(*) FROM admin_boundaries UNION ALL SELECT 'zonage', COUNT(*) FROM zonage;\""

echo ""
echo "=== Population complete! ==="
echo ""
echo "NOTE: This script only loads zonage data."
echo "For other datasets, run the Python import scripts:"
echo "  python scripts/import_property_assessment.py"
echo "  python scripts/import_montreal_buildings.py"
echo "  python scripts/import_land_use.py"
echo "  python scripts/import_admin_boundaries.py"
