import {CartesianGrid, Line, LineChart, XAxis, YAxis} from "recharts"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {Skeleton} from "@/components/ui/skeleton"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {getStockHistory, type StockHistory, type StockPeriod} from "@/lib/api";

export const description = "A linear line chart"


const chartConfig = {
    close: {
        label: "Close Price ($)",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

const periodOptions = [
    {label: "1D", value: "1d"},
    {label: "5D", value: "5d"},
    {label: "1M", value: "1mo"},
    {label: "3M", value: "3mo"},
    {label: "6M", value: "6mo"},
    {label: "YTD", value: "ytd"},
    {label: "1Y", value: "1y"},
    {label: "3Y", value: "3y"},
    {label: "5Y", value: "5y"},
];


export default function StockChart({
    symbol,
    defaultPeriod = "5d",
    initialHistory,
}: {
    symbol: string,
    defaultPeriod?: StockPeriod,
    initialHistory?: StockHistory,
}) {

    const [stockHistoryData, setStockHistoryData] = useState(initialHistory?.candles ?? null);
    const [period, setPeriod] = useState<StockPeriod>(defaultPeriod);
    const [tickerInfo, setTickerInfo] = useState(initialHistory?.ticker ?? null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!initialHistory);

    useEffect(() => {
        setStockHistoryData(initialHistory?.candles ?? null);
        setTickerInfo(initialHistory?.ticker ?? null);
        setPeriod(defaultPeriod);
        setError(null);
        setIsLoading(!initialHistory);
    }, [defaultPeriod, initialHistory, symbol]);
    
    useEffect(() => {
        if (initialHistory && period === defaultPeriod) {
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        getStockHistory(symbol, {period})
            .then((res) => {
                if (cancelled) return;
                setStockHistoryData(res.candles);
                setTickerInfo(res.ticker);
                setError(null);
            })
            .catch((error) => {
                if (cancelled) return;
                setError(error instanceof Error ? error.message : "Failed to load stock history");
            })
            .finally(() => {
                if (cancelled) return;
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [defaultPeriod, initialHistory, period, symbol]);

    function timeLabelFormatter(timestamp: number) {
        const date = new Date(timestamp * 1000);
        const periodDateFormatMap: Record<string, Intl.DateTimeFormatOptions> = {
            "1d": {hour: "2-digit", minute: "2-digit"},
            "5d": {month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"},
            "1mo": {month: "short", day: "2-digit"},
            "3mo": {month: "short", day: "2-digit"},
            "6mo": {month: "short"},
            "ytd": {month: "short"},
            "1y": {month: "short"},
            "3y": {year: "numeric"},
            "5y": {year: "numeric"},
        }
        return date.toLocaleString("en-US", periodDateFormatMap[period]);
    }

    return (
        <Card className={"bg-transparent border-none"}>
            <CardHeader className={"p-0"}>
                <div className={"flex gap-2 "}>
                    <CardTitle>{symbol}</CardTitle>
                    <CardDescription>{tickerInfo?.name}</CardDescription>
                </div>
                {
                    tickerInfo ?
                        <div className={"flex gap-2 "}>
                            <CardTitle>
                                {
                                    `$${tickerInfo?.regularMarketPrice}`
                                }
                            </CardTitle>
                            <CardDescription>{tickerInfo?.currency}</CardDescription>
                        </div>
                        :
                        <Skeleton className={"h-5 w-25 bg-background-1"}/>
                }

                {
                    stockHistoryData && tickerInfo ?
                        <div className={"flex"}>
                            {
                                (() => {
                                    const firstTimestamp = (stockHistoryData[0]?.time ?? 0);
                                    const date = new Date(firstTimestamp * 1000);
                                    const startDate = date.toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit"
                                    });

                                    const currentPrice = tickerInfo?.regularMarketPrice ?? 0;
                                    const startPrice = stockHistoryData[0]?.Close ?? 0;

                                    const dollarChange: number = Number((currentPrice - startPrice).toFixed(2));

                                    const percentChange: number = Number(
                                        (startPrice !== 0 ? (dollarChange / startPrice) * 100 : 0).toFixed(2)
                                    );

                                    return (
                                        <div className={"flex gap-1"}>
                                    <span className={` ${dollarChange > 0 ? "text-green-600" : "text-red-600"}`}>
                                        {`${dollarChange > 0 ? "+" : "-"}$${Math.abs(dollarChange)} 
                                        (${dollarChange > 0 ? "+" : "-"}${Math.abs(percentChange)}%)`}
                                    </span>

                                            <span>{`since ${startDate}`}</span>
                                        </div>
                                    )
                                })()
                            }
                        </div>
                        :
                        <div className={"flex gap-1"}>
                            <Skeleton className={"h-5 w-60 bg-background-1"}/>
                        </div>
                }

            </CardHeader>
            <CardContent className={"p-0"}>
                {error ? (
                    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-gray-200">
                        Unable to refresh chart data. {error}
                    </div>
                ) : null}
                {!error && isLoading && stockHistoryData ? (
                    <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
                        Updating chart…
                    </div>
                ) : null}
                <ChartContainer config={chartConfig} className={"h-[250px] w-full "}>
                    {
                        stockHistoryData && stockHistoryData.length > 0 && tickerInfo ?
                            <LineChart
                                accessibilityLayer
                                data={stockHistoryData}
                                margin={{
                                    left: 0,
                                    right: 0,
                                }}
                            >
                                <CartesianGrid vertical={false}/>
                                <XAxis
                                    padding={{left: 0, right: 0}}

                                    dataKey={'time'}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    interval="preserveStartEnd"

                                    width={0}
                                    tickFormatter={timeLabelFormatter}
                                />
                                <YAxis
                                    scale={'linear'}
                                    orientation={'right'}
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tickMargin={0}
                                    axisLine={false}
                                    tickLine={false}
                                    width={40}
                                />
                                <ChartTooltip
                                    cursor={true}
                                    content={<ChartTooltipContent hideLabel/>}
                                />
                                <Line
                                    dataKey="Close"
                                    type="linear"
                                    stroke="green"
                                    strokeWidth={2}
                                    dot={false}

                                />
                            </LineChart>
                            : isLoading ?
                            <Skeleton className={"w-full h-full bg-background-1"}/>
                            : (
                                <div className="flex h-full items-center justify-center rounded-lg border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-400">
                                    No chart data is available for this symbol and period.
                                </div>
                            )
                    }

                </ChartContainer>
                {/* Mobile Period Select */}
                <div className={"flex gap-1 py-4 lg:hidden"}>
                    <Select value={period} onValueChange={(value) => setPeriod(value as StockPeriod)}>
                        <SelectTrigger className="w-20 rounded-2xl">
                            <SelectValue placeholder="Select a Period"/>
                        </SelectTrigger>
                        <SelectContent className={"bg-background-1/95"}>
                            <SelectGroup>
                                <SelectLabel>Period</SelectLabel>
                                {
                                    periodOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))
                                }

                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                {/* Web Period select */}
                <div className={"hidden gap-1 py-4 lg:flex"}>
                    {
                        periodOptions.map(option => (
                            <Button key={option.value} onClick={() => setPeriod(option.value as StockPeriod)}
                                    className={`bg-transparent w-13 rounded-2xl hover:dark:bg-transparent hover:border-gray-400 dark:text-white border  ${option.value === period && "border-green-500"}`}>
                                {option.label}
                            </Button>
                        ))
                    }
                </div>
            </CardContent>

        </Card>
    )
}
