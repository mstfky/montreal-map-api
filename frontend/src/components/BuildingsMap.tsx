"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    fetchBuildingsGeoJson,
    FeatureCollection,
    SearchParams,
    fetchZonesGeoJson,
    fetchLandUseGeoJson,
    fetchAdminBoundariesGeoJson,
    fetchZonageAtPoint,
    fetchArrondissements,
    ZonageResponse,
} from "@/lib/api";
import type { SidebarSelection } from "./sidebar/types";
import FeatureDetailSidebar from "./sidebar/FeatureDetailSidebar";

const SOURCE_ID = "buildings";
const LAYER_POINT = "buildings-point";
const LAYER_POLY = "buildings-poly";

const ZONE_SOURCE_ID = "zones";
const ZONE_LAYER_FILL = "zones-fill";
const ZONE_LAYER_LINE = "zones-line";

const LANDUSE_SOURCE_ID = "landuse";
const LANDUSE_LAYER_FILL = "landuse-fill";
const LANDUSE_LAYER_LINE = "landuse-line";

const HIGHLIGHT_SOURCE_ID = "highlight";
const HIGHLIGHT_LAYER_LINE = "highlight-line";

const ADMIN_SOURCE_ID = "admin-boundaries";
const ADMIN_LAYER_LINE = "admin-boundaries-line";
const ADMIN_LAYER_LABEL = "admin-boundaries-label";

// Feature flags — set to true to re-enable these layers
const ENABLE_LAND_USE_LAYER = false;
const ENABLE_ADMIN_BOUNDARIES_LAYER = false;

// Land use colors by type
const LANDUSE_COLORS: Record<string, string> = {
    "Residential": "#90EE90",        // light green
    "Mixed Use": "#FFB347",          // orange
    "Industrial": "#B19CD9",         // purple
    "Parks & Recreation": "#32CD32", // lime green
    "Conservation": "#228B22",       // forest green
    "Downtown Core": "#FF6B6B",      // coral red
    "Public Infrastructure": "#87CEEB", // sky blue
    "Agricultural": "#F4A460",       // sandy brown
};

type Filters = {
    neighborhood?: string;
    buildingType?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minFloors?: number;
    maxFloors?: number;
};

function round(n: number) {
    return Math.round(n * 1e6) / 1e6;
}

