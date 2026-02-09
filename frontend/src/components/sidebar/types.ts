import type { ZonageResponse } from "@/lib/api";

export type BuildingSelection = {
    type: "building";
    properties: Record<string, any>;
    geometry: any;
    lngLat: { lng: number; lat: number };
};

export type ZoneSelection = {
    type: "zone";
    properties: Record<string, any>;
    geometry: any;
};

export type LandUseSelection = {
    type: "landuse";
    properties: Record<string, any>;
    geometry: any;
};

export type SidebarSelection = BuildingSelection | ZoneSelection | LandUseSelection;

export function fmt(n: any): string {
    if (n === null || n === undefined || n === "") return "\u2014";
    if (typeof n === "number") return Number.isFinite(n) ? String(n) : "\u2014";
    return String(n);
}

export type { ZonageResponse };
