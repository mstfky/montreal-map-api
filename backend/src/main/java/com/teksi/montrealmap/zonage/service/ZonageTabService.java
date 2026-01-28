package com.teksi.montrealmap.zonage.service;

import com.teksi.montrealmap.zonage.dto.ZonageTabCodeResponse;

import java.util.Optional;

public interface ZonageTabService {
    Optional<ZonageTabCodeResponse> getZoneCodeAtPoint(double lng, double lat);
}
