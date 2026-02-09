package com.teksi.montrealmap.zonage.service;

import com.teksi.montrealmap.geojson.GeoJson;
import com.teksi.montrealmap.zonage.dto.ZonageResponse;

import java.util.List;

public interface ZonageService {
    ZonageResponse getAtPoint(double lng, double lat);
    GeoJson.FeatureCollection searchGeoJson(double minLng, double minLat, double maxLng, double maxLat);
    List<String> getArrondissements();
}
