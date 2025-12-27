import {useEffect, useMemo, useState} from "react";
import {fetch_util} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {NavLink} from "react-router";
import {ArticleCard} from "@/components/article";
import {Skeleton} from "@/components/ui/skeleton"

type Filters = {
    search: string;
    timeRange: "1h" | "4h" | "24h" | "7d";
    sentiment: "all" | "positive" | "neutral" | "negative";
    sector: "all" | string;
    onlyWithTickers: boolean;
};

function hoursFromRange(r: Filters["timeRange"]) {
    if (r === "1h") return 1;
    if (r === "4h") return 4;
    if (r === "24h") return 24;
    return 24 * 7;
}


export default function ArticleFeed({symbol = null, show_filters = true} : {symbol?: string | null, show_filters?: boolean}) {
    const [articles, setArticles] = useState<any[]>([]);
    const [filters, setFilters] = useState<Filters>({
        search: "",
        timeRange: "24h",
        sentiment: "all",
        sector: "all",
        onlyWithTickers: false,
    });

    const sectorOptions = useMemo(() => {
        const set = new Set<string>();
        for (const a of articles ?? []) {
            (a?.sectors ?? []).forEach((s: string) => s && set.add(s));
        }
        return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [articles]);


    async function getArticles(f: Filters) {
        const params = new URLSearchParams();

        if (f.search.trim()) params.set("search", f.search.trim());
        if (f.sentiment !== "all") params.set("sentiment", f.sentiment);
        if (f.sector !== "all") params.set("sectors", f.sector); // server expects comma-separated
        if (f.onlyWithTickers) params.set("only_with_tickers", "true");
        params.set("hours", String(hoursFromRange(f.timeRange)));
        params.set("limit", "100");

        if (symbol) params.set("tickers", symbol);
        const url = `/articles?${params.toString()}`;
        const result = await fetch_util(url);
        return result.articles ?? [];
    }

    // initial load
    useEffect(() => {
        getArticles(filters).then(setArticles);
    }, [symbol]);

    // debounce filters
    useEffect(() => {
        const t = setTimeout(() => {
            getArticles(filters).then(setArticles);
        }, 300);
        return () => clearTimeout(t);
    }, [filters]);


    return (
        <div className={"flex flex-col gap-5"}>

            {/* Filter bar (matches current style) */}
            {show_filters &&
                <FilterBar filters={filters} setFilters={setFilters} sectorOptions={sectorOptions}/>}

            {/* Articles list */}

            {
                articles.length > 0 ?
                    articles?.map((article, index) => {
                        return (
                            <ArticleCard key={article.url ?? index} index={index} article={article}/>
                        );
                    })
                    :
                    <Skeleton className={"w-full h-25 bg-background-1"}/>
            }
            

        </div>
    )
}


function FilterBar({filters, setFilters, sectorOptions}: {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    sectorOptions: string[]
}) {
    return (
        <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-gray-400"
                >
                    <path
                        d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>
                </svg>
                <span className="text-sm text-gray-400">Article Filter</span>
            </div>
            <div className={"mb-4"}>
                <Input
                    value={filters.search}
                    onChange={(e) => setFilters((p) => ({...p, search: e.target.value}))}
                    placeholder="Search symbol, keyword, sector ..."
                    className="rounded-3xl dark:bg-background-1"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Time range */}
                <div>
                    <label className="block text-xs text-gray-400 mb-2">Time Range</label>
                    <div className="flex gap-2 flex-wrap">
                        {(["1h", "4h", "24h", "7d"] as const).map((r) => {
                            const active = filters.timeRange === r;
                            return (
                                <button
                                    key={r}
                                    onClick={() => setFilters((p) => ({...p, timeRange: r}))}
                                    className={[
                                        "px-3 py-1.5 rounded text-sm transition-colors",
                                        active
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700",
                                    ].join(" ")}
                                    type="button"
                                >
                                    {r}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sentiment */}
                <div>
                    <label className="block text-xs text-gray-400 mb-2">Sentiment</label>
                    <select
                        value={filters.sentiment}
                        onChange={(e) => setFilters((p) => ({...p, sentiment: e.target.value as Filters["sentiment"]}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    >
                        <option value="all">All</option>
                        <option value="positive">Positive</option>
                        <option value="neutral">Neutral</option>
                        <option value="negative">Negative</option>
                    </select>
                </div>

                {/* Sector */}
                <div>
                    <label className="block text-xs text-gray-400 mb-2">Sector</label>
                    <select
                        value={filters.sector}
                        onChange={(e) => setFilters((p) => ({...p, sector: e.target.value}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    >
                        {sectorOptions.map((s) => (
                            <option key={s} value={s}>
                                {s === "all" ? "All" : s}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Only with tickers */}
                <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.onlyWithTickers}
                            onChange={(e) => setFilters((p) => ({...p, onlyWithTickers: e.target.checked}))}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                        <span className="text-sm text-gray-300">Only with tickers</span>
                    </label>
                </div>
            </div>
        </div>
    )
}