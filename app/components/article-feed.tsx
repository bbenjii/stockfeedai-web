import {useEffect, useMemo, useRef, useState} from "react";
import {Input} from "@/components/ui/input";
import {ArticleCard} from "@/components/article";
import {Skeleton} from "@/components/ui/skeleton"
import {Button} from "@/components/ui/button";
import {
    DEFAULT_ARTICLE_FILTERS,
    getArticles,
    type ArticleFilters,
} from "@/lib/api";
import type {Article} from "@/components/article";


export default function ArticleFeed({
    symbol = null,
    show_filters = true,
    initialArticles = [],
} : {
    symbol?: string | null,
    show_filters?: boolean,
    initialArticles?: Article[],
}) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [filters, setFilters] = useState<ArticleFilters>(DEFAULT_ARTICLE_FILTERS);
    const [isLoading, setIsLoading] = useState(initialArticles.length === 0);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const hasHydratedInitialData = useRef(initialArticles.length > 0);
    const hasRenderedContent = articles.length > 0;
    const isInitialLoading = isLoading && !hasRenderedContent;
    const isRefreshing = isLoading && hasRenderedContent;

    const sectorOptions = useMemo(() => {
        const set = new Set<string>();
        for (const a of articles ?? []) {
            (a?.sectors ?? []).forEach((s: string) => s && set.add(s));
        }
        return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [articles]);


    useEffect(() => {
        setArticles(initialArticles);
        setIsLoading(initialArticles.length === 0);
        setError(null);
        hasHydratedInitialData.current = initialArticles.length > 0;
    }, [initialArticles]);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (hasHydratedInitialData.current) {
                hasHydratedInitialData.current = false;
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const nextArticles = await getArticles(filters, {symbol});
                if (!cancelled) {
                    setArticles(nextArticles as Article[]);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(error instanceof Error ? error.message : "Failed to load articles");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [symbol, refreshKey]);

    useEffect(() => {
        let cancelled = false;
        const t = setTimeout(() => {
            if (hasHydratedInitialData.current) {
                hasHydratedInitialData.current = false;
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            getArticles(filters, {symbol})
                .then((nextArticles) => {
                    if (!cancelled) {
                        setArticles(nextArticles as Article[]);
                    }
                })
                .catch((error) => {
                    if (!cancelled) {
                        setError(error instanceof Error ? error.message : "Failed to load articles");
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setIsLoading(false);
                    }
                });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [filters, symbol, refreshKey]);


    return (
        <div className={"flex flex-col gap-5"}>

            {/* Filter bar (matches current style) */}
            {show_filters &&
                <FilterBar filters={filters} setFilters={setFilters} sectorOptions={sectorOptions}/>}

            {/* Articles list */}

            {isRefreshing ? (
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
                    Updating articles…
                </div>
            ) : null}

            {error && !hasRenderedContent ? (
                <FeedErrorState
                    message={error}
                    onRetry={() => setRefreshKey((value) => value + 1)}
                />
            ) : null}

            {articles.length > 0 ? (
                articles.map((article, index) => {
                    return (
                        <ArticleCard key={article.url ?? index} index={index} article={article}/>
                    );
                })
            ) : isInitialLoading ? (
                <FeedLoadingState />
            ) : error ? (
                <FeedErrorState
                    message={error}
                    onRetry={() => setRefreshKey((value) => value + 1)}
                />
            ) : (
                <FeedEmptyState filters={filters} symbol={symbol} />
            )}

        </div>
    )
}

function FeedLoadingState() {
    return (
        <div className="flex flex-col gap-4">
            {Array.from({length: 3}).map((_, index) => (
                <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <Skeleton className="mb-3 h-4 w-20 bg-background-1" />
                    <Skeleton className="mb-2 h-5 w-3/4 bg-background-1" />
                    <Skeleton className="h-4 w-1/2 bg-background-1" />
                </div>
            ))}
        </div>
    );
}

function FeedEmptyState({filters, symbol}: {filters: ArticleFilters; symbol?: string | null}) {
    const hasActiveFilters =
        Boolean(filters.search.trim()) ||
        filters.timeRange !== DEFAULT_ARTICLE_FILTERS.timeRange ||
        filters.sentiment !== DEFAULT_ARTICLE_FILTERS.sentiment ||
        filters.sector !== DEFAULT_ARTICLE_FILTERS.sector ||
        filters.onlyWithTickers !== DEFAULT_ARTICLE_FILTERS.onlyWithTickers;

    return (
        <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-gray-300">
            <p className="font-medium text-white">
                {symbol ? `No recent articles found for ${symbol}.` : "No articles matched the current filters."}
            </p>
            <p className="mt-2 text-sm text-gray-400">
                {hasActiveFilters
                    ? "Try widening the time range or removing some filters."
                    : "New stories will appear here once the backend returns matching coverage."}
            </p>
        </div>
    );
}

function FeedErrorState({message, onRetry}: {message: string; onRetry: () => void}) {
    return (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-gray-200">
            <p className="font-medium text-white">Unable to load articles.</p>
            <p className="mt-2 text-sm text-gray-300">{message}</p>
            <Button
                onClick={onRetry}
                className="mt-4 rounded-2xl bg-white text-black hover:bg-gray-200"
                type="button"
            >
                Try again
            </Button>
        </div>
    );
}


function FilterBar({filters, setFilters, sectorOptions}: {
    filters: ArticleFilters;
    setFilters: React.Dispatch<React.SetStateAction<ArticleFilters>>;
    sectorOptions: string[]
}) {
    return (
        <div className=" border border-gray-800 rounded-lg p-4">
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
                            onChange={(e) => setFilters((p) => ({...p, sentiment: e.target.value as ArticleFilters["sentiment"]}))}
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
