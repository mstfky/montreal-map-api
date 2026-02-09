package com.teksi.montrealmap.landuse.controller;

import com.teksi.montrealmap.geojson.GeoJson;
import com.teksi.montrealmap.landuse.dto.LandUseResponse;
import com.teksi.montrealmap.landuse.service.LandUseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/land-use")
public class LandUseController {

    private final LandUseService landUseService;

    @GetMapping("/at-point")
    public List<LandUseResponse> getAtPoint(
            @RequestParam double lng,
            @RequestParam double lat
    ) {
        return landUseService.getAtPoint(lng, lat);
    }

    @GetMapping("/search/geojson")
    public GeoJson.FeatureCollection searchGeoJson(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat
    ) {
        return landUseService.searchGeoJson(minLng, minLat, maxLng, maxLat);
    }
}
