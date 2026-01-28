package com.teksi.montrealmap.building.repository;

import com.teksi.montrealmap.building.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface BuildingRepository extends JpaRepository<Building, String> {
    @Query("""
            select b
            from Building b
            where b.geom is not null
              and function('ST_Within', b.geom,
                  function('ST_MakeEnvelope', :minLng, :minLat, :maxLng, :maxLat, 4326)
              ) = true
              and (:neighborhood is null or b.neighborhood = :neighborhood)
              and (:buildingType is null or b.buildingType = :buildingType)
              and (:minYearBuilt is null or b.yearBuilt >= :minYearBuilt)
              and (:maxYearBuilt is null or b.yearBuilt <= :maxYearBuilt)
              and (:minFloors is null or b.floors >= :minFloors)
              and (:maxFloors is null or b.floors <= :maxFloors)
            """)
    List<Building> searchInBbox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat,
            @Param("neighborhood") String neighborhood,
            @Param("buildingType") String buildingType,
            @Param("minYearBuilt") Integer minYearBuilt,
            @Param("maxYearBuilt") Integer maxYearBuilt,
            @Param("minFloors") Integer minFloors,
            @Param("maxFloors") Integer maxFloors
    );

    @Query("""
            select b
            from Building b
            where b.geom is not null
              and function('ST_Within', b.geom,
                  function('ST_MakeEnvelope', :minLng, :minLat, :maxLng, :maxLat, 4326)
              ) = true
              and function('ST_GeometryType', b.geom) in ('ST_Polygon', 'ST_MultiPolygon')
              and (:neighborhood is null or b.neighborhood = :neighborhood)
              and (:buildingType is null or b.buildingType = :buildingType)
              and (:minYearBuilt is null or b.yearBuilt >= :minYearBuilt)
              and (:maxYearBuilt is null or b.yearBuilt <= :maxYearBuilt)
              and (:minFloors is null or b.floors >= :minFloors)
              and (:maxFloors is null or b.floors <= :maxFloors)
            """)
    List<Building> searchPolygonsInBbox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat,
            @Param("neighborhood") String neighborhood,
            @Param("buildingType") String buildingType,
            @Param("minYearBuilt") Integer minYearBuilt,
            @Param("maxYearBuilt") Integer maxYearBuilt,
            @Param("minFloors") Integer minFloors,
            @Param("maxFloors") Integer maxFloors
    );

}
