package com.teksi.montrealmap.admin.service;

import com.teksi.montrealmap.building.entity.AdminBoundary;
import com.teksi.montrealmap.building.repository.AdminBoundaryRepository;
import com.teksi.montrealmap.geojson.GeoJson;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminBoundaryServiceImpl implements AdminBoundaryService {

    private final AdminBoundaryRepository adminBoundaryRepository;

    @Override
    public GeoJson.FeatureCollection searchGeoJson(double minLng, double minLat, double maxLng, double maxLat) {
        List<AdminBoundary> boundaries = adminBoundaryRepository.findInBbox(minLng, minLat, maxLng, maxLat);

        List<GeoJson.Feature> features = boundaries.stream()
                .map(this::toGeoFeature)
                .toList();

        return GeoJson.FeatureCollection.of(features);
    }

    @Override
    public GeoJson.FeatureCollection getAllGeoJson() {
        List<AdminBoundary> boundaries = adminBoundaryRepository.findAll();

        List<GeoJson.Feature> features = boundaries.stream()
                .map(this::toGeoFeature)
                .toList();

        return GeoJson.FeatureCollection.of(features);
    }

    private GeoJson.Feature toGeoFeature(AdminBoundary b) {
        GeoJson.Geometry geometry = toGeoJsonGeometry(b.getGeom());

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("name", b.getName());
        props.put("nameOfficial", b.getNameOfficial());
        props.put("abbrev", b.getAbbrev());
        props.put("boundaryType", b.getBoundaryType());
        props.put("num", b.getNum());

        return GeoJson.Feature.of("admin-" + b.getId(), geometry, props);
    }

    private GeoJson.Geometry toGeoJsonGeometry(MultiPolygon mp) {
        if (mp == null) return null;
        return GeoJson.Geometry.multiPolygon(jtsMultiPolygonToCoords(mp));
    }

    private List<List<List<List<Double>>>> jtsMultiPolygonToCoords(MultiPolygon mp) {
        List<List<List<List<Double>>>> polys = new ArrayList<>();
        for (int i = 0; i < mp.getNumGeometries(); i++) {
            polys.add(jtsPolygonToCoords((Polygon) mp.getGeometryN(i)));
        }
        return polys;
    }

    private List<List<List<Double>>> jtsPolygonToCoords(Polygon p) {
        List<List<List<Double>>> rings = new ArrayList<>();
        rings.add(linearRingToCoords((LineString) p.getExteriorRing()));
        for (int i = 0; i < p.getNumInteriorRing(); i++) {
            rings.add(linearRingToCoords((LineString) p.getInteriorRingN(i)));
        }
        return rings;
    }

    private List<List<Double>> linearRingToCoords(LineString ring) {
        var cs = ring.getCoordinates();
        List<List<Double>> out = new ArrayList<>(cs.length);
        for (var c : cs) {
            out.add(List.of(c.getX(), c.getY()));
        }
        return out;
    }
}
