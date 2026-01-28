package com.teksi.montrealmap.building.dto;

public record BuildingDetailsResponse(
        String id,
        String address,
        String neighborhood,
        Integer yearBuilt,
        Integer floors,
        String buildingType,
        Double longitude,
        Double latitude
) {
}

