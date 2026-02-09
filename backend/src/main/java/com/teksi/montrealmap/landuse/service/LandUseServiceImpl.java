package com.teksi.montrealmap.landuse.service;

import com.teksi.montrealmap.building.entity.LandUse;
import com.teksi.montrealmap.building.repository.LandUseRepository;
import com.teksi.montrealmap.geojson.GeoJson;
import com.teksi.montrealmap.landuse.dto.LandUseResponse;
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
public class LandUseServiceImpl implements LandUseService {

    private final LandUseRepository landUseRepository;

    @Override
    public List<LandUseResponse> getAtPoint(double lng, double lat) {
        return landUseRepository.findAtPoint(lng, lat).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public GeoJson.FeatureCollection searchGeoJson(double minLng, double minLat, double maxLng, double maxLat) {
        List<LandUse> zones = landUseRepository.findInBbox(minLng, minLat, maxLng, maxLat);

        List<GeoJson.Feature> features = zones.stream()
                .map(this::toGeoFeature)
                .toList();

        return GeoJson.FeatureCollection.of(features);
    }

    private GeoJson.Feature toGeoFeature(LandUse l) {
        GeoJson.Geometry geometry = toGeoJsonGeometry(l.getGeom());

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("affectation", l.getAffectation());
        props.put("affectationEn", l.getAffectationEn());
        props.put("areaSqm", l.getAreaSqm());

        return GeoJson.Feature.of("landuse-" + l.getId(), geometry, props);
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

    private LandUseResponse toDto(LandUse l) {
        return new LandUseResponse(
                l.getId(),
                l.getAffectation(),
                l.getAffectationEn(),
                l.getAreaSqm()
        );
    }
}
