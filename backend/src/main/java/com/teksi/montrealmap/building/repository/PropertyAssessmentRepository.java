package com.teksi.montrealmap.building.repository;

import com.teksi.montrealmap.building.entity.PropertyAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PropertyAssessmentRepository extends JpaRepository<PropertyAssessment, Long> {

    @Query("""
            select p
            from PropertyAssessment p
            where p.geom is not null
              and function('ST_Intersects', p.geom,
                  function('ST_MakeEnvelope', :minLng, :minLat, :maxLng, :maxLat, 4326)
              ) = true
              and (:minYearBuilt is null or p.yearBuilt >= :minYearBuilt)
              and (:maxYearBuilt is null or p.yearBuilt <= :maxYearBuilt)
              and (:minFloors is null or p.floors >= :minFloors)
              and (:maxFloors is null or p.floors <= :maxFloors)
            order by p.buildingArea desc
            limit 5000
            """)
    List<PropertyAssessment> searchInBbox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat,
            @Param("minYearBuilt") Integer minYearBuilt,
            @Param("maxYearBuilt") Integer maxYearBuilt,
            @Param("minFloors") Integer minFloors,
            @Param("maxFloors") Integer maxFloors
    );

    @Query(value = """
            SELECT p.*
            FROM property_assessment p
            WHERE p.geom IS NOT NULL
              AND p.borough = :codeRem
              AND ST_Intersects(p.geom, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))
            ORDER BY p.building_area DESC
            LIMIT 5000
            """, nativeQuery = true)
    List<PropertyAssessment> searchInBboxByBorough(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat,
            @Param("codeRem") String codeRem
    );
}
