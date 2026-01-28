"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    fetchBuildingsGeoJson,
    FeatureCollection,
    SearchParams,
    // fetchZonageAtPoint, // <-- bunu import etme ya da aşağıdaki local fonksiyonu kaldır
    fetchZonesGeoJson, // ✅ bunu lib/api.ts'e eklemen gerekiyor
} from "@/lib/api";

const SOURCE_ID = "buildings";
const LAYER_POINT = "buildings-point";
const LAYER_POLY = "buildings-poly";

const ZONE_SOURCE_ID = "zones";
const ZONE_LAYER_FILL = "zones-fill";
const ZONE_LAYER_LINE = "zones-line";

type Filters = {
    neighborhood?: string;
    buildingType?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minFloors?: number;
    maxFloors?: number;
};

type ZonageResponse = {
    id: number;
    zoneCode?: string;
    arrondissement?: string;
    district?: string;
    secteur?: string;
    classe1?: string;
    classe2?: string;
    classe3?: string;
    classe4?: string;
    classe5?: string;
    classe6?: string;
    etageMin?: number;
    etageMax?: number;
    densiteMin?: number;
    densiteMax?: number;
    tauxMin?: number;
    tauxMax?: number;
    note?: string;
    info?: string;
};

function round(n: number) {
    return Math.round(n * 1e6) / 1e6;
}

function esc(s: any) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function fmt(n: any) {
    if (n === null || n === undefined || n === "") return "-";
    if (typeof n === "number") return Number.isFinite(n) ? String(n) : "-";
    return String(n);
}

// ✅ isim çakışmasını engellemek için rename ettim
async function fetchZonageAtPointApi(lng: number, lat: number): Promise<ZonageResponse | null> {
    const res = await fetch(
        `/api/zonage/at-point?lng=${encodeURIComponent(lng)}&lat=${encodeURIComponent(lat)}`
    );
    if (!res.ok) return null;
    return (await res.json()) as ZonageResponse;
}

