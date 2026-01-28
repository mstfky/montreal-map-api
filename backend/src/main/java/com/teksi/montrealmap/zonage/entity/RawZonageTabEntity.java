package com.teksi.montrealmap.zonage.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Geometry;

@Entity
@Table(name = "raw_zonage_tab", schema = "raw")
@Getter
@Setter
public class RawZonageTabEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ogc_fid")
    private Long id;

    @Column(name = "numero_complet")
    private String numeroComplet;

    @Column(name = "wkb_geometry")
    private Geometry geometry;
}

