package com.teksi.montrealmap.zonage.controller;

import com.teksi.montrealmap.zonage.dto.ZonageTabCodeResponse;
import com.teksi.montrealmap.zonage.service.ZonageTabService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/zonage-tab")
public class ZonageTabController {

    private final ZonageTabService zonageTabService;

    @GetMapping("/at-point")
    public ResponseEntity<ZonageTabCodeResponse> atPoint(
            @RequestParam double lng,
            @RequestParam double lat
    ) {
        return zonageTabService.getZoneCodeAtPoint(lng, lat)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

