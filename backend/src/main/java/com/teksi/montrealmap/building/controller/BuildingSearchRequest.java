package com.teksi.montrealmap.building.controller;

public record BuildingSearchRequest(double minLng,
                                    double minLat,
                                    double maxLng,
                                    double maxLat,
                                    String neighborhood,
                                    String buildingType,
                                    Integer minYearBuilt,
                                    Integer maxYearBuilt,
                                    Integer minFloors,
                                    Integer maxFloors,
                                    String borough) {}
