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
@Table(name = "land_use")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LandUse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "affectation")
    private String affectation;

    @Column(name = "affectation_en")
    private String affectationEn;

    @Column(name = "area_sqm")
    private BigDecimal areaSqm;

    @Column(columnDefinition = "geometry(MultiPolygon, 4326)")
    private MultiPolygon geom;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
