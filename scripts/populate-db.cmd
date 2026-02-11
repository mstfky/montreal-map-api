@echo off
REM Montreal Map API - Database Population Script (Windows)
REM Populates the database with zoning data and verifies all tables.
REM
REM For large datasets (property_assessment, montreal_buildings, land_use,
REM admin_boundaries), use the Python import scripts directly:
REM   python scripts\import_property_assessment.py
REM   python scripts\import_montreal_buildings.py
REM   python scripts\import_land_use.py
REM   python scripts\import_admin_boundaries.py

setlocal EnableDelayedExpansion

set CONTAINER=montreal-postgis
set DB_USER=montreal
set DB_NAME=montreal

echo.
echo === Montreal Map API - Database Population ===
echo.

REM Check if container is running
docker ps --format "{{.Names}}" | findstr /C:"%CONTAINER%" > nul
if errorlevel 1 (
    echo Error: Container '%CONTAINER%' is not running.
    echo Start it with: docker-compose up -d
    exit /b 1
)

echo [1/2] Loading zonage data (Rosemont arrondissement)...
echo       Loading raw zoning geometries...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/raw/raw_zonage.sql" > nul 2>&1
if errorlevel 1 (
    echo       WARNING: Failed to load raw_zonage.sql
) else (
    echo       Done - raw zonage loaded
)

echo       Transforming into public.zonage...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/populate/populate_zonage.sql" > nul 2>&1
if errorlevel 1 (
    echo       WARNING: Failed to run populate_zonage.sql
) else (
    echo       Done - zonage table populated
)

echo       Loading raw zonage tab (lot boundaries)...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/raw/raw_zonage_tab.sql" > nul 2>&1
if errorlevel 1 (
    echo       WARNING: Failed to load raw_zonage_tab.sql (optional)
) else (
    echo       Done - raw_zonage_tab loaded
)
echo.

echo [2/2] Verifying data...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -c \"SELECT 'property_assessment' as table_name, COUNT(*) FROM property_assessment UNION ALL SELECT 'montreal_buildings', COUNT(*) FROM montreal_buildings UNION ALL SELECT 'land_use', COUNT(*) FROM land_use UNION ALL SELECT 'admin_boundaries', COUNT(*) FROM admin_boundaries UNION ALL SELECT 'zonage', COUNT(*) FROM zonage;\""
echo.

echo === Population complete! ===
echo.
echo NOTE: This script only loads zonage data.
echo For other datasets, run the Python import scripts:
echo   python scripts\import_property_assessment.py
echo   python scripts\import_montreal_buildings.py
echo   python scripts\import_land_use.py
echo   python scripts\import_admin_boundaries.py

endlocal
