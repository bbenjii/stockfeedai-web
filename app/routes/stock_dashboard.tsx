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
