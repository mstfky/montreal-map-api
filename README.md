# Montreal Map API

Full-stack geospatial web application for visualizing and searching Montreal buildings and zoning information on an interactive map.

## Features

- Interactive map visualization of Montreal buildings
- Search and filter buildings by neighborhood, type, year built, and floors
- Zoning data lookup and display
- GeoJSON API endpoints for map integration
- Spatial search within bounding box

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS 4, MapLibre GL |
| **Backend** | Spring Boot 4.0.1, Java 17, Spring Data JPA, Hibernate Spatial |
| **Database** | PostgreSQL 16, PostGIS 3.4 |
| **DevOps** | Docker Compose |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Java 17+ (for backend development)

### Run with Docker

```bash
# Start all services (PostgreSQL, API, Frontend)
docker-compose up -d

# Populate database with sample data
docker exec montreal-postgis sh -c "psql -U montreal -d montreal -f /db/raw/raw_zonage.sql"
docker exec montreal-postgis sh -c "psql -U montreal -d montreal -f /db/populate/populate_zonage.sql"
docker exec montreal-postgis sh -c "psql -U montreal -d montreal -f /db/populate/populate_buildings.sql"
```

### Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8081 |
| PostgreSQL | localhost:5433 |

## Project Structure

```
montreal-map-api/
├── backend/                    # Spring Boot API
│   ├── src/main/java/
│   │   └── com/teksi/montrealmap/
│   │       ├── building/       # Building domain
│   │       ├── zonage/         # Zoning domain
│   │       ├── geojson/        # GeoJSON utilities
│   │       ├── health/         # Health endpoints
│   │       └── config/         # CORS config
│   ├── db/                     # SQL population scripts
│   └── Dockerfile
├── frontend/                   # Next.js application
│   └── src/
│       ├── app/                # Pages
│       ├── components/         # React components
│       └── lib/                # API client
└── docker-compose.yml
```

## API Endpoints

### Buildings

| Endpoint | Description |
|----------|-------------|
| `GET /api/buildings/{id}` | Get building by ID |
| `GET /api/buildings/search` | Search buildings with filters |
| `GET /api/buildings/search/geojson` | Search as GeoJSON points |
| `GET /api/buildings/search/geojsonsearch-polygons` | Search as GeoJSON polygons |

**Query Parameters:** `minLng`, `minLat`, `maxLng`, `maxLat` (required), `neighborhood`, `buildingType`, `minYearBuilt`, `maxYearBuilt`, `minFloors`, `maxFloors` (optional)

### Zoning

| Endpoint | Description |
|----------|-------------|
| `GET /api/zonage/at-point?lng=&lat=` | Get zoning at coordinates |
| `GET /api/zonage/search/geojson` | Search zones as GeoJSON |

### Health

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /health/db` | Database connectivity check |

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run lint         # Run ESLint
```

### Backend

```bash
cd backend
./mvnw spring-boot:run              # Run locally
./mvnw clean package                # Build JAR
./mvnw test                         # Run tests
```

## Database

- **PostgreSQL 16** with **PostGIS 3.4** extension
- Flyway manages schema migrations
- SRID 4326 (WGS84) coordinate system

### Tables

- `buildings` - Building data with geometry (Point/Polygon)
- `zonage` - Zoning polygons with regulations
- `raw.raw_zonage` - Raw zoning import data

## License

MIT
