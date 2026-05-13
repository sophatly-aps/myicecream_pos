import { useState } from "react";
import { router } from "@inertiajs/react";
import { route } from "ziggy-js";

import { useTranslation } from "react-i18next";



export default function DateFilter({ routeName }: { routeName: string }) {

    const { t } = useTranslation();
    const ranges = [
        { label: t("dashboard.All"), value: "all" },
        { label: t("dashboard.Today"), value: "today" },
        { label: t("dashboard.Last Week"), value: "last_week" },
        { label: t("dashboard.This Month"), value: "this_month" },
        { label: t("dashboard.Last Month"), value: "last_month" },
        { label: t("dashboard.Custom"), value: "custom" }
    ];

    const [active, setActive] = useState("today");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");



    const applyFilter = (range: string) => {
        setActive(range);
        if (range === "all") {
            router.get(route(routeName), {
                range: "all"
            }, {
                preserveState: true,
                replace: true
            });
            return;
        }

        if (range === "today" || range === "last_week" || range === "this_month" || range === "last_month") {
            router.get(route(routeName), {
                range
            }, {
                preserveState: true,
                replace: true
            });
            return;
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Segmented Control */}
            <div className="flex bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
                {ranges.map((r) => (
                    <button
                        key={r.value}
                        onClick={() => applyFilter(r.value)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-all
                        ${active === r.value
                                ? "bg-white dark:bg-neutral-900 shadow text-slate-900 dark:text-white"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Custom Date Inputs */}
            {active === "custom" && (
                <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-2 py-1 shadow-sm">
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="text-sm bg-transparent outline-none"
                    />

                    <span className="text-slate-400 text-sm">—</span>

                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="text-sm bg-transparent outline-none"
                    />

                    <button
                        onClick={() => {
                            router.get(route(routeName), { from, to }, { preserveState: true });
                        }}
                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}