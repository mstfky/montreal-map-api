package com.teksi.montrealmap.landuse.dto;

import java.math.BigDecimal;

public record LandUseResponse(
        Integer id,
        String affectation,
        String affectationEn,
        BigDecimal areaSqm
) {}
