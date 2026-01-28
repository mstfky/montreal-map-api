package com.teksi.montrealmap.building.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.Geometry;


@Entity
@Table(name = "buildings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Building {

    @Id
    @Column(length = 64)
    private String id;

    private String address;

    private String neighborhood;

    @Column(name = "year_built")
    private Integer yearBuilt;

    private Integer floors;

    @Column(name = "building_type")
    private String buildingType;

    @Column(columnDefinition = "geometry")
    private Geometry geom;
}
