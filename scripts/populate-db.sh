#!/bin/bash

# Montreal Map API - Database Population Script
# Populates the database with zoning and building data

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

echo "[1/4] Loading raw zoning data..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -f /db/raw/raw_zonage.sql" > /dev/null
echo "      Done - 746 raw zonage records loaded"

echo "[2/4] Transforming zoning data..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -f /db/populate/populate_zonage.sql" > /dev/null
echo "      Done - zonage table populated"

echo "[3/4] Loading building data..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -f /db/populate/populate_buildings.sql" > /dev/null
echo "      Done - sample buildings loaded"

echo "[4/4] Loading raw zonage tab (optional)..."
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -f /db/raw/raw_zonage_tab.sql" 2>/dev/null || true
echo "      Done"

echo ""
echo "=== Verifying data ==="
docker exec "$CONTAINER" sh -c "psql -U $DB_USER -d $DB_NAME -c \"SELECT 'buildings' as table_name, COUNT(*) FROM public.buildings UNION ALL SELECT 'zonage', COUNT(*) FROM public.zonage;\""

echo ""
echo "=== Database population complete! ==="