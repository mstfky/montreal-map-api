import { fmt } from "./types";

type Props = {
    properties: Record<string, any>;
};

export default function ZoneDetail({ properties: p }: Props) {
    return (
        <div className="space-y-4">
            <section>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Location
                </h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed text-gray-700 [&>dd]:font-medium">
                    <dt className="text-gray-400">Arrondissement</dt>
                    <dd>{fmt(p.arrondissement)}</dd>

                    <dt className="text-gray-400">District</dt>
                    <dd>{fmt(p.district)}</dd>

                    <dt className="text-gray-400">Secteur</dt>
                    <dd>{fmt(p.secteur)}</dd>
                </dl>
            </section>

            {(p.classe1 || p.classe2 || p.classe3 || p.classe4 || p.classe5 || p.classe6) && (
                <>
                    <hr className="border-gray-200" />
                    <section>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Classes
                        </h3>
                        <ul className="text-sm text-gray-700 font-medium leading-relaxed space-y-0.5">
                            {[p.classe1, p.classe2, p.classe3, p.classe4, p.classe5, p.classe6]
                                .filter(Boolean)
                                .map((c, i) => (
                                    <li key={i}>{c}</li>
                                ))}
                        </ul>
                    </section>
                </>
            )}

            <hr className="border-gray-200" />

            <section>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Limits
                </h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed text-gray-700 [&>dd]:font-medium">
                    <dt className="text-gray-400">Floors</dt>
                    <dd>
                        {fmt(p.etageMin)} — {fmt(p.etageMax)}
                    </dd>

                    <dt className="text-gray-400">Densit&eacute;</dt>
                    <dd>
                        {fmt(p.densiteMin)} — {fmt(p.densiteMax)}
                    </dd>

                    <dt className="text-gray-400">Taux</dt>
                    <dd>
                        {fmt(p.tauxMin)} — {fmt(p.tauxMax)}
                    </dd>
                </dl>
            </section>

            {(p.note || p.info) && (
                <>
                    <hr className="border-gray-200" />
                    <section>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Notes
                        </h3>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed text-gray-700 [&>dd]:font-medium">
                            {p.note && (
                                <>
                                    <dt className="text-gray-400">Note</dt>
                                    <dd>{p.note}</dd>
                                </>
                            )}
                            {p.info && (
                                <>
                                    <dt className="text-gray-400">Info</dt>
                                    <dd>{p.info}</dd>
                                </>
                            )}
                        </dl>
                    </section>
                </>
            )}
        </div>
    );
}