export default function BuildingsMap() {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapDivRef = useRef<HTMLDivElement | null>(null);

    const [fc, setFc] = useState<FeatureCollection>({ type: "FeatureCollection", features: [] });
    const [zonesFc, setZonesFc] = useState<FeatureCollection>({
        type: "FeatureCollection",
        features: [],
    });

    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({});
    const [loading, setLoading] = useState(false);

    // Initial view: Montreal
    const initial = useMemo(() => ({ lng: -73.5673, lat: 45.5017, zoom: 12 }), []);

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
                    "fill-color": "#ff0000",
                    "fill-opacity": 0.4,
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
                    "line-color": "#000000",
                    "line-width": 2,
                },
            });

            map.addLayer({
                id: LAYER_POINT,
                type: "circle",
                source: SOURCE_ID,
                filter: ["==", ["geometry-type"], "Point"],
                paint: {
                    "circle-radius": 6,
                    "circle-color": "#000",
                    "circle-opacity": 0.9,
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#fff",
                },
            });

            // ======================
            // ZONES SOURCE + LAYERS ✅
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
                    "fill-color": "#00ffff",
                    "fill-opacity": 0.15,
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
                    "line-color": "#00ffff",
                    "line-width": 1,
                },
            });

            // Click popup (+ zonage lookup)
            map.on("click", async (e) => {
                const feats = map.queryRenderedFeatures(e.point, {
                    layers: [LAYER_POLY, `${LAYER_POLY}-outline`, LAYER_POINT],
                });

                if (!feats.length) return;

                const poly = feats.find(
                    (f: any) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"
                );
                const point = feats.find((f: any) => f.geometry?.type === "Point");
                const f: any = poly ?? point;
                if (!f) return;

                const props = f.properties || {};

                const lngLat =
                    f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates)
                        ? { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }
                        : e.lngLat;

                // ZONAGE CALL
                let zonage: ZonageResponse | null = null;
                try {
                    zonage = await fetchZonageAtPointApi(lngLat.lng, lngLat.lat);
                } catch (err) {
                    console.warn("Zonage lookup failed", err);
                }

                const html = `
          <div style="font-size:12px">
            <div><b>${esc(props.address ?? f.id ?? "")}</b></div>
            <div>${esc(props.neighborhood ?? "")}</div>
            <div>${esc(props.buildingType ?? "")} | floors: ${esc(props.floors ?? "")}</div>
            <div>year: ${esc(props.yearBuilt ?? "")}</div>
            <hr/>
            <div><b>Zonage:</b> ${esc(zonage?.zoneCode ?? "N/A")}</div>
            <div><b>Max floors:</b> ${esc(fmt(zonage?.etageMax))}</div>
            <div><b>Densité max:</b> ${esc(fmt(zonage?.densiteMax))}</div>
          </div>
        `;

                new maplibregl.Popup({ closeButton: true, closeOnClick: true })
                    .setLngLat(lngLat as any)
                    .setHTML(html)
                    .addTo(map);
            });

            runSearchFromCurrentBbox();
        });

        return () => {
            map.remove();
            mapRef.current = null;
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

    async function runSearchFromCurrentBbox() {
        const map = mapRef.current;
        if (!map) return;

        const b = map.getBounds();
        const params: SearchParams = {
            minLng: round(b.getWest()),
            minLat: round(b.getSouth()),
            maxLng: round(b.getEast()),
            maxLat: round(b.getNorth()),
            ...filters,
        };

        setLoading(true);
        setError(null);

        try {
            const [buildings, zones] = await Promise.all([
                fetchBuildingsGeoJson(params),
                fetchZonesGeoJson(params),
            ]);

            setFc(buildings);
            setZonesFc(zones);
        } catch (e: any) {
            setError(e?.message ?? "Unknown error");
            setFc({ type: "FeatureCollection", features: [] });
            setZonesFc({ type: "FeatureCollection", features: [] });
        } finally {
            setLoading(false);
        }
    }

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
    }, [filters]);

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                height: "calc(100vh - 16px)",
                gap: 12,
                padding: 8,
            }}
        >
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, overflow: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 700 }}>Search Filters</div>
                    <button onClick={runSearchFromCurrentBbox} style={{ padding: "6px 10px" }}>
                        Search
                    </button>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    <label>
                        Neighborhood
                        <input
                            value={filters.neighborhood ?? ""}
                            onChange={(e) => setFilters((p) => ({ ...p, neighborhood: e.target.value || undefined }))}
                            style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
                            placeholder="Ville-Marie"
                        />
                    </label>

                    <label>
                        Building Type
                        <input
                            value={filters.buildingType ?? ""}
                            onChange={(e) => setFilters((p) => ({ ...p, buildingType: e.target.value || undefined }))}
                            style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
                            placeholder="Residential"
                        />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <label>
                            Min Year
                            <input
                                type="number"
                                value={filters.minYearBuilt ?? ""}
                                onChange={(e) =>
                                    setFilters((p) => ({
                                        ...p,
                                        minYearBuilt: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
                            />
                        </label>
                        <label>
                            Max Year
                            <input
                                type="number"
                                value={filters.maxYearBuilt ?? ""}
                                onChange={(e) =>
                                    setFilters((p) => ({
                                        ...p,
                                        maxYearBuilt: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
                            />
                        </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <label>
                            Min Floors
                            <input
                                type="number"
                                value={filters.minFloors ?? ""}
                                onChange={(e) =>
                                    setFilters((p) => ({
                                        ...p,
                                        minFloors: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
                            />
                        </label>
                        <label>
                            Max Floors
                            <input
                                type="number"
                                value={filters.maxFloors ?? ""}
                                onChange={(e) =>
                                    setFilters((p) => ({
                                        ...p,
                                        maxFloors: e.target.value ? Number(e.target.value) : undefined,
                                    }))
                                }
                                style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
                            />
                        </label>
                    </div>

                    <button onClick={() => setFilters({})} style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 10 }}>
                        Clear Filters
                    </button>

                    <div style={{ marginTop: 6, fontSize: 12 }}>
                        {loading ? "Loading..." : `Buildings: ${fc.features.length} | Zones: ${zonesFc.features.length}`}
                        {error ? <div style={{ marginTop: 6 }}>Error: {error}</div> : null}
                    </div>
                </div>
            </div>

            <div ref={mapDivRef} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ddd" }} />
        </div>
    );
}
