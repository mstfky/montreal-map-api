import { fmt } from "./types";
import type { ZonageResponse } from "./types";

type Props = {
    properties: Record<string, any>;
    lngLat: { lng: number; lat: number };
    zonageData: ZonageResponse | null;
    zonageLoading: boolean;
    zonageError: string | null;
    onRetryZonage: () => void;
};

export default function BuildingDetail({
    properties,
    lngLat,
    zonageData,
    zonageLoading,
    zonageError,
    onRetryZonage,
}: Props) {
    const p = properties;

    return (
        <div className="space-y-4">
            {/* Building info */}
            <section>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Building
                </h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed text-gray-700 [&>dd]:font-medium">
                    <dt className="text-gray-400">Address</dt>
                    <dd>{fmt(p.address)}</dd>

                    <dt className="text-gray-400">Neighborhood</dt>
                    <dd>{fmt(p.neighborhood)}</dd>

                    <dt className="text-gray-400">Type</dt>
                    <dd>{fmt(p.buildingType)}</dd>

                    <dt className="text-gray-400">Year Built</dt>
                    <dd>{fmt(p.yearBuilt)}</dd>

                    <dt className="text-gray-400">Floors</dt>
                    <dd>{fmt(p.floors)}</dd>

                    <dt className="text-gray-400">Units</dt>
                    <dd>{fmt(p.numUnits)}</dd>

                    <dt className="text-gray-400">Category</dt>
                    <dd>{fmt(p.category)}</dd>

                    <dt className="text-gray-400">Land Area</dt>
                    <dd>{fmt(p.landArea)}</dd>

                    <dt className="text-gray-400">Building Area</dt>
                    <dd>{fmt(p.buildingArea)}</dd>
                </dl>
            </section>

            <hr className="border-gray-200" />

            {/* Zonage section */}
            <section>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Zonage
                </h3>

                {zonageLoading && (
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                )}

                {zonageError && (
                    <div className="text-sm">
                        <p className="text-red-600 mb-2">{zonageError}</p>
                        <button
                            onClick={onRetryZonage}
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!zonageLoading && !zonageError && !zonageData && (
                    <p className="text-sm text-gray-400">No zonage data available</p>
                )}

                {!zonageLoading && !zonageError && zonageData && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed text-gray-700 [&>dd]:font-medium">
                        <dt className="text-gray-400">Zone Code</dt>
                        <dd>
                            {fmt(zonageData.zoneCode)}
                        </dd>

                        <dt className="text-gray-400">Arrondissement</dt>
                        <dd>{fmt(zonageData.arrondissement)}</dd>

                        <dt className="text-gray-400">District</dt>
                        <dd>{fmt(zonageData.district)}</dd>

                        {zonageData.secteur && (
                            <>
                                <dt className="text-gray-400">Secteur</dt>
                                <dd>{fmt(zonageData.secteur)}</dd>
                            </>
                        )}

                        {(zonageData.classe1 || zonageData.classe2 || zonageData.classe3 ||
                          zonageData.classe4 || zonageData.classe5 || zonageData.classe6) && (
                            <>
                                <dt className="text-gray-400">Classes</dt>
                                <dd>
                                    {[zonageData.classe1, zonageData.classe2, zonageData.classe3,
                                      zonageData.classe4, zonageData.classe5, zonageData.classe6]
                                        .filter(Boolean)
                                        .map((c, i) => (
                                            <div key={i}>{c}</div>
                                        ))}
                                </dd>
                            </>
                        )}

                        <dt className="text-gray-400">Floors</dt>
                        <dd>
                            {fmt(zonageData.etageMin)} — {fmt(zonageData.etageMax)}
                        </dd>

                        <dt className="text-gray-400">Densit&eacute;</dt>
                        <dd>
                            {fmt(zonageData.densiteMin)} — {fmt(zonageData.densiteMax)}
                        </dd>

                        <dt className="text-gray-400">Taux</dt>
                        <dd>
                            {fmt(zonageData.tauxMin)} — {fmt(zonageData.tauxMax)}
                        </dd>

                        {zonageData.note && (
                            <>
                                <dt className="text-gray-400">Note</dt>
                                <dd>{zonageData.note}</dd>
                            </>
                        )}

                        {zonageData.info && (
                            <>
                                <dt className="text-gray-400">Info</dt>
                                <dd>{zonageData.info}</dd>
                            </>
                        )}
                    </dl>
                )}
            </section>

            <hr className="border-gray-200" />

            {/* External link */}
            <a
                href={`https://www.google.com/maps/@${lngLat.lat},${lngLat.lng},18z`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 hover:text-blue-800 underline"
            >
                Open in Google Maps
            </a>
        </div>
    );
}
