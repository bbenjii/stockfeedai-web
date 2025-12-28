import type {Route} from "./+types/home";
// import { Welcome } from "@/welcome/welcome";
import {Input} from "@/components/ui/input"
import {useEffect, useState, useMemo, use} from "react";
import {fetch_util} from "@/lib/utils";
import StockChart from "@/components/stock-chart"
import ArticleFeed from "@/components/article-feed";
import SymbolSearch from "@/components/symbol-search";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "New React Router App"},
        {name: "description", content: "Welcome to React Router!"},
    ];
}

export default function Home() {

    return (

        <Dashboard/>

    );
}


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

export function Dashboard() {


    return (
        <div className={"relative overflow-hidden flex h-full flex-col max-w-300 mx-auto gap-5"}>
                {/* Articles list */}
                <div className={"grid grid-cols-1 overflow-x-hidden"}>
                    <ArticleFeed show_filters={false}/>
                </div>
        </div>
    );
}

