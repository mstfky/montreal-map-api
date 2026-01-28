@echo off
REM Montreal Map API - Database Population Script (Windows)
REM Populates the database with zoning and building data

setlocal

set CONTAINER=montreal-postgis
set DB_USER=montreal
set DB_NAME=montreal

echo === Montreal Map API - Database Population ===
echo.

REM Check if container is running
docker ps --format "{{.Names}}" | findstr /C:"%CONTAINER%" > nul
if errorlevel 1 (
    echo Error: Container '%CONTAINER%' is not running.
    echo Start it with: docker-compose up -d
    exit /b 1
)

echo [1/4] Loading raw zoning data...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/raw/raw_zonage.sql" > nul
echo       Done - 746 raw zonage records loaded

echo [2/4] Transforming zoning data...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/populate/populate_zonage.sql" > nul
echo       Done - zonage table populated

echo [3/4] Loading building data...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/populate/populate_buildings.sql" > nul
echo       Done - sample buildings loaded

echo [4/4] Loading raw zonage tab (optional)...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/raw/raw_zonage_tab.sql" 2>nul
echo       Done

echo.
echo === Verifying data ===
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -c \"SELECT 'buildings' as table_name, COUNT(*) FROM public.buildings UNION ALL SELECT 'zonage', COUNT(*) FROM public.zonage;\""

echo.
echo === Database population complete! ===

endlocal