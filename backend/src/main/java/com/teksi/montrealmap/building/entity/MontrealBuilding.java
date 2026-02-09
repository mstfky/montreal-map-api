package com.teksi.montrealmap.building.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.MultiPolygon;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "montreal_buildings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MontrealBuilding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_layer")
    private String sourceLayer;

    private BigDecimal superficie;

    @Column(name = "update_date")
    private String updateDate;

    private String source;

    private BigDecimal version;

    @Column(columnDefinition = "geometry(MultiPolygon, 4326)")
    private MultiPolygon geom;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
