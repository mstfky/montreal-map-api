package com.teksi.montrealmap.zonage.service;

import com.teksi.montrealmap.geojson.GeoJson;
import com.teksi.montrealmap.zonage.dto.ZonageResponse;
import com.teksi.montrealmap.zonage.entity.Zonage;
import com.teksi.montrealmap.zonage.repository.ZonageRepository;
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
public class ZonageServiceImpl implements ZonageService {

    private final ZonageRepository zonageRepository;

    @Override
    public ZonageResponse getAtPoint(double lng, double lat) {
        Zonage z = zonageRepository.findAtPoint(lng, lat)
                .orElseThrow(() -> new IllegalArgumentException("No zonage found for point"));

        return toDto(z);
    }

    @Override
    public GeoJson.FeatureCollection searchGeoJson(double minLng, double minLat, double maxLng, double maxLat) {
        List<Zonage> zones = zonageRepository.searchInBbox(minLng, minLat, maxLng, maxLat);

        List<GeoJson.Feature> features = zones.stream()
                .map(this::toGeoFeature)
                .toList();

        return GeoJson.FeatureCollection.of(features);
    }

    private GeoJson.Feature toGeoFeature(Zonage z) {
        GeoJson.Geometry geometry = toGeoJsonGeometry(z.getGeom());

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("zoneCode", z.getZoneCode());
        props.put("arrondissement", z.getArrondissement());
        props.put("district", z.getDistrict());
        props.put("secteur", z.getSecteur());
        props.put("classe1", z.getClasse1());
        props.put("classe2", z.getClasse2());
        props.put("classe3", z.getClasse3());
        props.put("classe4", z.getClasse4());
        props.put("classe5", z.getClasse5());
        props.put("classe6", z.getClasse6());
        props.put("etageMin", z.getEtageMin());
        props.put("etageMax", z.getEtageMax());
        props.put("densiteMin", z.getDensiteMin());
        props.put("densiteMax", z.getDensiteMax());
        props.put("tauxMin", z.getTauxMin());
        props.put("tauxMax", z.getTauxMax());
        props.put("note", z.getNote());
        props.put("info", z.getInfo());

        return GeoJson.Feature.of(String.valueOf(z.getId()), geometry, props);
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

    @Override
    public List<String> getArrondissements() {
        return zonageRepository.findDistinctArrondissements();
    }

    @Override
    public List<String> getZoneCodesByArrondissement(String code3l) {
        return zonageRepository.findZoneCodesByArrondissement(code3l);
    }

    private ZonageResponse toDto(Zonage z) {
        return new ZonageResponse(
                z.getId(),
                z.getZoneCode(),
                z.getArrondissement(),
                z.getDistrict(),
                z.getSecteur(),
                z.getClasse1(),
                z.getClasse2(),
                z.getClasse3(),
                z.getClasse4(),
                z.getClasse5(),
                z.getClasse6(),
                z.getEtageMin(),
                z.getEtageMax(),
                z.getDensiteMin(),
                z.getDensiteMax(),
                z.getTauxMin(),
                z.getTauxMax(),
                z.getNote(),
                z.getInfo()
        );
    }
}

