"use client";

import { useEffect, useRef } from "react";
import type { SidebarSelection, ZonageResponse } from "./types";
import BuildingDetail from "./BuildingDetail";
import ZoneDetail from "./ZoneDetail";
import LandUseDetail from "./LandUseDetail";

type Props = {
    selection: SidebarSelection | null;
    zonageData: ZonageResponse | null;
    zonageLoading: boolean;
    zonageError: string | null;
    onClose: () => void;
    onRetryZonage: () => void;
};

function getTitle(selection: SidebarSelection): string {
    switch (selection.type) {
        case "building":
            return selection.properties.address ?? "Building";
        case "zone":
            return `Zone: ${selection.properties.zoneCode ?? "N/A"}`;
        case "landuse":
            return selection.properties.affectationEn ?? selection.properties.affectation ?? "Land Use";
    }
}

function getSubtitle(selection: SidebarSelection): string | null {
    switch (selection.type) {
        case "building":
            return selection.properties.neighborhood ?? null;
        case "zone":
            return selection.properties.arrondissement ?? null;
        case "landuse":
            return null;
    }
}

export default function FeatureDetailSidebar({
    selection,
    zonageData,
    zonageLoading,
    zonageError,
    onClose,
    onRetryZonage,
}: Props) {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const isOpen = selection !== null;

    // ESC key to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Focus management: move focus to sidebar on open
    useEffect(() => {
        if (isOpen && sidebarRef.current) {
            sidebarRef.current.focus();
        }
    }, [isOpen, selection]);

    return (
        <div
            ref={sidebarRef}
            role="complementary"
            aria-label="Feature details"
            tabIndex={-1}
            className={[
                "absolute top-0 right-0 z-10 bg-white shadow-lg outline-none",
                "flex flex-col",
                // Desktop / tablet sizing
                "w-[400px] h-full max-lg:w-[340px]",
                // Mobile: bottom sheet
                "max-sm:w-full max-sm:h-[60vh] max-sm:top-auto max-sm:bottom-0 max-sm:rounded-t-2xl",
                // Slide animation
                "transition-transform duration-300 motion-reduce:transition-none",
                isOpen
                    ? "translate-x-0 max-sm:translate-x-0 max-sm:translate-y-0"
                    : "translate-x-full max-sm:translate-x-0 max-sm:translate-y-full",
            ].join(" ")}
        >
            {selection && (
                <>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-gray-900 truncate">
                                {getTitle(selection)}
                            </h2>
                            {getSubtitle(selection) && (
                                <p className="text-sm text-gray-500 truncate">
                                    {getSubtitle(selection)}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close details"
                            className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {selection.type === "building" && (
                            <BuildingDetail
                                properties={selection.properties}
                                lngLat={selection.lngLat}
                                zonageData={zonageData}
                                zonageLoading={zonageLoading}
                                zonageError={zonageError}
                                onRetryZonage={onRetryZonage}
                            />
                        )}
                        {selection.type === "zone" && (
                            <ZoneDetail properties={selection.properties} />
                        )}
                        {selection.type === "landuse" && (
                            <LandUseDetail properties={selection.properties} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
