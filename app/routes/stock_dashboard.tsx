import SymbolSearch from "@/components/symbol-search";
import ArticleFeed from "@/components/article-feed";
import {useEffect, useState} from "react";
import StockChart from "@/components/stock-chart";
import {fetch_util} from "@/lib/utils";

export default function StockDashboard({params}: { params: { symbol: string } }) {
    const [symbol, setSymbol] = useState(params.symbol)
    const [tickerInfo, setTickerInfo] = useState<Record<string, any> | null>(null);
    const [errorFetching, setErrorFetching] = useState(false);

    useEffect(() => {
        setErrorFetching(false);
        setSymbol(params.symbol)
        getStockHistory(symbol).then(res => {
            setTickerInfo(res.ticker)
        });
    }, [params]);

    async function getStockHistory(symbol: string) {
        const params = new URLSearchParams();


        const url = `/stock/${symbol}/history?`;
        const result = await fetch_util(url, "GET", null,
            (error) => {
                setErrorFetching(true);
            });
        return result.history ?? [];
    }

    const [stockInfo, setStockInfo] = useState<Record<string, any> | null>(null);
    return (
        <div className={"relative overflow-hidden flex h-full flex-col max-w-300 mx-auto gap-5"}>

            {/* Articles list */}
            {
                !errorFetching ? <div className={"grid grid-cols-1 overflow-x-hidden overflow-y-auto no-scrollbar"}>
                    {<StockChart symbol={symbol}/>}
                    <ArticleFeed symbol={symbol} show_filters={false}/>
                </div> : 
                    <div>Error fetching stock data</div>
            }

        </div>
    )
}