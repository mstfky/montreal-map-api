package com.teksi.montrealmap.geojson;

import java.util.List;
import java.util.Map;

public final class GeoJson {
    private GeoJson() {}

    public record FeatureCollection(
            String type,
            List<Feature> features
    ) {
        public static FeatureCollection of(List<Feature> features) {
            return new FeatureCollection("FeatureCollection", features);
        }
    }

    public record Feature(
            String type,
            String id,
            Geometry geometry,
            Map<String, Object> properties
    ) {
        public static Feature of(String id, Geometry geometry, Map<String, Object> properties) {
            return new Feature("Feature", id, geometry, properties);
        }
    }

    public record Geometry(
            String type,
            Object coordinates
    ) {
        public static Geometry point(double lng, double lat) {
            return new Geometry("Point", List.of(lng, lat));
        }

        public static Geometry polygonFromOuterRing(List<List<Double>> outerRingLngLat) {
            return new Geometry("Polygon", List.of(outerRingLngLat));
        }

        public static Geometry polygon(List<List<List<Double>>> coordinates) {
            return new Geometry("Polygon", coordinates);
        }

        public static Geometry multiPolygon(List<List<List<List<Double>>>> coordinates) {
            return new Geometry("MultiPolygon", coordinates);
        }

    }
}
