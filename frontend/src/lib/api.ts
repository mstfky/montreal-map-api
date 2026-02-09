export type FeatureCollection = {
    type: "FeatureCollection";
    features: Feature[];
};

export type Feature = {
    type: "Feature";
    id: string;
    geometry: {
        type: "Point" | "Polygon" | "MultiPolygon";
        coordinates: any;
    };
    properties: Record<string, any>;
};

export type SearchParams = {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    neighborhood?: string;
    buildingType?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minFloors?: number;
    maxFloors?: number;
    arrondissements?: string[];
};

function toQuery(params: SearchParams) {
    const sp = new URLSearchParams();
    sp.set("minLng", String(params.minLng));
    sp.set("minLat", String(params.minLat));
    sp.set("maxLng", String(params.maxLng));
    sp.set("maxLat", String(params.maxLat));

    if (params.neighborhood) sp.set("neighborhood", params.neighborhood);
    if (params.buildingType) sp.set("buildingType", params.buildingType);
    if (params.minYearBuilt != null) sp.set("minYearBuilt", String(params.minYearBuilt));
    if (params.maxYearBuilt != null) sp.set("maxYearBuilt", String(params.maxYearBuilt));
    if (params.minFloors != null) sp.set("minFloors", String(params.minFloors));
    if (params.maxFloors != null) sp.set("maxFloors", String(params.maxFloors));
    if (params.arrondissements) {
        params.arrondissements.forEach((a) => sp.append("arrondissements", a));
    }
    return sp.toString();
}

export async function fetchBuildingsGeoJson(params: SearchParams): Promise<FeatureCollection> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const qs = toQuery(params);

    const res = await fetch(`${base}/api/buildings/search/geojsonsearch-polygons?${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

export type ZonageResponse = {
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

export async function fetchZonageAtPoint(
    lng: number,
    lat: number
): Promise<ZonageResponse | null> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const res = await fetch(
        `${base}/api/zonage/at-point?lng=${encodeURIComponent(lng)}&lat=${encodeURIComponent(lat)}`,
        { cache: "no-store" }
    );

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Zonage fetch failed: ${res.status}`);
    return res.json();
}

export async function fetchArrondissements(): Promise<string[]> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const res = await fetch(`${base}/api/zonage/arrondissements`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Arrondissements fetch failed: ${res.status}`);
    return res.json();
}

export async function fetchZonesGeoJson(params: SearchParams): Promise<FeatureCollection> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const qs = toQuery(params);
    const res = await fetch(`${base}/api/zonage/search/geojson?${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Zones API error: ${res.status}`);
    return res.json();
}

export type BboxParams = {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
};

export async function fetchLandUseGeoJson(params: BboxParams): Promise<FeatureCollection> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const sp = new URLSearchParams();
    sp.set("minLng", String(params.minLng));
    sp.set("minLat", String(params.minLat));
    sp.set("maxLng", String(params.maxLng));
    sp.set("maxLat", String(params.maxLat));
    const res = await fetch(`${base}/api/land-use/search/geojson?${sp.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Land Use API error: ${res.status}`);
    return res.json();
}

export async function fetchAdminBoundariesGeoJson(): Promise<FeatureCollection> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const res = await fetch(`${base}/api/admin-boundaries/all/geojson`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Admin Boundaries API error: ${res.status}`);
    return res.json();
}
