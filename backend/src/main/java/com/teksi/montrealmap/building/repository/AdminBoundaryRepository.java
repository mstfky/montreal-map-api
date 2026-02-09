package com.teksi.montrealmap.building.repository;

import com.teksi.montrealmap.building.entity.AdminBoundary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdminBoundaryRepository extends JpaRepository<AdminBoundary, Integer> {

    @Query("""
            select a
            from AdminBoundary a
            where a.geom is not null
              and function('ST_Intersects', a.geom,
                  function('ST_MakeEnvelope', :minLng, :minLat, :maxLng, :maxLat, 4326)
              ) = true
            order by a.name
            """)
    List<AdminBoundary> findInBbox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat
    );

    List<AdminBoundary> findAll();
}
