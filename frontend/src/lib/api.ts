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
    borough?: string;
};

function toQuery(params: SearchParams) {
    const sp = new URLSearchParams();
    sp.set("minLng", String(params.minLng));
    sp.set("minLat", String(params.minLat));
    sp.set("maxLng", String(params.maxLng));
    sp.set("maxLat", String(params.maxLat));

    if (params.borough) sp.set("borough", params.borough);
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

export async function fetchAdminBoundariesGeoJson(): Promise<FeatureCollection> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const res = await fetch(`${base}/api/admin-boundaries/all/geojson`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Admin Boundaries API error: ${res.status}`);
    return res.json();
}

export type ArrondissementRef = {
    id: number;
    nomOfficiel: string;
    nomAbrege: string;
    acronyme: string;
    code3l: string;
    idUadm: number;
    noArroElection: number;
    codeRem: string;
};

export async function fetchArrondissementRefs(): Promise<ArrondissementRef[]> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const res = await fetch(`${base}/api/arrondissements`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Arrondissements ref fetch failed: ${res.status}`);
    return res.json();
}

export async function fetchZoneCodesByArrondissement(code3l: string): Promise<string[]> {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const res = await fetch(
        `${base}/api/zonage/zone-codes?code3l=${encodeURIComponent(code3l)}`,
        { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Zone codes fetch failed: ${res.status}`);
    return res.json();
}
