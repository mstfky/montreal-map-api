package com.teksi.montrealmap.building.service;

import com.teksi.montrealmap.building.controller.BuildingSearchRequest;
import com.teksi.montrealmap.building.dto.BuildingDetailsResponse;
import com.teksi.montrealmap.geojson.GeoJson;

import java.util.List;

public interface BuildingService {
    BuildingDetailsResponse getBuilding(String id);
    List<BuildingDetailsResponse> search(BuildingSearchRequest req);

    GeoJson.FeatureCollection searchGeoJson(BuildingSearchRequest req);

    GeoJson.FeatureCollection searchGeoJsonFull(BuildingSearchRequest req);

    GeoJson.FeatureCollection searchGeoJsonPolygons(BuildingSearchRequest req);

}
