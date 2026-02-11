package com.teksi.montrealmap.zonage.controller;

import com.teksi.montrealmap.geojson.GeoJson;
import com.teksi.montrealmap.zonage.dto.ZonageResponse;
import com.teksi.montrealmap.zonage.service.ZonageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/zonage")
public class ZonageController {

    private final ZonageService zonageService;

    @GetMapping("/at-point")
    public ZonageResponse getAtPoint(
            @RequestParam double lng,
            @RequestParam double lat
    ) {
        return zonageService.getAtPoint(lng, lat);
    }

    @GetMapping("/search/geojson")
    public GeoJson.FeatureCollection searchGeoJson(
            @RequestParam double minLng,
            @RequestParam double minLat,
            @RequestParam double maxLng,
            @RequestParam double maxLat
    ) {
        return zonageService.searchGeoJson(minLng, minLat, maxLng, maxLat);
    }

    @GetMapping("/arrondissements")
    public List<String> getArrondissements() {
        return zonageService.getArrondissements();
    }

    @GetMapping("/zone-codes")
    public List<String> getZoneCodesByArrondissement(@RequestParam String code3l) {
        return zonageService.getZoneCodesByArrondissement(code3l);
    }
}
