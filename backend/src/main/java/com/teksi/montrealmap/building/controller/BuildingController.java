package com.teksi.montrealmap.building.controller;

import com.teksi.montrealmap.building.dto.BuildingDetailsResponse;
import com.teksi.montrealmap.building.service.BuildingService;
import com.teksi.montrealmap.geojson.GeoJson;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping("/{id}")
    public BuildingDetailsResponse getById(@PathVariable String id) {
        return buildingService.getBuilding(id);
    }

    @GetMapping("/search")
    public List<BuildingDetailsResponse> search(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat,
            @RequestParam(required = false) String neighborhood,
            @RequestParam(required = false) String buildingType,
            @RequestParam(required = false) Integer minYearBuilt,
            @RequestParam(required = false) Integer maxYearBuilt,
            @RequestParam(required = false) Integer minFloors,
            @RequestParam(required = false) Integer maxFloors
    ) {
        return buildingService.search(new BuildingSearchRequest(
                minLng, minLat, maxLng, maxLat,
                neighborhood, buildingType,
                minYearBuilt, maxYearBuilt,
                minFloors, maxFloors
        ));
    }

    @GetMapping("/search/geojson")
    public GeoJson.FeatureCollection searchGeoJson(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat,
            @RequestParam(required = false) String neighborhood,
            @RequestParam(required = false) String buildingType,
            @RequestParam(required = false) Integer minYearBuilt,
            @RequestParam(required = false) Integer maxYearBuilt,
            @RequestParam(required = false) Integer minFloors,
            @RequestParam(required = false) Integer maxFloors
    ) {
        return buildingService.searchGeoJson(new BuildingSearchRequest(
                minLng, minLat, maxLng, maxLat,
                neighborhood, buildingType,
                minYearBuilt, maxYearBuilt,
                minFloors, maxFloors
        ));
    }

    @GetMapping("/search/geojson/full")
    public GeoJson.FeatureCollection geoJsonSearchFull(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat,
            @RequestParam(required = false) String neighborhood,
            @RequestParam(required = false) String buildingType,
            @RequestParam(required = false) Integer minYearBuilt,
            @RequestParam(required = false) Integer maxYearBuilt,
            @RequestParam(required = false) Integer minFloors,
            @RequestParam(required = false) Integer maxFloors
    ) {
        return buildingService.searchGeoJsonFull(new BuildingSearchRequest(
                minLng, minLat, maxLng, maxLat,
                neighborhood, buildingType,
                minYearBuilt, maxYearBuilt,
                minFloors, maxFloors
        ));
    }

    @GetMapping("/search/geojsonsearch-polygons")
    public GeoJson.FeatureCollection searchPolygons(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat,
            @RequestParam(required = false) String neighborhood,
            @RequestParam(required = false) String buildingType,
            @RequestParam(required = false) Integer minYearBuilt,
            @RequestParam(required = false) Integer maxYearBuilt,
            @RequestParam(required = false) Integer minFloors,
            @RequestParam(required = false) Integer maxFloors
    ) {
        return buildingService.searchGeoJsonPolygons(new BuildingSearchRequest(
                minLng, minLat, maxLng, maxLat,
                neighborhood, buildingType,
                minYearBuilt, maxYearBuilt,
                minFloors, maxFloors
        ));
    }

}
