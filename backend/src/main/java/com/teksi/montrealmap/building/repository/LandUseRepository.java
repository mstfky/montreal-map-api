package com.teksi.montrealmap.building.repository;

import com.teksi.montrealmap.building.entity.LandUse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LandUseRepository extends JpaRepository<LandUse, Integer> {

    @Query("""
            select l
            from LandUse l
            where l.geom is not null
              and function('ST_Intersects', l.geom,
                  function('ST_MakeEnvelope', :minLng, :minLat, :maxLng, :maxLat, 4326)
              ) = true
            order by l.areaSqm desc
            limit 500
            """)
    List<LandUse> findInBbox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat
    );

    @Query("""
            select l
            from LandUse l
            where l.geom is not null
              and function('ST_Contains', l.geom,
                  function('ST_SetSRID', function('ST_Point', :lng, :lat), 4326)
              ) = true
            """)
    List<LandUse> findAtPoint(
            @Param("lng") double lng,
            @Param("lat") double lat
    );
}
