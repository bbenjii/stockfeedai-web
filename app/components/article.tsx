import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import {sourceFromUrl, timeFromIso, extractSlug} from "@/lib/utils";

import {SentimentBadge} from "@/components/sentiment-badge";
import React, {useMemo, useState} from "react";

export function ArticleCard({article, index}: { article: Article, index: number }) {
    const source = sourceFromUrl(article.url);
    const when = timeFromIso(article.publish_date);
    const authors = article.authors?.filter(Boolean) ?? [];
    const tickers = article.tickers?.filter(Boolean) ?? [];
    const snippet = article.summary_bullets?.length ? (
        <ul className="list-disc pl-4 space-y-1">
            {article.summary_bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
            ))}
        </ul>
    ) : (
        article.summary_short || article.summary || article.content || ""
    );

    const [modelIsOpen, setModelIsOpen] = useState(false)


    return (
        <div
            key={article.url ?? index}
            className={`flex flex-col py-5 gap-1 ${index !== 0 ? "separator-dotted" : ""}`}
        >
            <ArticleDialog article={article} modalIsOpen={modelIsOpen} setModelIsOpen={setModelIsOpen}/>
            <div className="flex gap-2 flex-wrap">
                {tickers.map((t: string, i: number) => (
                    <a key={`${t}-${i}`} href={`/stock/${t}`} className="text-xs dark:text-gray-400 text-gray-600 hover:text-green-500">
                        {t}
                    </a>
                ))}
            </div>

            <div className="flex items-start justify-between gap-4">
                <a
                    onClick={() => setModelIsOpen(true)}
                    // href={`/articles/${extractSlug(article.url)}`}
                    className="flex-1 group cursor-pointer">
                    <h3 className="dark:text-white group-hover:underline underline-offset-4 transition-colors">
                        {article.title || "Untitled article"}
                    </h3>
                </a>

                <SentimentBadge sentiment={article.sentiment}/>
            </div>
            <div className="flex justify-between">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm dark:text-gray-400 text-gray-600">
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
                          By {authors.slice(0, 2).join(", ")}
                                {authors.length > 2 ? "…" : ""}
                        </span>
                        </>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm dark:text-gray-400 text-gray-600">
                    <a 
                        href={article.url}
                        // href={`/articles/${extractSlug(article.url)}`}
                        target="_blank" rel="noopener noreferrer"
                       className="flex group">
                      <span className="text-sm dark:text-gray-400 text-gray-600 group-hover:underline underline-offset-4">
                        Read Original
                      </span>
                    </a>
                </div>
            </div>
        </div>
    );
}


export function ArticleDialog({article, modalIsOpen, setModelIsOpen}: {
    article: Article,
    modalIsOpen: boolean,
    setModelIsOpen: (isOpen: boolean) => void
}) {

    const source = sourceFromUrl(article.url);
    const when = timeFromIso(article.publish_date);
    const authors = article.authors?.filter(Boolean) ?? [];
    const tickers = article.tickers?.filter(Boolean) ?? [];
    const snippet = article.summary_bullets?.length ? (
        <ul className="list-disc pl-4 space-y-1">
            {article.summary_bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
            ))}
        </ul>
    ) : (
        article.summary_short || article.summary || article.content || ""
    );

    const snippetNode = useMemo(() => {
        const bullets = (article as any).summary_bullets as string[] | undefined;
        if (bullets?.length) {
            return (
                <ul className="list-disc pl-5 space-y-1 ">
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


    return (
        <Dialog open={modalIsOpen} onOpenChange={setModelIsOpen}>
            <DialogContent showCloseButton={false} className="lg:min-w-200 max-h-[85vh] min-w-full flex flex-col border-0 lg:border-1 bg-background-2 p-4">
                <DialogHeader className="flex items-start text-left justify-between shrink-0 pb-4 border-b border-white/10" >
                    <DialogTitle className="text-white text-xl leading-tight">
                        {article.title || "Untitled article"}
                    </DialogTitle>
                    {/*     /!*<SentimentBadge sentiment={article.sentiment}/> *!/*/}
                </DialogHeader>
                
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">

                    <div className="flex flex-col gap-4">

                        {/* Tickers */}
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

                        {/* Summary */}
                        {snippetNode ? (
                            <div>
                                <h3 className="text-sm text-gray-400 mb-2">Summary</h3>
                                {snippetNode}
                            </div>
                        ) : null}

                        {/* Content */}
                        {article.summary_extended ? (
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                {article.summary_extended}
                            </p>
                        ) : null}

                    </div>
                </div>
                
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"default"}  className={"rounded-2xl w-full lg:w-auto bg-green-600"}>
                            {"Done"}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
            
        </Dialog>

    )
}

export type Article = {
    url: string;

    // Core
    title?: string;
    content?: string;
    publish_date?: string | null;
    authors?: string[] | null;
    source?: string | null;

    // Legacy / fallback
    summary?: string | null;
    keyword?: string | null;

    // Summaries (new)
    summary_short?: string | null;
    summary_bullets?: string[] | null;
    summary_extended?: string | null;

    // Classification
    event_type?: string | null;
    event_type_reasoning?: string | null;

    // Importance
    importance_score?: number | null;
    importance_reasoning?: string | null;

    // Sentiment
    sentiment?: "positive" | "negative" | "neutral" | string | null;
    sentiment_score?: number | null;
    sentiment_reasoning?: string | null;

    // Per-ticker sentiment
    ticker_sentiments?: Record<string, number> | null;
    ticker_sentiment_reasoning?: Record<string, string> | null;

    // Market entities
    tickers?: string[] | null;
    primary_ticker?: string | null;
    primary_ticker_reasoning?: string | null;

    // Categorization
    sectors?: string[] | null;
    sector_reasoning?: string | null;

    industry?: string[] | null;
    industry_reasoning?: string | null;

    // Keywords & entities
    keywords?: string[] | null;
    keyword_map?: Record<string, string[]> | null;
    keyword_reasoning?: string | null;

    entities?: string[] | null;

    // Timing
    market_session?: string | null;
    market_session_reasoning?: string | null;
};

