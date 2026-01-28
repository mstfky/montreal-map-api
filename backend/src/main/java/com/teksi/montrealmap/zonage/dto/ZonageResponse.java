package com.teksi.montrealmap.zonage.dto;

import java.math.BigDecimal;

public record ZonageResponse(
        Long id,
        String zoneCode,
        String arrondissement,
        String district,
        String secteur,
        String classe1,
        String classe2,
        String classe3,
        String classe4,
        String classe5,
        String classe6,
        BigDecimal etageMin,
        BigDecimal etageMax,
        BigDecimal densiteMin,
        BigDecimal densiteMax,
        BigDecimal tauxMin,
        BigDecimal tauxMax,
        String note,
        String info
) {}

