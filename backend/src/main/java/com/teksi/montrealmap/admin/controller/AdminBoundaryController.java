package com.teksi.montrealmap.admin.controller;

import com.teksi.montrealmap.admin.service.AdminBoundaryService;
import com.teksi.montrealmap.geojson.GeoJson;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin-boundaries")
public class AdminBoundaryController {

    private final AdminBoundaryService adminBoundaryService;

    @GetMapping("/search/geojson")
    public GeoJson.FeatureCollection searchGeoJson(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat
    ) {
        return adminBoundaryService.searchGeoJson(minLng, minLat, maxLng, maxLat);
    }

    @GetMapping("/all/geojson")
    public GeoJson.FeatureCollection getAllGeoJson() {
        return adminBoundaryService.getAllGeoJson();
    }
}
