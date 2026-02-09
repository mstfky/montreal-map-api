package com.teksi.montrealmap.landuse.service;

import com.teksi.montrealmap.geojson.GeoJson;
import com.teksi.montrealmap.landuse.dto.LandUseResponse;

import java.util.List;

public interface LandUseService {
    List<LandUseResponse> getAtPoint(double lng, double lat);
    GeoJson.FeatureCollection searchGeoJson(double minLng, double minLat, double maxLng, double maxLat);
}
