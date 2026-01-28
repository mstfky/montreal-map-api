package com.teksi.montrealmap.zonage.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.MultiPolygon;

import java.math.BigDecimal;

@Entity
@Table(name = "zonage", schema = "public")
@Getter
@Setter
public class Zonage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "zone_code")
    private String zoneCode;

    private String arrondissement;
    private String district;
    private String secteur;

    private String classe1;
    private String classe2;
    private String classe3;
    private String classe4;
    private String classe5;
    private String classe6;

    @Column(name = "etage_min")
    private BigDecimal etageMin;

    @Column(name = "etage_max")
    private BigDecimal etageMax;

    @Column(name = "densite_min")
    private BigDecimal densiteMin;

    @Column(name = "densite_max")
    private BigDecimal densiteMax;

    @Column(name = "taux_min")
    private BigDecimal tauxMin;

    @Column(name = "taux_max")
    private BigDecimal tauxMax;

    private String note;
    private String info;

    @Column(columnDefinition = "geometry(MultiPolygon,4326)")
    private MultiPolygon geom;
}