export default function BuildingsMap() {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapDivRef = useRef<HTMLDivElement | null>(null);
    const mapReadyRef = useRef(false);

    const [fc, setFc] = useState<FeatureCollection>({ type: "FeatureCollection", features: [] });
    const [zonesFc, setZonesFc] = useState<FeatureCollection>({
        type: "FeatureCollection",
        features: [],
    });
    const [landUseFc, setLandUseFc] = useState<FeatureCollection>({
        type: "FeatureCollection",
        features: [],
    });
    const [adminFc, setAdminFc] = useState<FeatureCollection>({
        type: "FeatureCollection",
        features: [],
    });

    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({});
    const [loading, setLoading] = useState(false);
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

    // Sidebar state
    const [sidebarSelection, setSidebarSelection] = useState<SidebarSelection | null>(null);
    const [zonageData, setZonageData] = useState<ZonageResponse | null>(null);
    const [zonageLoading, setZonageLoading] = useState(false);
    const [zonageError, setZonageError] = useState<string | null>(null);

    // Layer visibility toggles
    const [showLandUse, setShowLandUse] = useState(ENABLE_LAND_USE_LAYER);
    const [showZonage, setShowZonage] = useState(true);
    const [showBuildings, setShowBuildings] = useState(true);
    const [showAdminBoundaries, setShowAdminBoundaries] = useState(ENABLE_ADMIN_BOUNDARIES_LAYER);

    // Arrondissement filter state
    const [availableArrondissements, setAvailableArrondissements] = useState<string[]>([]);
    const [selectedArrondissements, setSelectedArrondissements] = useState<string[]>([]);

    // Initial view: Montreal
    const initial = useMemo(() => ({ lng: -73.5673, lat: 45.5017, zoom: 12 }), []);

    const closeSidebar = useCallback(() => {
        setSidebarSelection(null);
        setSelectedFeatureId(null);
        setZonageData(null);
        setZonageLoading(false);
        setZonageError(null);
        const map = mapRef.current;
        if (map) {
            const highlightSrc = map.getSource(HIGHLIGHT_SOURCE_ID) as maplibregl.GeoJSONSource;
            if (highlightSrc) {
                highlightSrc.setData({ type: "FeatureCollection", features: [] });
            }
        }
    }, []);

    const retryZonage = useCallback(() => {
        if (!sidebarSelection || sidebarSelection.type !== "building") return;
        // Trigger re-fetch by creating a new selection object
        setSidebarSelection({ ...sidebarSelection });
    }, [sidebarSelection]);

    // Fetch zonage when a building is selected
    useEffect(() => {
        if (!sidebarSelection || sidebarSelection.type !== "building") {
            setZonageData(null);
            setZonageLoading(false);
            setZonageError(null);
            return;
        }

        let cancelled = false;
        const { lng, lat } = sidebarSelection.lngLat;

        setZonageData(null);
        setZonageLoading(true);
        setZonageError(null);

        fetchZonageAtPoint(lng, lat)
            .then((data) => {
                if (!cancelled) {
                    setZonageData(data);
                    setZonageLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setZonageError(err?.message ?? "Failed to load zonage");
                    setZonageLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [sidebarSelection]);

    useEffect(() => {
        if (!mapDivRef.current) return;
        if (mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapDivRef.current,
            style: `https://api.maptiler.com/maps/hybrid/style.json?key=tB2L6SKHHpGhLq5rCbBD`,
            center: [initial.lng, initial.lat],
            zoom: initial.zoom,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
        mapRef.current = map;

        map.on("load", () => {
            // =========================
            // BUILDINGS SOURCE + LAYERS
            // =========================
            map.addSource(SOURCE_ID, {
                type: "geojson",
                data: fc as any,
            });

            map.addLayer({
                id: LAYER_POLY,
                type: "fill",
                source: SOURCE_ID,
                filter: [
                    "any",
                    ["==", ["geometry-type"], "Polygon"],
                    ["==", ["geometry-type"], "MultiPolygon"],
                ],
                paint: {
                    "fill-color": "#FFD700",
                    "fill-opacity": 0.6,
                },
            });

            map.addLayer({
                id: `${LAYER_POLY}-outline`,
                type: "line",
                source: SOURCE_ID,
                filter: [
                    "any",
                    ["==", ["geometry-type"], "Polygon"],
                    ["==", ["geometry-type"], "MultiPolygon"],
                ],
                paint: {
                    "line-color": "#FF4500",
                    "line-width": 4,
                },
            });

            map.addLayer({
                id: LAYER_POINT,
                type: "circle",
                source: SOURCE_ID,
                filter: ["==", ["geometry-type"], "Point"],
                paint: {
                    "circle-radius": 10,
                    "circle-color": "#FF6B00",
                    "circle-opacity": 0.95,
                    "circle-stroke-width": 3,
                    "circle-stroke-color": "#FFFFFF",
                },
            });

            // ======================
            // ADMIN BOUNDARIES (arrondissements)
            // ======================
            map.addSource(ADMIN_SOURCE_ID, {
                type: "geojson",
                data: adminFc as any,
            });

            map.addLayer({
                id: ADMIN_LAYER_LINE,
                type: "line",
                source: ADMIN_SOURCE_ID,
                paint: {
                    "line-color": "#FF00FF",
                    "line-width": 3,
                    "line-dasharray": [4, 2],
                    "line-opacity": 0.8,
                },
            });

            map.addLayer({
                id: ADMIN_LAYER_LABEL,
                type: "symbol",
                source: ADMIN_SOURCE_ID,
                layout: {
                    "text-field": ["get", "name"],
                    "text-size": 14,
                    "text-anchor": "center",
                    "text-allow-overlap": false,
                },
                paint: {
                    "text-color": "#FF00FF",
                    "text-halo-color": "#FFFFFF",
                    "text-halo-width": 2,
                },
            });

            // ======================
            // LAND USE SOURCE + LAYERS (city-wide)
            // ======================
            map.addSource(LANDUSE_SOURCE_ID, {
                type: "geojson",
                data: landUseFc as any,
            });

            map.addLayer({
                id: LANDUSE_LAYER_FILL,
                type: "fill",
                source: LANDUSE_SOURCE_ID,
                filter: [
                    "any",
                    ["==", ["geometry-type"], "Polygon"],
                    ["==", ["geometry-type"], "MultiPolygon"],
                ],
                paint: {
                    "fill-color": [
                        "match",
                        ["get", "affectationEn"],
                        "Residential", LANDUSE_COLORS["Residential"],
                        "Mixed Use", LANDUSE_COLORS["Mixed Use"],
                        "Industrial", LANDUSE_COLORS["Industrial"],
                        "Parks & Recreation", LANDUSE_COLORS["Parks & Recreation"],
                        "Conservation", LANDUSE_COLORS["Conservation"],
                        "Downtown Core", LANDUSE_COLORS["Downtown Core"],
                        "Public Infrastructure", LANDUSE_COLORS["Public Infrastructure"],
                        "Agricultural", LANDUSE_COLORS["Agricultural"],
                        "#808080" // default gray
                    ],
                    "fill-opacity": 0.35,
                },
            });

            map.addLayer({
                id: LANDUSE_LAYER_LINE,
                type: "line",
                source: LANDUSE_SOURCE_ID,
                filter: [
                    "any",
                    ["==", ["geometry-type"], "Polygon"],
                    ["==", ["geometry-type"], "MultiPolygon"],
                ],
                paint: {
                    "line-color": "#0066FF",
                    "line-width": 2,
                    "line-opacity": 0.8,
                },
            });

            // ======================
            // ZONES SOURCE + LAYERS
            // ======================
            map.addSource(ZONE_SOURCE_ID, {
                type: "geojson",
                data: zonesFc as any,
            });

            map.addLayer({
                id: ZONE_LAYER_FILL,
                type: "fill",
                source: ZONE_SOURCE_ID,
                filter: [
                    "any",
                    ["==", ["geometry-type"], "Polygon"],
                    ["==", ["geometry-type"], "MultiPolygon"],
                ],
                paint: {
                    "fill-color": "#006666",
                    "fill-opacity": 0.35,
                },
            });

            map.addLayer({
                id: ZONE_LAYER_LINE,
                type: "line",
                source: ZONE_SOURCE_ID,
                filter: [
                    "any",
                    ["==", ["geometry-type"], "Polygon"],
                    ["==", ["geometry-type"], "MultiPolygon"],
                ],
                paint: {
                    "line-color": "#004444",
                    "line-width": 2,
                },
            });

            // ======================
            // HIGHLIGHT LAYER (for selected features)
            // ======================
            map.addSource(HIGHLIGHT_SOURCE_ID, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });

            map.addLayer({
                id: HIGHLIGHT_LAYER_LINE,
                type: "line",
                source: HIGHLIGHT_SOURCE_ID,
                paint: {
                    "line-color": "#FF0000",
                    "line-width": 5,
                    "line-opacity": 1,
                },
            });

            // Click handler — opens sidebar instead of popup
            map.on("click", (e) => {
                const highlightFeature = (geometry: any) => {
                    const highlightSrc = map.getSource(HIGHLIGHT_SOURCE_ID) as maplibregl.GeoJSONSource;
                    if (highlightSrc && geometry) {
                        highlightSrc.setData({
                            type: "FeatureCollection",
                            features: [{
                                type: "Feature",
                                properties: {},
                                geometry: JSON.parse(JSON.stringify(geometry)),
                            }],
                        });
                    }
                };

                // First check for building features
                const buildingFeats = map.queryRenderedFeatures(e.point, {
                    layers: [LAYER_POLY, `${LAYER_POLY}-outline`, LAYER_POINT],
                });

                if (buildingFeats.length > 0) {
                    const poly = buildingFeats.find(
                        (f: any) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"
                    );
                    const point = buildingFeats.find((f: any) => f.geometry?.type === "Point");
                    const f: any = poly ?? point;
                    if (!f) return;

                    const lngLat =
                        f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates)
                            ? { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }
                            : { lng: e.lngLat.lng, lat: e.lngLat.lat };

                    highlightFeature(f.geometry);
                    setSelectedFeatureId(f.id);
                    setSidebarSelection({
                        type: "building",
                        properties: f.properties || {},
                        geometry: f.geometry,
                        lngLat,
                    });
                    return;
                }

                // Check for zone features
                const zoneFeats = map.queryRenderedFeatures(e.point, {
                    layers: [ZONE_LAYER_FILL, ZONE_LAYER_LINE],
                });

                if (zoneFeats.length > 0) {
                    const zoneFeature: any = zoneFeats[0];
                    highlightFeature(zoneFeature.geometry);
                    setSelectedFeatureId(zoneFeature.id);
                    setSidebarSelection({
                        type: "zone",
                        properties: zoneFeature.properties || {},
                        geometry: zoneFeature.geometry,
                    });
                    return;
                }

                // Check for land use features (lowest priority, only if enabled)
                if (ENABLE_LAND_USE_LAYER) {
                    const landUseFeats = map.queryRenderedFeatures(e.point, {
                        layers: [LANDUSE_LAYER_FILL],
                    });

                    if (landUseFeats.length > 0) {
                        const feature: any = landUseFeats[0];
                        highlightFeature(feature.geometry);
                        setSelectedFeatureId(feature.id);
                        setSidebarSelection({
                            type: "landuse",
                            properties: feature.properties || {},
                            geometry: feature.geometry,
                        });
                        return;
                    }
                }

                // Clicked on empty space — close sidebar + clear highlight
                closeSidebar();
            });

            mapReadyRef.current = true;
            runSearchFromCurrentBbox();
        });

        return () => {
            map.remove();
            mapRef.current = null;
            mapReadyRef.current = false;
        };
    }, [initial]);

    // Update buildings source when fc changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!src) return;
        src.setData(fc as any);
    }, [fc]);

    // Update zones source when zonesFc changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource(ZONE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!src) return;
        src.setData(zonesFc as any);
    }, [zonesFc]);

    // Update land use source when landUseFc changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource(LANDUSE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!src) return;
        src.setData(landUseFc as any);
    }, [landUseFc]);

    // Update admin boundaries source when adminFc changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource(ADMIN_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (!src) return;
        src.setData(adminFc as any);
    }, [adminFc]);

    // Load admin boundaries once on mount (only if enabled)
    useEffect(() => {
        if (!ENABLE_ADMIN_BOUNDARIES_LAYER) return;
        fetchAdminBoundariesGeoJson()
            .then(setAdminFc)
            .catch((err) => console.warn("Failed to load admin boundaries:", err));
    }, []);

    // Load arrondissements list on mount
    useEffect(() => {
        fetchArrondissements()
            .then(setAvailableArrondissements)
            .catch((err) => console.warn("Failed to load arrondissements:", err));
    }, []);

    // Toggle layer visibility
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getLayer(LANDUSE_LAYER_FILL)) return;
        map.setLayoutProperty(LANDUSE_LAYER_FILL, "visibility", showLandUse ? "visible" : "none");
        map.setLayoutProperty(LANDUSE_LAYER_LINE, "visibility", showLandUse ? "visible" : "none");
    }, [showLandUse]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getLayer(ZONE_LAYER_FILL)) return;
        map.setLayoutProperty(ZONE_LAYER_FILL, "visibility", showZonage ? "visible" : "none");
        map.setLayoutProperty(ZONE_LAYER_LINE, "visibility", showZonage ? "visible" : "none");
    }, [showZonage]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getLayer(LAYER_POLY)) return;
        map.setLayoutProperty(LAYER_POLY, "visibility", showBuildings ? "visible" : "none");
        map.setLayoutProperty(`${LAYER_POLY}-outline`, "visibility", showBuildings ? "visible" : "none");
        map.setLayoutProperty(LAYER_POINT, "visibility", showBuildings ? "visible" : "none");
    }, [showBuildings]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getLayer(ADMIN_LAYER_LINE)) return;
        map.setLayoutProperty(ADMIN_LAYER_LINE, "visibility", showAdminBoundaries ? "visible" : "none");
        map.setLayoutProperty(ADMIN_LAYER_LABEL, "visibility", showAdminBoundaries ? "visible" : "none");
    }, [showAdminBoundaries]);

    async function runSearchFromCurrentBbox() {
        const map = mapRef.current;
        if (!map) return;

        const zoom = map.getZoom();
        const b = map.getBounds();
        const params: SearchParams = {
            minLng: round(b.getWest()),
            minLat: round(b.getSouth()),
            maxLng: round(b.getEast()),
            maxLat: round(b.getNorth()),
            ...filters,
            arrondissements: selectedArrondissements.length > 0 ? selectedArrondissements : undefined,
        };

        setLoading(true);
        setError(null);

        try {
            const bboxParams = {
                minLng: params.minLng,
                minLat: params.minLat,
                maxLng: params.maxLng,
                maxLat: params.maxLat,
            };

            // Only load buildings when zoomed in enough (zoom > 13)
            // Land use and zones load at all zoom levels
            const buildingsPromise = zoom > 13
                ? fetchBuildingsGeoJson(params)
                : Promise.resolve({ type: "FeatureCollection" as const, features: [] });

            const promises: [Promise<FeatureCollection>, Promise<FeatureCollection>, Promise<FeatureCollection>] = [
                buildingsPromise,
                fetchZonesGeoJson(params),
                ENABLE_LAND_USE_LAYER
                    ? fetchLandUseGeoJson(bboxParams)
                    : Promise.resolve({ type: "FeatureCollection" as const, features: [] }),
            ];

            const [buildings, zones, landUse] = await Promise.all(promises);

            setFc(buildings);
            setZonesFc(zones);
            if (ENABLE_LAND_USE_LAYER) setLandUseFc(landUse);
        } catch (e: any) {
            setError(e?.message ?? "Unknown error");
            setFc({ type: "FeatureCollection", features: [] });
            setZonesFc({ type: "FeatureCollection", features: [] });
            setLandUseFc({ type: "FeatureCollection", features: [] });
        } finally {
            setLoading(false);
        }
    }

    // Re-search when arrondissements filter changes
    useEffect(() => {
        if (!mapReadyRef.current) return;
        runSearchFromCurrentBbox();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedArrondissements]);

    // Auto search on move end (debounced-ish)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        let t: any;
        const handler = () => {
            clearTimeout(t);
            t = setTimeout(() => runSearchFromCurrentBbox(), 400);
        };

        map.on("moveend", handler);
        return () => {
            clearTimeout(t);
            map.off("moveend", handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, selectedArrondissements]);

    return (
        <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-16px)] gap-3 p-2">
            {/* Left sidebar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-y-auto flex flex-col">
                {/* Search Filters header */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
                    <h2 className="text-base font-bold text-gray-900">Search Filters</h2>
                    <button
                        onClick={runSearchFromCurrentBbox}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </div>

                {/* Filter inputs */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                    <div className="space-y-3">
                        <label className="block">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Neighborhood
                            </span>
                            <input
                                value={filters.neighborhood ?? ""}
                                onChange={(e) => setFilters((p) => ({ ...p, neighborhood: e.target.value || undefined }))}
                                className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
                                placeholder="Ville-Marie"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Building Type
                            </span>
                            <input
                                value={filters.buildingType ?? ""}
                                onChange={(e) => setFilters((p) => ({ ...p, buildingType: e.target.value || undefined }))}
                                className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
                                placeholder="Residential"
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Min Year
                                </span>
                                <input
                                    type="number"
                                    value={filters.minYearBuilt ?? ""}
                                    onChange={(e) =>
                                        setFilters((p) => ({
                                            ...p,
                                            minYearBuilt: e.target.value ? Number(e.target.value) : undefined,
                                        }))
                                    }
                                    className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Max Year
                                </span>
                                <input
                                    type="number"
                                    value={filters.maxYearBuilt ?? ""}
                                    onChange={(e) =>
                                        setFilters((p) => ({
                                            ...p,
                                            maxYearBuilt: e.target.value ? Number(e.target.value) : undefined,
                                        }))
                                    }
                                    className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Min Floors
                                </span>
                                <input
                                    type="number"
                                    value={filters.minFloors ?? ""}
                                    onChange={(e) =>
                                        setFilters((p) => ({
                                            ...p,
                                            minFloors: e.target.value ? Number(e.target.value) : undefined,
                                        }))
                                    }
                                    className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Max Floors
                                </span>
                                <input
                                    type="number"
                                    value={filters.maxFloors ?? ""}
                                    onChange={(e) =>
                                        setFilters((p) => ({
                                            ...p,
                                            maxFloors: e.target.value ? Number(e.target.value) : undefined,
                                        }))
                                    }
                                    className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
                                />
                            </label>
                        </div>

                        <button
                            onClick={() => setFilters({})}
                            className="w-full py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Layers section */}
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Layers
                        </h3>
                        <div className="space-y-2.5">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={showBuildings}
                                    onChange={(e) => setShowBuildings(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#FFD700" }} />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900">Buildings</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={showZonage}
                                    onChange={(e) => setShowZonage(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#006666" }} />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900">Zonage (Rosemont)</span>
                            </label>
                            {ENABLE_LAND_USE_LAYER && (
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={showLandUse}
                                        onChange={(e) => setShowLandUse(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#90EE90" }} />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Land Use</span>
                                </label>
                            )}
                            {ENABLE_ADMIN_BOUNDARIES_LAYER && (
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={showAdminBoundaries}
                                        onChange={(e) => setShowAdminBoundaries(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#FF00FF" }} />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Admin Boundaries</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Zonage (Arrondissement) filter section */}
                    {availableArrondissements.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Zonage
                            </h3>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {availableArrondissements.map((arr) => (
                                    <label key={arr} className="flex items-center gap-2.5 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedArrondissements.includes(arr)}
                                            onChange={(e) => {
                                                setSelectedArrondissements((prev) =>
                                                    e.target.checked
                                                        ? [...prev, arr]
                                                        : prev.filter((a) => a !== arr)
                                                );
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: "#006666" }} />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{arr}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedArrondissements.length > 0 && (
                                <button
                                    onClick={() => setSelectedArrondissements([])}
                                    className="mt-2 w-full py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Clear Arrondissements
                                </button>
                            )}
                        </div>
                    )}

                    {/* Stats footer */}
                    <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs text-gray-500">
                            {loading
                                ? "Loading..."
                                : `Buildings: ${fc.features.length} | Zones: ${zonesFc.features.length}${ENABLE_LAND_USE_LAYER ? ` | Land Use: ${landUseFc.features.length}` : ""}`}
                        </p>
                        {selectedArrondissements.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                Filtered by: {selectedArrondissements.length} arrondissement{selectedArrondissements.length > 1 ? "s" : ""}
                            </p>
                        )}
                        {fc.features.length === 0 && !loading && (
                            <p className="text-xs text-gray-400 mt-1">Zoom in to see buildings</p>
                        )}
                        {error && (
                            <p className="text-xs text-red-600 mt-1">Error: {error}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
                <FeatureDetailSidebar
                    selection={sidebarSelection}
                    zonageData={zonageData}
                    zonageLoading={zonageLoading}
                    zonageError={zonageError}
                    onClose={closeSidebar}
                    onRetryZonage={retryZonage}
                />
            </div>
        </div>
    );
}
