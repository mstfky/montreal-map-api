@echo off
REM Montreal Map API - Full Application Startup Script
REM Starts all services and populates database if empty

setlocal EnableDelayedExpansion

set CONTAINER=montreal-postgis
set DB_USER=montreal
set DB_NAME=montreal
set SCRIPTS_DIR=%~dp0

echo.
echo ========================================
echo   Montreal Map API - Starting App
echo ========================================
echo.

REM Step 1: Stop any existing containers for a fresh start
echo [1/7] Stopping any existing containers...
docker-compose down > nul 2>&1
echo       Done - Cleaned up existing containers
echo.

REM Step 2: Start Docker containers
echo [2/7] Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo Error: Failed to start Docker containers.
    exit /b 1
)
echo       Done - Docker containers started
echo.

REM Step 3: Wait for PostGIS to be healthy
echo [3/7] Waiting for database to be ready...
:wait_loop
docker exec %CONTAINER% pg_isready -U %DB_USER% -d %DB_NAME% > nul 2>&1
if errorlevel 1 (
    echo       Waiting...
    timeout /t 2 /nobreak > nul
    goto wait_loop
)
echo       Done - Database is ready
echo.

REM Step 4: Check database status
echo [4/7] Checking database status...

REM Check property_assessment table
for /f %%i in ('docker exec %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'property_assessment';" 2^>nul') do set TABLE_EXISTS=%%i
if "%TABLE_EXISTS%"=="0" (
    set NEED_PROPERTY_IMPORT=1
    echo       property_assessment table does not exist
) else (
    for /f %%i in ('docker exec %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM property_assessment;" 2^>nul') do set PROP_COUNT=%%i
    if "!PROP_COUNT!"=="0" (
        set NEED_PROPERTY_IMPORT=1
        echo       property_assessment table is empty
    ) else (
        set NEED_PROPERTY_IMPORT=0
        echo       property_assessment has !PROP_COUNT! records
    )
)

REM Check land_use table
for /f %%i in ('docker exec %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'land_use';" 2^>nul') do set LANDUSE_EXISTS=%%i
if "%LANDUSE_EXISTS%"=="0" (
    set NEED_LANDUSE_IMPORT=1
    echo       land_use table does not exist
) else (
    for /f %%i in ('docker exec %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM land_use;" 2^>nul') do set LANDUSE_COUNT=%%i
    if "!LANDUSE_COUNT!"=="0" (
        set NEED_LANDUSE_IMPORT=1
        echo       land_use table is empty
    ) else (
        set NEED_LANDUSE_IMPORT=0
        echo       land_use has !LANDUSE_COUNT! records
    )
)

REM Check zonage table (optional - only covers Rosemont arrondissement)
for /f %%i in ('docker exec %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'zonage';" 2^>nul') do set ZONAGE_EXISTS=%%i
if "%ZONAGE_EXISTS%"=="0" (
    set NEED_ZONAGE_IMPORT=1
    echo       zonage table does not exist
) else (
    for /f %%i in ('docker exec %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM zonage;" 2^>nul') do set ZONE_COUNT=%%i
    if "!ZONE_COUNT!"=="0" (
        set NEED_ZONAGE_IMPORT=1
        echo       zonage table is empty
    ) else (
        set NEED_ZONAGE_IMPORT=0
        echo       zonage has !ZONE_COUNT! records (Rosemont only)
    )
)
echo.

REM Step 5: Import data if needed
echo [5/7] Importing data (if needed)...

REM Import property assessment (primary building data)
if "%NEED_PROPERTY_IMPORT%"=="1" (
    echo       Importing property assessment data (this may take several minutes)...

    python --version > nul 2>&1
    if errorlevel 1 (
        echo       WARNING: Python not found. Skipping property assessment import.
        echo       Run manually: python scripts\import_property_assessment.py
    ) else (
        if exist "C:\Users\camus\Downloads\montreal_property_assessment\uniteevaluationfonciere.shp" (
            python "%SCRIPTS_DIR%import_property_assessment.py"
            if errorlevel 1 (
                echo       WARNING: Property assessment import failed.
            ) else (
                echo       Done - property assessment data imported
            )
        ) else (
            echo       WARNING: Property assessment shapefile not found.
            echo       Download from: https://donnees.montreal.ca/dataset/unites-evaluation-fonciere
            echo       Extract to: C:\Users\camus\Downloads\montreal_property_assessment\
        )
    )
) else (
    echo       Skipping property assessment import (already has data)
)

REM Import land use (city-wide zoning)
if "%NEED_LANDUSE_IMPORT%"=="1" (
    echo       Importing land use data (city-wide zones)...

    python --version > nul 2>&1
    if errorlevel 1 (
        echo       WARNING: Python not found. Skipping land use import.
        echo       Run manually: python scripts\import_land_use.py
    ) else (
        if exist "C:\Users\camus\Downloads\montreal_zonage\graffectations.json" (
            python "%SCRIPTS_DIR%import_land_use.py"
            if errorlevel 1 (
                echo       WARNING: Land use import failed.
            ) else (
                echo       Done - land use data imported
            )
        ) else (
            echo       WARNING: Land use GeoJSON not found.
            echo       Download from: https://donnees.montreal.ca/dataset/schema-affectation-densite
            echo       Save as: C:\Users\camus\Downloads\montreal_zonage\graffectations.json
        )
    )
) else (
    echo       Skipping land use import (already has data)
)

REM Import detailed zonage (optional - Rosemont only, has detailed zone codes)
if "%NEED_ZONAGE_IMPORT%"=="1" (
    echo       Loading detailed zonage data (Rosemont arrondissement only)...
    docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/raw/raw_zonage.sql" > nul 2>&1
    docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -f /db/populate/populate_zonage.sql" > nul 2>&1
    echo       Done - zonage data loaded (note: only covers Rosemont)
) else (
    echo       Skipping zonage import (already has data)
)
echo.

REM Step 6: Verify data
echo [6/7] Verifying data...
docker exec %CONTAINER% sh -c "psql -U %DB_USER% -d %DB_NAME% -c \"SELECT 'property_assessment' as table_name, COUNT(*) FROM property_assessment UNION ALL SELECT 'land_use', COUNT(*) FROM land_use UNION ALL SELECT 'zonage', COUNT(*) FROM zonage;\""
echo.

REM Step 7: Start frontend
echo [7/7] Starting frontend...
cd /d "%SCRIPTS_DIR%..\frontend"

REM Kill any existing Next.js process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a > nul 2>&1
)

REM Start frontend in a new window
start "Montreal Map Frontend" cmd /c "npm run dev"

echo       Done - Frontend starting...
echo.

REM Wait a moment for frontend to initialize
timeout /t 3 /nobreak > nul

echo ========================================
echo   Application Started Successfully!
echo ========================================
echo.
echo   Frontend:  http://localhost:3000
echo   API:       http://localhost:8081
echo   Database:  localhost:5433
echo.
echo   Data Sources:
echo   - property_assessment: Building details (address, floors, year, type)
echo   - land_use: City-wide zones (Residential, Industrial, etc.)
echo   - zonage: Detailed zone codes (Rosemont only - H.2-4, C.2B, etc.)
echo.
echo   Data persists in Docker volumes.
echo   Data is only imported when tables are empty.
echo.
echo   Press Ctrl+C in the frontend window to stop it.
echo   Run 'docker-compose down' to stop backend services.
echo   Run 'docker-compose down -v' to stop AND delete all data.
echo ========================================

endlocal
