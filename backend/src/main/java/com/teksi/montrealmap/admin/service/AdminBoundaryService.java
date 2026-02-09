package com.teksi.montrealmap.admin.service;

import com.teksi.montrealmap.geojson.GeoJson;

public interface AdminBoundaryService {
    GeoJson.FeatureCollection searchGeoJson(double minLng, double minLat, double maxLng, double maxLat);
    GeoJson.FeatureCollection getAllGeoJson();
}
