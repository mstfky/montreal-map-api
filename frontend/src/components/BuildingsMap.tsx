"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    fetchBuildingsGeoJson,
    FeatureCollection,
    SearchParams,
    fetchZonesGeoJson,
    fetchAdminBoundariesGeoJson,
    fetchZonageAtPoint,
    fetchArrondissementRefs,
    fetchZoneCodesByArrondissement,
    ArrondissementRef,
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

const HIGHLIGHT_SOURCE_ID = "highlight";
const HIGHLIGHT_LAYER_LINE = "highlight-line";

const ADMIN_SOURCE_ID = "admin-boundaries";
const ADMIN_LAYER_LINE = "admin-boundaries-line";
const ADMIN_LAYER_LABEL = "admin-boundaries-label";

type MapStyle = "positron" | "hybrid" | "streets";

const STYLE_URLS: Record<MapStyle, string> = {
    positron: "https://api.maptiler.com/maps/positron/style.json?key=tB2L6SKHHpGhLq5rCbBD",
    hybrid: "https://api.maptiler.com/maps/hybrid/style.json?key=tB2L6SKHHpGhLq5rCbBD",
    streets: "https://api.maptiler.com/maps/streets-v2/style.json?key=tB2L6SKHHpGhLq5rCbBD",
};

function round(n: number) {
    return Math.round(n * 1e6) / 1e6;
}

