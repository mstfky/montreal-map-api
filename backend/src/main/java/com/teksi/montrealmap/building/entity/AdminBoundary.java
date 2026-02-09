package com.teksi.montrealmap.building.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.MultiPolygon;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_boundaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminBoundary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code_id")
    private Integer codeId;

    @Column(name = "name")
    private String name;

    @Column(name = "name_official")
    private String nameOfficial;

    @Column(name = "code_3c")
    private String code3c;

    @Column(name = "num")
    private Integer num;

    @Column(name = "abbrev")
    private String abbrev;

    @Column(name = "boundary_type")
    private String boundaryType;

    @Column(columnDefinition = "geometry(MultiPolygon, 4326)")
    private MultiPolygon geom;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
