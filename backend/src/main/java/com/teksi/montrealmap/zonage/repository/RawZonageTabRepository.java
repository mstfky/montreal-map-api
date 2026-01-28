package com.teksi.montrealmap.zonage.repository;

import com.teksi.montrealmap.zonage.entity.RawZonageTabEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RawZonageTabRepository extends JpaRepository<RawZonageTabEntity, Long> {

    @Query(value = """
        select z.numero_complet
        from raw.raw_zonage_tab z
        where z.wkb_geometry is not null
          and ST_Intersects(
                z.wkb_geometry,
                ST_SetSRID(ST_Point(:lng, :lat), 4326)
          )
        limit 1
        """, nativeQuery = true)
    Optional<String> findNumeroCompletAtPoint(@Param("lng") double lng, @Param("lat") double lat);
}

