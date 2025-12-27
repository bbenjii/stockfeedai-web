import React, { useMemo } from "react";

import { SentimentBadge } from "@/components/sentiment-badge"; // adjust path
import { extractSlug, sourceFromUrl, timeFromIso } from "@/lib/utils";
import type {Article} from "@/components/article"; // adjust path

function formatScore(v?: number | null, digits = 2) {
    if (v === null || v === undefined || Number.isNaN(v)) return null;
    return Number(v).toFixed(digits);
}

function humanizeImportance(score?: number | null) {
    if (score === null || score === undefined || Number.isNaN(score)) return null;
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    if (score > 0) return "Low";
    return "Low";
}

function EntriesList({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className="text-sm text-gray-400">{title}</h4>
            <div className="text-gray-200">{children}</div>
        </div>
    );
}

function Reasoning({ text }: { text?: string | null }) {
    if (!text) return null;
    return (
        <p className="text-sm text-gray-400 leading-relaxed">
            <span className="text-gray-500">Why:</span> {text}
        </p>
    );
}

function Pills({
                   items,
                   hrefPrefix,
               }: {
    items: string[];
    hrefPrefix?: string; // if provided, items become links
}) {
    if (!items.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((it, i) =>
                    hrefPrefix ? (
                        <a
                            key={`${it}-${i}`}
                            href={`${hrefPrefix}${encodeURIComponent(it)}`}
                            className="text-xs text-gray-300 bg-white/5 border border-white/10 rounded-full px-2 py-1 hover:bg-white/10 transition-colors"
                        >
                            {it}
                        </a>
                    ) : (
                        <span
                            key={`${it}-${i}`}
                            className="text-xs text-gray-300 bg-white/5 border border-white/10 rounded-full px-2 py-1"
                        >
            {it}
          </span>
                    )
            )}
        </div>
    );
}

