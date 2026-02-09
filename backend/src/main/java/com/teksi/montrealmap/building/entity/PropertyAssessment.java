package com.teksi.montrealmap.building.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "property_assessment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PropertyAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_uev")
    private String idUev;

    @Column(name = "civic_number_start")
    private String civicNumberStart;

    @Column(name = "civic_number_end")
    private String civicNumberEnd;

    @Column(name = "street_name")
    private String streetName;

    private String suite;

    private String municipality;

    private Integer floors;

    @Column(name = "num_units")
    private Integer numUnits;

    @Column(name = "year_built")
    private Integer yearBuilt;

    @Column(name = "usage_code")
    private String usageCode;

    @Column(name = "usage_label")
    private String usageLabel;

    private String category;

    private String matricule;

    @Column(name = "land_area")
    private BigDecimal landArea;

    @Column(name = "building_area")
    private BigDecimal buildingArea;

    private String borough;

    @Column(columnDefinition = "geometry(Polygon, 4326)")
    private Polygon geom;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Get formatted address
     */
    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (civicNumberStart != null) {
            sb.append(civicNumberStart.trim());
            if (civicNumberEnd != null && !civicNumberEnd.trim().equals(civicNumberStart.trim())) {
                sb.append("-").append(civicNumberEnd.trim());
            }
        }
        if (streetName != null) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(streetName.trim());
        }
        if (suite != null && !suite.trim().isEmpty()) {
            sb.append(", suite ").append(suite.trim());
        }
        return sb.toString();
    }
}
