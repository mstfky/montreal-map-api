package com.teksi.montrealmap.building.service;

import com.teksi.montrealmap.building.controller.BuildingSearchRequest;
import com.teksi.montrealmap.building.dto.BuildingDetailsResponse;
import com.teksi.montrealmap.building.entity.Building;
import com.teksi.montrealmap.building.entity.MontrealBuilding;
import com.teksi.montrealmap.building.entity.PropertyAssessment;
import com.teksi.montrealmap.building.repository.BuildingRepository;
import com.teksi.montrealmap.building.repository.MontrealBuildingRepository;
import com.teksi.montrealmap.building.repository.PropertyAssessmentRepository;
import com.teksi.montrealmap.geojson.GeoJson;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BuildingServiceImpl implements BuildingService {

    private final BuildingRepository buildingRepository;
    private final MontrealBuildingRepository montrealBuildingRepository;
    private final PropertyAssessmentRepository propertyAssessmentRepository;

    @Override
    public BuildingDetailsResponse getBuilding(String id) {
        Building building = buildingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Building not found"));
        return new BuildingDetailsResponse(
                building.getId(),
                building.getAddress(),
                building.getNeighborhood(),
                building.getYearBuilt(),
                building.getFloors(),
                building.getBuildingType(),
                building.getGeom() != null ? building.getGeom().getCoordinate().getX() : null,
                building.getGeom() != null ? building.getGeom().getCoordinate().getY() : null
        );
    }

    @Override
    public List<BuildingDetailsResponse> search(BuildingSearchRequest req) {
        List<Building> buildings = buildingRepository.searchInBbox(
                req.minLng(), req.minLat(), req.maxLng(), req.maxLat(),
                req.neighborhood(),
                req.buildingType(),
                req.minYearBuilt(), req.maxYearBuilt(),
                req.minFloors(), req.maxFloors()
        );

        return buildings.stream().map(this::toDetails).toList();
    }

    @Override
    public GeoJson.FeatureCollection searchGeoJson(BuildingSearchRequest req) {

        List<GeoJson.Feature> features = fetchBuildings(req).stream()
                .map(this::toDetails)
                .map(this::toGeoFeature)
                .flatMap(Optional::stream)
                .toList();

        return GeoJson.FeatureCollection.of(features);
    }

    private List<Building> fetchBuildings(BuildingSearchRequest req) {
        return buildingRepository.searchInBbox(
                req.minLng(), req.minLat(), req.maxLng(), req.maxLat(),
                req.neighborhood(),
                req.buildingType(),
                req.minYearBuilt(), req.maxYearBuilt(),
                req.minFloors(), req.maxFloors()
        );
    }

    private BuildingDetailsResponse toDetails(Building building) {
        Double longitude = null;
        Double latitude = null;

        if (building.getGeom() != null) {
            Coordinate c = building.getGeom().getCoordinate();
            if (c != null) {
                longitude = c.getX();
                latitude = c.getY();
            }
        }

        return new BuildingDetailsResponse(
                building.getId(),
                building.getAddress(),
                building.getNeighborhood(),
                building.getYearBuilt(),
                building.getFloors(),
                building.getBuildingType(),
                longitude,
                latitude
        );
    }

    private Optional<GeoJson.Feature> toGeoFeature(BuildingDetailsResponse b) {
        if (b.longitude() == null || b.latitude() == null) return Optional.empty();

        GeoJson.Geometry geom = GeoJson.Geometry.point(b.longitude(), b.latitude());

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("address", b.address());
        props.put("neighborhood", b.neighborhood());
        props.put("yearBuilt", b.yearBuilt());
        props.put("floors", b.floors());
        props.put("buildingType", b.buildingType());

        return Optional.of(GeoJson.Feature.of(b.id(), geom, props));
    }


    @Override
    public GeoJson.FeatureCollection searchGeoJsonFull(BuildingSearchRequest req) {
        List<GeoJson.Feature> features = fetchBuildings(req).stream()
                .map(this::toGeoFeatureFull)
                .flatMap(java.util.Optional::stream)
                .toList();

        return GeoJson.FeatureCollection.of(features);
    }

    @Override
    public GeoJson.FeatureCollection searchGeoJsonPolygons(BuildingSearchRequest req) {
        String borough = req.borough();
        boolean hasBorough = borough != null && !borough.isBlank();

        List<PropertyAssessment> properties = hasBorough
                ? propertyAssessmentRepository.searchInBboxByBorough(
                        req.minLng(), req.minLat(), req.maxLng(), req.maxLat(),
                        borough)
                : propertyAssessmentRepository.searchInBbox(
                        req.minLng(), req.minLat(), req.maxLng(), req.maxLat(),
                        req.minYearBuilt(), req.maxYearBuilt(),
                        req.minFloors(), req.maxFloors());

        // Convert to GeoJSON features
        List<GeoJson.Feature> features = properties.stream()
                .map(this::toGeoFeatureFromProperty)
                .toList();

        return GeoJson.FeatureCollection.of(features);
    }

    private GeoJson.Feature toGeoFeatureFromProperty(PropertyAssessment p) {
        GeoJson.Geometry geometry = toGeoJsonGeometry(p.getGeom());

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("address", p.getFullAddress());
        props.put("neighborhood", p.getBorough());
        props.put("matricule", p.getMatricule());
        props.put("yearBuilt", p.getYearBuilt());
        props.put("floors", p.getFloors());
        props.put("buildingType", p.getUsageLabel());
        props.put("numUnits", p.getNumUnits());
        props.put("category", p.getCategory());
        props.put("landArea", p.getLandArea());
        props.put("buildingArea", p.getBuildingArea());
        props.put("source", "Montreal Property Assessment");

        return GeoJson.Feature.of("prop-" + p.getId(), geometry, props);
    }

    private GeoJson.Feature toGeoFeatureFromMontrealBuilding(MontrealBuilding b) {
        GeoJson.Geometry geometry = toGeoJsonGeometry(b.getGeom());

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("address", null);
        props.put("neighborhood", null);
        props.put("yearBuilt", null);
        props.put("floors", null);
        props.put("buildingType", "Montreal Building");
        props.put("superficie", b.getSuperficie());
        props.put("source", "Montreal Open Data");
        props.put("updateDate", b.getUpdateDate());

        return GeoJson.Feature.of("mtl-" + b.getId(), geometry, props);
    }

    private java.util.Optional<GeoJson.Feature> toGeoFeatureFull(Building b) {
        if (b.getGeom() == null) return java.util.Optional.empty();

        GeoJson.Geometry geometry = toGeoJsonGeometry(b.getGeom());
        if (geometry == null) return java.util.Optional.empty();

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("address", b.getAddress());
        props.put("neighborhood", b.getNeighborhood());
        props.put("yearBuilt", b.getYearBuilt());
        props.put("floors", b.getFloors());
        props.put("buildingType", b.getBuildingType());

        return java.util.Optional.of(GeoJson.Feature.of(b.getId(), geometry, props));
    }

    // kept for compatibility, but now delegates to the correct converter
    private GeoJson.Geometry toGeoGeometry(org.locationtech.jts.geom.Geometry g) {
        return toGeoJsonGeometry(g);
    }

    private GeoJson.Geometry polygonFromJts(org.locationtech.jts.geom.Polygon poly) {
        org.locationtech.jts.geom.Coordinate[] coords = poly.getExteriorRing().getCoordinates();
        if (coords == null || coords.length < 4) return null;

        java.util.List<java.util.List<Double>> ring = new java.util.ArrayList<>();
        for (org.locationtech.jts.geom.Coordinate c : coords) {
            ring.add(java.util.List.of(c.getX(), c.getY()));
        }
        if (!ring.get(0).equals(ring.get(ring.size() - 1))) {
            ring.add(ring.get(0));
        }

        return GeoJson.Geometry.polygonFromOuterRing(ring);
    }

    private GeoJson.Feature toGeoFeatureFromGeom(Building b) {
        GeoJson.Geometry geometry = toGeoJsonGeometry(b.getGeom());

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("address", b.getAddress());
        props.put("neighborhood", b.getNeighborhood());
        props.put("yearBuilt", b.getYearBuilt());
        props.put("floors", b.getFloors());
        props.put("buildingType", b.getBuildingType());

        return GeoJson.Feature.of(b.getId(), geometry, props);
    }

    private GeoJson.Geometry toGeoJsonGeometry(org.locationtech.jts.geom.Geometry g) {
        if (g == null) return null;

        String t = g.getGeometryType();

        if ("Point".equalsIgnoreCase(t)) {
            var c = g.getCoordinate();
            return GeoJson.Geometry.point(c.getX(), c.getY());
        }

        if ("Polygon".equalsIgnoreCase(t)) {
            return GeoJson.Geometry.polygon(jtsPolygonToCoords((org.locationtech.jts.geom.Polygon) g));
        }

        if ("MultiPolygon".equalsIgnoreCase(t)) {
            return GeoJson.Geometry.multiPolygon(jtsMultiPolygonToCoords((org.locationtech.jts.geom.MultiPolygon) g));
        }

        throw new IllegalArgumentException("Unsupported geometry type: " + t);
    }

    private List<List<List<Double>>> jtsPolygonToCoords(org.locationtech.jts.geom.Polygon p) {
        List<List<List<Double>>> rings = new java.util.ArrayList<>();
        rings.add(linearRingToCoords((org.locationtech.jts.geom.LineString) p.getExteriorRing()));
        for (int i = 0; i < p.getNumInteriorRing(); i++) {
            rings.add(linearRingToCoords((org.locationtech.jts.geom.LineString) p.getInteriorRingN(i)));
        }
        return rings;
    }

    private List<List<List<List<Double>>>> jtsMultiPolygonToCoords(org.locationtech.jts.geom.MultiPolygon mp) {
        List<List<List<List<Double>>>> polys = new java.util.ArrayList<>();
        for (int i = 0; i < mp.getNumGeometries(); i++) {
            polys.add(jtsPolygonToCoords((org.locationtech.jts.geom.Polygon) mp.getGeometryN(i)));
        }
        return polys;
    }

    private List<List<Double>> linearRingToCoords(org.locationtech.jts.geom.LineString ring) {
        var cs = ring.getCoordinates();
        List<List<Double>> out = new java.util.ArrayList<>(cs.length);
        for (var c : cs) {
            out.add(List.of(c.getX(), c.getY()));
        }
        return out;
    }

}
