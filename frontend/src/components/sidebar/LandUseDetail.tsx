import { fmt } from "./types";

type Props = {
    properties: Record<string, any>;
};

export default function LandUseDetail({ properties: p }: Props) {
    const areaSqm = p.areaSqm ? Number(p.areaSqm) : null;
    const areaKm2 = areaSqm != null && Number.isFinite(areaSqm)
        ? (areaSqm / 1_000_000).toFixed(2) + " km\u00B2"
        : "\u2014";

    return (
        <div className="space-y-4">
            <section>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Land Use
                </h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed text-gray-700 [&>dd]:font-medium">
                    <dt className="text-gray-400">Type (EN)</dt>
                    <dd>{fmt(p.affectationEn)}</dd>

                    <dt className="text-gray-400">Type (FR)</dt>
                    <dd>{fmt(p.affectation)}</dd>

                    <dt className="text-gray-400">Area</dt>
                    <dd>{areaKm2}</dd>
                </dl>
            </section>
        </div>
    );
}
