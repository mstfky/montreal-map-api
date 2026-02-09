package com.teksi.montrealmap.building.repository;

import com.teksi.montrealmap.building.entity.MontrealBuilding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MontrealBuildingRepository extends JpaRepository<MontrealBuilding, Long> {

    @Query("""
            select b
            from MontrealBuilding b
            where b.geom is not null
              and function('ST_Intersects', b.geom,
                  function('ST_MakeEnvelope', :minLng, :minLat, :maxLng, :maxLat, 4326)
              ) = true
            """)
    List<MontrealBuilding> searchInBbox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat
    );
}
