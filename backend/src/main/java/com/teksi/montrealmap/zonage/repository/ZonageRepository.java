package com.teksi.montrealmap.zonage.repository;

import com.teksi.montrealmap.zonage.entity.Zonage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ZonageRepository extends JpaRepository<Zonage, Long> {

    @Query(value = """
        SELECT *
        FROM public.zonage z
        WHERE ST_Contains(
            z.geom,
            ST_SetSRID(ST_Point(:lng, :lat), 4326)
        )
        LIMIT 1
        """, nativeQuery = true)
    Optional<Zonage> findAtPoint(@Param("lng") double lng, @Param("lat") double lat);

    @Query(value = """
        SELECT *
        FROM public.zonage z
        WHERE ST_Intersects(
            z.geom,
            ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)
        )
        """, nativeQuery = true)
    List<Zonage> searchInBbox(
            @Param("minLng") double minLng,
            @Param("minLat") double minLat,
            @Param("maxLng") double maxLng,
            @Param("maxLat") double maxLat
    );

    @Query(value = """
        SELECT DISTINCT z.arrondissement
        FROM public.zonage z
        WHERE z.arrondissement IS NOT NULL
        ORDER BY z.arrondissement
        """, nativeQuery = true)
    List<String> findDistinctArrondissements();

    @Query(value = """
        SELECT DISTINCT z.zone_code
        FROM zonage z
        INNER JOIN admin_boundaries ab ON ST_Intersects(z.geom, ab.geom)
        WHERE ab.code_3c = :code3l
        ORDER BY z.zone_code
        """, nativeQuery = true)
    List<String> findZoneCodesByArrondissement(@Param("code3l") String code3l);

}

