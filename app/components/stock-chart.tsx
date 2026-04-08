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
    Close: {
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
        console.log("initialHistory", initialHistory);
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
                console.log(res);
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

        switch (period) {
            case "1d":
                return date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                });
            case "5d":
                return date.getHours() >= 12
                    ? "12:00"
                    : date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                    });
            case "1mo":
                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            case "3mo":
                return date.toLocaleDateString("en-US", {
                    month: "short",
                });
            case "6mo":
                return date.toLocaleDateString("en-US", {
                    month: "short",
                });
            case "ytd":
            case "1y":
                return date.toLocaleDateString("en-US", {
                    month: "short",
                });
            case "3y":
            case "5y":
                return date.toLocaleDateString("en-US", {
                    year: "numeric",
                });
            default:
                return date.toLocaleDateString("en-US");
        }
    }

    const xAxisTicks = stockHistoryData
        ? (() => {
            const tradingDays =
                period === "5d"
                    ? Array.from(
                        new Set(
                            stockHistoryData.map((candle) =>
                                new Date(candle.time * 1000).toDateString()
                            )
                        )
                    )
                    : [];
            const fiveDayMidpointSeen = new Set<string>();
            const ticks = stockHistoryData.reduce<number[]>((acc, candle, index, candles) => {
                const date = new Date(candle.time * 1000);
                const dayKey = date.toDateString();

                if (index === 0) {
                    acc.push(candle.time);
                    return acc;
                }

                const previousDate = new Date(candles[index - 1].time * 1000);

                switch (period) {
                    case "1d": {
                        const hour = date.getHours();
                        const previousHour = previousDate.getHours();
                        const markerHours = new Set([9, 12, 15]);

                        if (markerHours.has(hour) && hour !== previousHour) {
                            acc.push(candle.time);
                        }
                        break;
                    }
                    case "5d":
                        if (date.toDateString() !== previousDate.toDateString()) {
                            acc.push(candle.time);
                            break;
                        }

                        if (
                            tradingDays.length > 2 &&
                            dayKey !== tradingDays[0] &&
                            dayKey !== tradingDays[tradingDays.length - 1] &&
                            date.getHours() >= 12 &&
                            !fiveDayMidpointSeen.has(dayKey)
                        ) {
                            acc.push(candle.time);
                            fiveDayMidpointSeen.add(dayKey);
                        }
                        break;
                    case "1mo":
                        if (
                            date.getDate() !== previousDate.getDate() &&
                            [1, 8, 15, 22].includes(date.getDate())
                        ) {
                            acc.push(candle.time);
                        }
                        break;
                    case "3mo":
                    case "6mo":
                    case "ytd":
                    case "1y":
                        if (
                            date.getMonth() !== previousDate.getMonth() ||
                            date.getFullYear() !== previousDate.getFullYear()
                        ) {
                            if (
                                period === "1y" &&
                                ![0, 3, 6, 9].includes(date.getMonth())
                            ) {
                                break;
                            }

                            if (
                                period === "ytd" &&
                                date.getMonth() !== 0 &&
                                date.getMonth() % 2 !== 0
                            ) {
                                break;
                            }

                            acc.push(candle.time);
                        }
                        break;
                    case "3y":
                    case "5y":
                        if (date.getFullYear() !== previousDate.getFullYear()) {
                            acc.push(candle.time);
                        }
                        break;
                    default:
                        break;
                }

                return acc;
            }, []);

            const lastTimestamp = stockHistoryData[stockHistoryData.length - 1]?.time;

            if (
                period !== "5d" &&
                typeof lastTimestamp === "number" &&
                ticks[ticks.length - 1] !== lastTimestamp
            ) {
                ticks.push(lastTimestamp);
            }

            return ticks;
        })()
        : undefined;

    function tooltipDateFormatter(timestamp: number) {
        const date = new Date(timestamp * 1000);
        const tooltipDateFormatMap: Record<string, Intl.DateTimeFormatOptions> = {
            "1d": {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            },
            "5d": {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            },
            "1mo": {month: "short", day: "2-digit", year: "numeric"},
            "3mo": {month: "short", day: "2-digit", year: "numeric"},
            "6mo": {month: "short", day: "2-digit", year: "numeric"},
            "ytd": {month: "short", day: "2-digit", year: "numeric"},
            "1y": {month: "short", day: "2-digit", year: "numeric"},
            "3y": {month: "short", day: "2-digit", year: "numeric"},
            "5y": {month: "short", day: "2-digit", year: "numeric"},
        }

        return date.toLocaleString("en-US", tooltipDateFormatMap[period]);
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
                                key={`${symbol}-${period}`}
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
                                    ticks={xAxisTicks}
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
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(_, payload) => {
                                                const timestamp = payload?.[0]?.payload?.time;

                                                return typeof timestamp === "number"
                                                    ? tooltipDateFormatter(timestamp)
                                                    : "";
                                            }}
                                            formatter={(value) => {
                                                const numericValue =
                                                    typeof value === "number" ? value : Number(value);

                                                return Number.isFinite(numericValue)
                                                    ? numericValue.toLocaleString("en-US", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })
                                                    : String(value);
                                            }}
                                        />
                                    }
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
