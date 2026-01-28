# Montreal Map API - Backend Help

## Overview

Spring Boot REST API for Montreal buildings and zoning geospatial data. Provides GeoJSON endpoints for map visualization.

## Quick Start

### With Docker (Recommended)
```bash
# From project root
docker-compose up -d
```
API available at: `http://localhost:8081`

### Local Development
```bash
cd backend
./mvnw spring-boot:run
```
Requires PostgreSQL with PostGIS running on port 5432.

## API Endpoints

### Health
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/db` | GET | Database connectivity check |

### Buildings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/buildings/{id}` | GET | Get building by ID |
| `/api/buildings/search` | GET | Search buildings (JSON) |
| `/api/buildings/search/geojson` | GET | Search as GeoJSON points |
| `/api/buildings/search/geojsonsearch-polygons` | GET | Search as GeoJSON polygons |

**Query Parameters:**
- `minLng`, `minLat`, `maxLng`, `maxLat` (required) - Bounding box
- `neighborhood` (optional) - Filter by neighborhood
- `buildingType` (optional) - Filter by type
- `minYearBuilt`, `maxYearBuilt` (optional) - Year range
- `minFloors`, `maxFloors` (optional) - Floor range

### Zonage (Zoning)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zonage/at-point` | GET | Get zoning at coordinates |
| `/api/zonage/search/geojson` | GET | Search zones as GeoJSON |

**Query Parameters:**
- For `/at-point`: `lng`, `lat` (required)
- For `/search/geojson`: `minLng`, `minLat`, `maxLng`, `maxLat` (required)

## Example Requests

```bash
# Health check
curl http://localhost:8081/health

# Get buildings in area
curl "http://localhost:8081/api/buildings/search/geojsonsearch-polygons?minLng=-73.7&minLat=45.4&maxLng=-73.5&maxLat=45.6"

# Get zones in area
curl "http://localhost:8081/api/zonage/search/geojson?minLng=-73.7&minLat=45.4&maxLng=-73.5&maxLat=45.6"

# Get zoning at point
curl "http://localhost:8081/api/zonage/at-point?lng=-73.5673&lat=45.5017"
```

## Build Commands

```bash
./mvnw clean package              # Build JAR
./mvnw -DskipTests clean package  # Build without tests
./mvnw test                       # Run tests
```

## Configuration

Configuration file: `src/main/resources/application.yaml`

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | 8080 | Server port |
| `spring.datasource.url` | `jdbc:postgresql://postgis:5432/montreal` | Database URL |
| `spring.jpa.hibernate.ddl-auto` | validate | Schema validation mode |

## Database

- **PostgreSQL 16** with **PostGIS 3.4** extension
- Flyway manages migrations (`src/main/resources/db/migration/`)
- SRID 4326 (WGS84) for all geometries

## Project Structure

```
src/main/java/com/teksi/montrealmap/
├── building/          # Building domain
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   └── dto/
├── zonage/            # Zoning domain
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   └── dto/
├── geojson/           # GeoJSON utilities
├── health/            # Health endpoints
└── config/            # CORS configuration
```

## Technologies

- Spring Boot 4.0.1
- Java 17
- Spring Data JPA
- Hibernate Spatial
- Flyway
- Lombok
- PostgreSQL + PostGIS