export function ArticleFull({ article }: { article: Article }) {
    const source = article.source || sourceFromUrl(article.url);
    const when = timeFromIso(article.publish_date);
    const authors = article.authors?.filter(Boolean) ?? [];

    const tickers = article.tickers?.filter(Boolean) ?? [];
    const sectors = article.sectors?.filter(Boolean) ?? [];
    const industry = (article as any).industry?.filter?.(Boolean) ?? []; // supports old articles gracefully
    const keywords =
        (article as any).keywords?.filter?.(Boolean) ??
        (typeof (article as any).keyword === "string" && (article as any).keyword
            ? [(article as any).keyword]
            : []);

    const entities = (article as any).entities?.filter?.(Boolean) ?? [];

    const snippetNode = useMemo(() => {
        const bullets = (article as any).summary_bullets as string[] | undefined;
        if (bullets?.length) {
            return (
                <ul className="list-disc pl-5 space-y-1">
                    {bullets.map((b, i) => (
                        <li key={i} className="text-gray-300 leading-relaxed">
                            {b}
                        </li>
                    ))}
                </ul>
            );
        }

        const short = (article as any).summary_short || article.summary;
        if (short) {
            return <p className="text-gray-300 leading-relaxed">{short}</p>;
        }

        return null;
    }, [article]);

    const extended = (article as any).summary_extended as string | undefined;

    const importanceScore = (article as any).importance_score as number | undefined;
    const importanceLabel = humanizeImportance(importanceScore);

    const sentimentScore = (article as any).sentiment_score as number | undefined;

    const tickerSentiments = (article as any).ticker_sentiments as Record<string, number> | undefined;
    const tickerSentimentReasoning = (article as any).ticker_sentiment_reasoning as
        | Record<string, string>
        | undefined;

    const keywordMap = (article as any).keyword_map as Record<string, string[]> | undefined;

    const primaryTicker = (article as any).primary_ticker as string | undefined;
    const marketSession = (article as any).market_session as string | undefined;

    const eventType = (article as any).event_type as string | undefined;

    const hasAnyReasoning =
        Boolean((article as any).event_type_reasoning) ||
        Boolean((article as any).importance_reasoning) ||
        Boolean((article as any).sentiment_reasoning) ||
        Boolean((article as any).primary_ticker_reasoning) ||
        Boolean((article as any).sector_reasoning) ||
        Boolean((article as any).industry_reasoning) ||
        Boolean((article as any).keyword_reasoning) ||
        Boolean((article as any).market_session_reasoning) ||
        Boolean(tickerSentimentReasoning && Object.keys(tickerSentimentReasoning).length);

    return (
        <div className={"relative overflow-y-auto flex h-full flex-col max-w-300 mx-auto gap-5"}>
            {/* Header */}
            <div className="flex flex-col gap-3 pb-5 separator-dotted">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-white text-2xl leading-tight">
                        {article.title || "Untitled article"}
                    </h1>
                    <SentimentBadge sentiment={article.sentiment} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
                    <span>{source}</span>
                    {when ? (
                        <>
                            <span className="text-gray-600">•</span>
                            <span>{when}</span>
                        </>
                    ) : null}
                    {authors.length ? (
                        <>
                            <span className="text-gray-600">•</span>
                            <span className="truncate">
                By {authors.slice(0, 3).join(", ")}
                                {authors.length > 3 ? "…" : ""}
              </span>
                        </>
                    ) : null}
                    <span className="text-gray-600">•</span>
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                    >
                        <span className="group-hover:underline underline-offset-4">Read Original</span>
                    </a>
                </div>

                {/* Tickers row */}
                {tickers.length ? (
                    <div className="flex flex-wrap gap-2">
                        {tickers.map((t, i) => (
                            <a
                                key={`${t}-${i}`}
                                href={`/stock/${encodeURIComponent(t)}`}
                                className="text-xs text-gray-300 bg-white/5 border border-white/10 rounded-full px-2 py-1 hover:bg-white/10 transition-colors"
                            >
                                {t}
                            </a>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* Summaries */}
            <div className="flex flex-col gap-4">
                {snippetNode ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Summary</h3>
                        {snippetNode}
                    </div>
                ) : null}

                {extended ? (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Extended Summary</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{extended}</p>
                    </div>
                ) : null}
            </div>

            {/* Key facts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classification */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm text-gray-400">Classification</h3>
                        {eventType ? (
                            <span className="text-xs text-gray-300 bg-white/5 border border-white/10 rounded-full px-2 py-1">
                {eventType}
              </span>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-3">
                        <EntriesList title="Primary Ticker">
                            <div className="flex items-center gap-2">
                <span className="text-gray-200">
                  {primaryTicker || (tickers[0] ?? "Unknown")}
                </span>
                                {primaryTicker ? (
                                    <a
                                        href={`/stock/${encodeURIComponent(primaryTicker)}`}
                                        className="text-xs text-gray-400 hover:underline underline-offset-4"
                                    >
                                        View
                                    </a>
                                ) : null}
                            </div>
                            <Reasoning text={(article as any).primary_ticker_reasoning} />
                        </EntriesList>

                        <EntriesList title="Market Session">
                            <span className="text-gray-200">{marketSession || "Unknown"}</span>
                            <Reasoning text={(article as any).market_session_reasoning} />
                        </EntriesList>

                        {eventType ? (
                            <EntriesList title="Event Type">
                                <span className="text-gray-200">{eventType}</span>
                                <Reasoning text={(article as any).event_type_reasoning} />
                            </EntriesList>
                        ) : null}
                    </div>
                </div>

                {/* Scoring */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                    <h3 className="text-sm text-gray-400">Scoring</h3>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-gray-200">Importance</span>
                                <span className="text-sm text-gray-400">
                  {importanceLabel
                      ? `${importanceLabel} (${formatScore(importanceScore, 2)})`
                      : "Unknown"}
                </span>
                            </div>
                        </div>
                        <Reasoning text={(article as any).importance_reasoning} />

                        <div className="flex items-start justify-between gap-4 pt-2 border-t border-white/10">
                            <div className="flex flex-col">
                                <span className="text-gray-200">Sentiment</span>
                                <span className="text-sm text-gray-400">
                  {article.sentiment || "Unknown"}
                                    {sentimentScore !== undefined && sentimentScore !== null
                                        ? ` (${formatScore(sentimentScore, 2)})`
                                        : ""}
                </span>
                            </div>
                            <SentimentBadge sentiment={article.sentiment} />
                        </div>
                        <Reasoning text={(article as any).sentiment_reasoning} />
                    </div>
                </div>
            </div>

            {/* Categories */}
            {(sectors.length || industry.length || keywords.length || entities.length) ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
                    <h3 className="text-sm text-gray-400">Tags</h3>

                    {sectors.length ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-200">Sectors</span>
                            </div>
                            <Pills items={sectors} />
                            <Reasoning text={(article as any).sector_reasoning} />
                        </div>
                    ) : null}

                    {industry.length ? (
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <span className="text-gray-200">Industry</span>
                            <Pills items={industry} />
                            <Reasoning text={(article as any).industry_reasoning} />
                        </div>
                    ) : null}

                    {keywords.length ? (
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <span className="text-gray-200">Keywords</span>
                            <Pills items={keywords} />
                            <Reasoning text={(article as any).keyword_reasoning} />
                        </div>
                    ) : null}

                    {keywordMap && Object.keys(keywordMap).length ? (
                        <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
                            <span className="text-gray-200">Keyword Groups</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(keywordMap).map(([cat, items]) => (
                                    <div
                                        key={cat}
                                        className="rounded-lg border border-white/10 bg-black/20 p-3"
                                    >
                                        <div className="text-sm text-gray-400 mb-2">{cat}</div>
                                        <Pills items={(items || []).filter(Boolean)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {entities.length ? (
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                            <span className="text-gray-200">Entities</span>
                            <Pills items={entities} />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* Ticker sentiment breakdown */}
            {tickerSentiments && Object.keys(tickerSentiments).length ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                    <h3 className="text-sm text-gray-400">Ticker Sentiment</h3>

                    <div className="flex flex-col gap-3">
                        {Object.entries(tickerSentiments)
                            .sort((a, b) => Math.abs((b[1] ?? 0)) - Math.abs((a[1] ?? 0)))
                            .map(([t, score]) => {
                                const why = tickerSentimentReasoning?.[t];
                                return (
                                    <div
                                        key={t}
                                        className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/stock/${encodeURIComponent(t)}`}
                                                    className="text-gray-200 hover:underline underline-offset-4"
                                                >
                                                    {t}
                                                </a>
                                                <span className="text-sm text-gray-400">
                          {formatScore(score, 2)}
                        </span>
                                            </div>
                                            <SentimentBadge
                                                sentiment={score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral"}
                                            />
                                        </div>
                                        <Reasoning text={why} />
                                    </div>
                                );
                            })}
                    </div>
                </div>
            ) : null}

            {/* Raw content (fallback / optional) */}
            {article.content ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
                    <h3 className="text-sm text-gray-400">Content</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {article.content}
                    </p>
                </div>
            ) : null}

            {/* Explainability section (only if any reasoning exists) */}
            {hasAnyReasoning ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col gap-2">
                    <h3 className="text-sm text-gray-400">Explainability</h3>
                    <p className="text-gray-300 leading-relaxed">
                        These tags and scores are generated automatically from the article text.
                        Reasoning lines summarize the evidence used for each classification.
                    </p>
                </div>
            ) : null}

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-2">
                <a
                    href={`/articles/${extractSlug(article.url)}`}
                    className="text-sm text-gray-400 hover:underline underline-offset-4"
                >
                    Permalink
                </a>
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:underline underline-offset-4"
                >
                    Open Original
                </a>
            </div>
        </div>
    );
}
