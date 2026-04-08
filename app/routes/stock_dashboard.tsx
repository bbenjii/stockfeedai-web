import ArticleFeed from "@/components/article-feed";
import StockChart from "@/components/stock-chart";
import {
    DEFAULT_ARTICLE_FILTERS,
    getArticles,
    getStockHistory,
    type StockHistory,
    type StockPeriod,
} from "@/lib/api";
import type {Route} from "./+types/stock_dashboard";
import type {Article} from "@/components/article";
import {Button} from "@/components/ui/button";
import {isRouteErrorResponse, Link, useRouteError} from "react-router";

const DEFAULT_PERIOD: StockPeriod = "5d";

export async function loader({params, request}: Route.LoaderArgs) {
    const symbol = params.symbol;

    if (!symbol) {
        throw new Response("Stock symbol not found", {status: 404});
    }

    const [history, articles] = await Promise.all([
        getStockHistory(symbol, {
            period: DEFAULT_PERIOD,
            signal: request.signal,
        }),
        getArticles(DEFAULT_ARTICLE_FILTERS, {
            symbol,
            signal: request.signal,
        }),
    ]);

    return {
        symbol,
        defaultPeriod: DEFAULT_PERIOD,
        initialHistory: history,
        initialArticles: articles,
    };
}

export default function StockDashboard({loaderData}: Route.ComponentProps) {
    return (
        <div className={"relative overflow-hidden flex h-full flex-col max-w-300 mx-auto gap-5"}>
            <div className={"grid grid-cols-1 overflow-x-hidden overflow-y-auto no-scrollbar"}>
                <StockChart
                    symbol={loaderData.symbol}
                    defaultPeriod={loaderData.defaultPeriod}
                    initialHistory={loaderData.initialHistory as StockHistory}
                />
                <ArticleFeed
                    symbol={loaderData.symbol}
                    show_filters={false}
                    initialArticles={loaderData.initialArticles as unknown as Article[]}
                />
            </div>
        </div>
    )
}

export function ErrorBoundary() {
    const error = useRouteError();

    let title = "Unable to load stock page";
    let details = "Something went wrong while fetching this symbol.";

    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            title = "Symbol not found";
            details = "This ticker is unavailable or the backend could not find matching market data.";
        } else {
            details = error.statusText || details;
        }
    } else if (error instanceof Error) {
        details = error.message;
    }

    return (
        <div className="relative overflow-hidden flex h-full flex-col max-w-300 mx-auto gap-5">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-gray-200">
                <h1 className="text-xl font-semibold text-white">{title}</h1>
                <p className="mt-2 text-sm text-gray-300">{details}</p>
                <div className="mt-5 flex gap-3">
                    <Button asChild className="rounded-2xl bg-white text-black hover:bg-gray-200">
                        <Link to="/">Back to feed</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