const BUILDINGS_ZOOM_THRESHOLD = 14;
const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export default function BuildingsMap() {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapDivRef = useRef<HTMLDivElement | null>(null);
    const mapReadyRef = useRef(false);
    const fetchIdRef = useRef(0);

    // GeoJSON data
    const [fc, setFc] = useState<FeatureCollection>(EMPTY_FC);
    const [zonesFc, setZonesFc] = useState<FeatureCollection>(EMPTY_FC);
    const [adminBoundariesFc, setAdminBoundariesFc] = useState<FeatureCollection>(EMPTY_FC);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

    // Sidebar state
    const [sidebarSelection, setSidebarSelection] = useState<SidebarSelection | null>(null);
    const [zonageData, setZonageData] = useState<ZonageResponse | null>(null);
    const [zonageLoading, setZonageLoading] = useState(false);
    const [zonageError, setZonageError] = useState<string | null>(null);

    // --- New panel state ---
    const [arrondissementRefs, setArrondissementRefs] = useState<ArrondissementRef[]>([]);
    const [selectedArrondissement, setSelectedArrondissement] = useState<ArrondissementRef | null>(null);
    const [zoneCodes, setZoneCodes] = useState<string[]>([]);
    const [selectedZoneCode, setSelectedZoneCode] = useState<string | null>(null);
    const [mapStyle, setMapStyle] = useState<MapStyle>("positron");

    // Initial view: Montreal
    const initial = useMemo(() => ({ lng: -73.5673, lat: 45.5017, zoom: 12 }), []);

    // Refs to hold current GeoJSON data for re-adding after style change
    const fcRef = useRef<FeatureCollection>(EMPTY_FC);
    const zonesFcRef = useRef<FeatureCollection>(EMPTY_FC);
    const adminFcRef = useRef<FeatureCollection>(EMPTY_FC);

    // Keep refs in sync with displayed (filtered) data for style-change re-add
    useEffect(() => { fcRef.current = fc; }, [fc]);

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

    // =====================================================
    // Add all sources and layers to a map instance.
    // Called on initial load and after style changes.
    // =====================================================
    function addAllSourcesAndLayers(map: maplibregl.Map) {
        // --- BUILDINGS ---
        map.addSource(SOURCE_ID, { type: "geojson", data: fcRef.current as any });

        map.addLayer({
            id: LAYER_POLY,
            type: "fill",
            source: SOURCE_ID,
            filter: ["any", ["==", ["geometry-type"], "Polygon"], ["==", ["geometry-type"], "MultiPolygon"]],
            paint: { "fill-color": "#e8f5e9", "fill-opacity": 0.15 },
        });
        map.addLayer({
            id: `${LAYER_POLY}-outline`,
            type: "line",
            source: SOURCE_ID,
            filter: ["any", ["==", ["geometry-type"], "Polygon"], ["==", ["geometry-type"], "MultiPolygon"]],
            paint: { "line-color": "#2e7d32", "line-width": 1.2 },
        });
        map.addLayer({
            id: LAYER_POINT,
            type: "circle",
            source: SOURCE_ID,
            filter: ["==", ["geometry-type"], "Point"],
            paint: {
                "circle-radius": 5,
                "circle-color": "#2e7d32",
                "circle-opacity": 0.7,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#FFFFFF",
            },
        });

        // --- ADMIN BOUNDARIES ---
        map.addSource(ADMIN_SOURCE_ID, { type: "geojson", data: adminFcRef.current as any });
        map.addLayer({
            id: ADMIN_LAYER_LINE,
            type: "line",
            source: ADMIN_SOURCE_ID,
            paint: { "line-color": "#78909c", "line-width": 1.5, "line-dasharray": [4, 2], "line-opacity": 0.6 },
        });
        map.addLayer({
            id: ADMIN_LAYER_LABEL,
            type: "symbol",
            source: ADMIN_SOURCE_ID,
            layout: { "text-field": ["get", "name"], "text-size": 14, "text-anchor": "center", "text-allow-overlap": false },
            paint: { "text-color": "#546e7a", "text-halo-color": "#FFFFFF", "text-halo-width": 1.5 },
        });

        // --- ZONES ---
        map.addSource(ZONE_SOURCE_ID, { type: "geojson", data: zonesFcRef.current as any });
        map.addLayer({
            id: ZONE_LAYER_FILL,
            type: "fill",
            source: ZONE_SOURCE_ID,
            filter: ["any", ["==", ["geometry-type"], "Polygon"], ["==", ["geometry-type"], "MultiPolygon"]],
            paint: { "fill-color": "#00695c", "fill-opacity": 0.15 },
        });
        map.addLayer({
            id: ZONE_LAYER_LINE,
            type: "line",
            source: ZONE_SOURCE_ID,
            filter: ["any", ["==", ["geometry-type"], "Polygon"], ["==", ["geometry-type"], "MultiPolygon"]],
            paint: { "line-color": "#00695c", "line-width": 2.5, "line-opacity": 1 },
        });

        // --- HIGHLIGHT ---
        map.addSource(HIGHLIGHT_SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
            id: HIGHLIGHT_LAYER_LINE,
            type: "line",
            source: HIGHLIGHT_SOURCE_ID,
            paint: { "line-color": "#1565c0", "line-width": 2.5, "line-opacity": 0.9 },
        });
    }

    // =====================================================
    // Map initialization
    // =====================================================
    useEffect(() => {
        if (!mapDivRef.current) return;
        if (mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapDivRef.current,
            style: STYLE_URLS[mapStyle],
            center: [initial.lng, initial.lat],
            zoom: initial.zoom,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
        mapRef.current = map;

        map.on("load", () => {
            addAllSourcesAndLayers(map);
            registerClickHandler(map);
            registerHoverHandlers(map);

            mapReadyRef.current = true;
            loadZonage();
            loadViewportLayers();
        });

        return () => {
            map.remove();
            mapRef.current = null;
            mapReadyRef.current = false;
        };
    }, [initial]);

    // Click handler — extracted so it can be re-registered after style change
    function registerClickHandler(map: maplibregl.Map) {
        map.on("click", (e) => {
            const highlightFeature = (geometry: any) => {
                const highlightSrc = map.getSource(HIGHLIGHT_SOURCE_ID) as maplibregl.GeoJSONSource;
                if (highlightSrc && geometry) {
                    highlightSrc.setData({
                        type: "FeatureCollection",
                        features: [{ type: "Feature", properties: {}, geometry: JSON.parse(JSON.stringify(geometry)) }],
                    });
                }
            };

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
                setSidebarSelection({ type: "building", properties: f.properties || {}, geometry: f.geometry, lngLat });
                return;
            }

            const zoneFeats = map.queryRenderedFeatures(e.point, {
                layers: [ZONE_LAYER_FILL, ZONE_LAYER_LINE],
            });

            if (zoneFeats.length > 0) {
                const zoneFeature: any = zoneFeats[0];
                highlightFeature(zoneFeature.geometry);
                setSelectedFeatureId(zoneFeature.id);
                setSidebarSelection({ type: "zone", properties: zoneFeature.properties || {}, geometry: zoneFeature.geometry });
                return;
            }

            closeSidebar();
        });
    }

    function registerHoverHandlers(map: maplibregl.Map) {
        map.on("mouseenter", LAYER_POLY, () => {
            map.getCanvas().style.cursor = "pointer";
            map.setPaintProperty(LAYER_POLY, "fill-opacity", 0.35);
        });
        map.on("mouseleave", LAYER_POLY, () => {
            map.getCanvas().style.cursor = "";
            map.setPaintProperty(LAYER_POLY, "fill-opacity", 0.15);
        });
        map.on("mouseenter", ZONE_LAYER_FILL, () => {
            map.getCanvas().style.cursor = "pointer";
            map.setPaintProperty(ZONE_LAYER_FILL, "fill-opacity", 0.25);
        });
        map.on("mouseleave", ZONE_LAYER_FILL, () => {
            map.getCanvas().style.cursor = "";
            map.setPaintProperty(ZONE_LAYER_FILL, "fill-opacity", 0.15);
        });
    }

    // =====================================================
    // Sync GeoJSON sources when state changes
    // =====================================================
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (src) src.setData(fc as any);
    }, [fc]);

    // zonesFc and adminBoundariesFc are synced via their filtered display effects below

    // =====================================================
    // Load admin boundaries + arrondissement refs on mount
    // =====================================================
    useEffect(() => {
        fetchAdminBoundariesGeoJson()
            .then(setAdminBoundariesFc)
            .catch((err) => console.warn("Failed to load admin boundaries:", err));
        fetchArrondissementRefs()
            .then((refs) => {
                refs.sort((a, b) => a.nomOfficiel.localeCompare(b.nomOfficiel));
                setArrondissementRefs(refs);
            })
            .catch((err) => console.warn("Failed to load arrondissement refs:", err));
    }, []);

    // =====================================================
    // Zonage loading (full Montreal bbox, loaded once)
    // =====================================================
    const zonageLoadedRef = useRef(false);
    async function loadZonage() {
        const params: SearchParams = {
            minLng: -73.98,
            minLat: 45.40,
            maxLng: -73.47,
            maxLat: 45.70,
        };
        try {
            const zones = await fetchZonesGeoJson(params);
            setZonesFc(zones);
            zonageLoadedRef.current = true;
        } catch (e: any) {
            console.error("Failed to load zonage:", e);
        }
    }

    // =====================================================
    // Load buildings based on viewport
    // =====================================================
    async function loadViewportLayers() {
        const map = mapRef.current;
        if (!map) return;

        const zoom = map.getZoom();
        const b = map.getBounds();
        const currentFetchId = ++fetchIdRef.current;

        const viewportParams: SearchParams = {
            minLng: round(b.getWest()),
            minLat: round(b.getSouth()),
            maxLng: round(b.getEast()),
            maxLat: round(b.getNorth()),
            borough: selectedArrondissement?.codeRem ?? undefined,
        };

        const shouldLoadBuildings = zoom >= BUILDINGS_ZOOM_THRESHOLD;

        setLoading(true);
        setError(null);

        try {
            const buildings = shouldLoadBuildings
                ? await fetchBuildingsGeoJson(viewportParams)
                : EMPTY_FC;

            if (currentFetchId !== fetchIdRef.current) return;
            setFc(buildings);
        } catch (e: any) {
            if (currentFetchId !== fetchIdRef.current) return;
            setError(e?.message ?? "Unknown error");
            setFc(EMPTY_FC);
        } finally {
            if (currentFetchId === fetchIdRef.current) {
                setLoading(false);
            }
        }
    }

    // =====================================================
    // Arrondissement selection handler
    // =====================================================
    function handleArrondissementChange(code3l: string) {
        if (!code3l) {
            // "All" selected — clear everything
            setSelectedArrondissement(null);
            setZoneCodes([]);
            setSelectedZoneCode(null);
            // Reset to full Montreal view
            const map = mapRef.current;
            if (map) {
                map.flyTo({ center: [initial.lng, initial.lat], zoom: initial.zoom });
            }
            return;
        }

        const ref = arrondissementRefs.find((r) => r.code3l === code3l);
        if (!ref) return;

        setSelectedArrondissement(ref);
        setSelectedZoneCode(null);

        // Fetch zone codes for this arrondissement
        fetchZoneCodesByArrondissement(ref.code3l)
            .then(setZoneCodes)
            .catch((err) => {
                console.warn("Failed to load zone codes:", err);
                setZoneCodes([]);
            });

        // Fly to arrondissement bounds using admin boundary geometry
        const feature = adminBoundariesFc.features.find(
            (f) => f.properties?.code_3c === ref.code3l
        );
        if (feature && mapRef.current) {
            const bounds = getBoundsFromGeometry(feature.geometry);
            if (bounds) {
                mapRef.current.fitBounds(bounds, { padding: 40 });
            }
        }
    }

    // Trigger reload when arrondissement changes
    useEffect(() => {
        if (!mapReadyRef.current) return;
        loadViewportLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedArrondissement]);

    // =====================================================
    // Zone code selection — client-side filter of zonage
    // =====================================================
    const displayedZonesFc = useMemo<FeatureCollection>(() => {
        let features = zonesFc.features;

        // No arrondissement selected — show all zones
        if (!selectedArrondissement) return zonesFc;

        // Filter by arrondissement — only show zones whose code is in the fetched set
        if (zoneCodes.length > 0) {
            const codeSet = new Set(zoneCodes);
            features = features.filter((f) => codeSet.has(f.properties?.zoneCode));
        } else {
            // Zone codes still loading — show nothing yet
            features = [];
        }

        // Further filter by specific zone code
        if (selectedZoneCode) {
            features = features.filter((f) => f.properties?.zoneCode === selectedZoneCode);
        }

        return { type: "FeatureCollection", features };
    }, [zonesFc, selectedArrondissement, zoneCodes, selectedZoneCode]);

    // Push filtered zones to map source + keep ref in sync for style changes
    useEffect(() => {
        zonesFcRef.current = displayedZonesFc;
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource(ZONE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (src) src.setData(displayedZonesFc as any);
    }, [displayedZonesFc]);

    // =====================================================
    // Admin boundaries — filter to selected arrondissement
    // =====================================================
    const displayedAdminFc = useMemo<FeatureCollection>(() => {
        if (!selectedArrondissement) return EMPTY_FC;
        return {
            type: "FeatureCollection",
            features: adminBoundariesFc.features.filter(
                (f) => f.properties?.code_3c === selectedArrondissement.code3l
            ),
        };
    }, [adminBoundariesFc, selectedArrondissement]);

    // Push filtered admin boundaries to map source + keep ref in sync for style changes
    useEffect(() => {
        adminFcRef.current = displayedAdminFc;
        const map = mapRef.current;
        if (!map) return;
        const src = map.getSource(ADMIN_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        if (src) src.setData(displayedAdminFc as any);
    }, [displayedAdminFc]);

    // =====================================================
    // Map style switching
    // =====================================================
    function handleMapStyleChange(style: MapStyle) {
        setMapStyle(style);
        const map = mapRef.current;
        if (!map) return;

        map.setStyle(STYLE_URLS[style]);
        map.once("style.load", () => {
            addAllSourcesAndLayers(map);
            registerClickHandler(map);
            registerHoverHandlers(map);
        });
    }

    // =====================================================
    // Auto-reload on viewport move (debounced)
    // =====================================================
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        let t: any;
        const handler = () => {
            clearTimeout(t);
            t = setTimeout(() => loadViewportLayers(), 400);
        };

        map.on("moveend", handler);
        return () => {
            clearTimeout(t);
            map.off("moveend", handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedArrondissement]);

    // =====================================================
    // Render
    // =====================================================
    return (
        <div className="grid grid-cols-[280px_1fr] h-[calc(100vh-16px)] gap-3 p-2">
            {/* Left panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                {/* Title */}
                <div className="px-4 py-4 border-b border-gray-200 shrink-0">
                    <h1 className="text-lg font-bold text-gray-900">Montreal Map</h1>
                </div>

                {/* Dropdowns */}
                <div className="flex-1 px-4 py-4 space-y-5">
                    {/* Arrondissement select */}
                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Arrondissement
                        </span>
                        <select
                            value={selectedArrondissement?.code3l ?? ""}
                            onChange={(e) => handleArrondissementChange(e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">All</option>
                            {arrondissementRefs.map((ref) => (
                                <option key={ref.code3l} value={ref.code3l}>
                                    {ref.nomOfficiel}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Zonage select */}
                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Zonage
                        </span>
                        <select
                            value={selectedZoneCode ?? ""}
                            onChange={(e) => setSelectedZoneCode(e.target.value || null)}
                            disabled={!selectedArrondissement}
                            className={[
                                "mt-1 w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                                selectedArrondissement
                                    ? "text-gray-900 bg-white border-gray-300"
                                    : "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed",
                            ].join(" ")}
                        >
                            <option value="">All zones</option>
                            {zoneCodes.map((code) => (
                                <option key={code} value={code}>
                                    {code}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Map style select */}
                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Map Style
                        </span>
                        <select
                            value={mapStyle}
                            onChange={(e) => handleMapStyleChange(e.target.value as MapStyle)}
                            className="mt-1 w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="positron">Positron</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="streets">Streets</option>
                        </select>
                    </label>
                </div>

                {/* Stats footer */}
                <div className="px-4 py-3 border-t border-gray-200 shrink-0">
                    <p className="text-xs text-gray-500">
                        {loading
                            ? "Loading..."
                            : `Buildings: ${fc.features.length} | Zones: ${displayedZonesFc.features.length}`}
                    </p>
                    {fc.features.length === 0 && !loading && (
                        <p className="text-xs text-gray-400 mt-1">
                            {mapRef.current && mapRef.current.getZoom() < BUILDINGS_ZOOM_THRESHOLD
                                ? "Zoom in to see buildings"
                                : "No buildings in current view"}
                        </p>
                    )}
                    {error && (
                        <p className="text-xs text-red-600 mt-1">Error: {error}</p>
                    )}
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

// Helper: compute LngLatBounds from a GeoJSON geometry
function getBoundsFromGeometry(
    geometry: any
): [[number, number], [number, number]] | null {
    const coords: number[][] = [];

    function collectCoords(obj: any) {
        if (Array.isArray(obj) && typeof obj[0] === "number") {
            coords.push(obj as number[]);
        } else if (Array.isArray(obj)) {
            for (const item of obj) collectCoords(item);
        }
    }

    collectCoords(geometry.coordinates);
    if (coords.length === 0) return null;

    let minLng = Infinity,
        minLat = Infinity,
        maxLng = -Infinity,
        maxLat = -Infinity;
    for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }

    return [
        [minLng, minLat],
        [maxLng, maxLat],
    ];
}
