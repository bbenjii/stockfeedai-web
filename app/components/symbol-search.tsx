import {useEffect, useMemo, useRef, useState} from "react";
import { useNavigate } from "react-router";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {searchStockSymbols} from "@/lib/api";

const MIN_SEARCH_LENGTH = 1;

type SymbolResult = {
    symbol?: string;
    name?: string;
    [key: string]: unknown;
};

type SearchGroup = {
    heading: string;
    items: SymbolResult[];
};

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string | undefined, search: string) {
    const safeText = text ?? "";
    const trimmedSearch = search.trim();

    if (!trimmedSearch) return safeText;

    const regex = new RegExp(`(${escapeRegExp(trimmedSearch)})`, "ig");

    return safeText.split(regex).map((part, i) =>
        part.toLowerCase() === trimmedSearch.toLowerCase() ? (
            <span key={i} className="text-green-600">
                {part}
            </span>
        ) : (
            part
        )
    );
}

function buildGroupedResults(results: SymbolResult[], search: string) {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    const deduped = results.filter((item, index, array) => {
        const symbol = String(item.symbol ?? "");
        return array.findIndex((candidate) => candidate.symbol === symbol) === index;
    });

    const exactSymbol = deduped.filter((item) => String(item.symbol ?? "").toLowerCase() === query);
    const prefixMatches = deduped.filter((item) => {
        const symbol = String(item.symbol ?? "").toLowerCase();
        return symbol.startsWith(query) && symbol !== query;
    });
    const companyMatches = deduped.filter((item) => {
        const symbol = String(item.symbol ?? "").toLowerCase();
        const name = String(item.name ?? "").toLowerCase();
        return !symbol.startsWith(query) && name.includes(query);
    });
    const otherMatches = deduped.filter((item) => {
        const symbol = String(item.symbol ?? "").toLowerCase();
        const name = String(item.name ?? "").toLowerCase();
        return symbol.includes(query) && !symbol.startsWith(query) && !name.includes(query);
    });

    return [
        {heading: "Top Match", items: exactSymbol},
        {heading: "Symbols", items: prefixMatches},
        {heading: "Companies", items: companyMatches},
        {heading: "More Results", items: otherMatches},
    ].filter((group) => group.items.length > 0) satisfies SearchGroup[];
}

export default function SymbolSearch() {
    const [search, setSearch] = useState("");
    const [symbols, setSymbols] = useState<SymbolResult[]>([]);
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null);
    const searchCache = useRef<Record<string, SymbolResult[]>>({});

    const navigate = useNavigate();

    useEffect(() => {
        const trimmedSearch = search.trim();

        if (trimmedSearch.length < MIN_SEARCH_LENGTH) {
            setSymbols([]);
            setIsLoading(false);
            return;
        }

        if (searchCache.current[trimmedSearch]) {
            setSymbols(searchCache.current[trimmedSearch]);
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        setIsLoading(true);
        const timeoutId = window.setTimeout(() => {
            searchStockSymbols(trimmedSearch, controller.signal)
                .then((results) => {
                    searchCache.current[trimmedSearch] = results as SymbolResult[];
                    setSymbols(results as SymbolResult[]);
                })
                .catch((error) => {
                    if (controller.signal.aborted) return;
                    setSymbols([]);
                })
                .finally(() => {
                    if (!controller.signal.aborted) {
                        setIsLoading(false);
                    }
                });
        }, 250);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
            setIsLoading(false);
        };
    }, [search]);

    function navigateToSymbol(symbol: string) {
        setSearch(symbol);
        setOpen(false);
        inputRef.current?.blur();
        navigate(`/stock/${symbol}`);
    }

    const trimmedSearch = search.trim();
    const groupedResults = useMemo(
        () => buildGroupedResults(symbols, trimmedSearch),
        [symbols, trimmedSearch],
    );
    const hasEnoughCharacters = trimmedSearch.length >= MIN_SEARCH_LENGTH;
    
    return (
        <div
            ref={containerRef}
            className={"relative "}
            onFocus={() => setOpen(hasEnoughCharacters)}
            onBlur={(e) => {
                if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                    setOpen(false)
                }
            }}
        >
            <Command shouldFilter={false} className={"bg-transparent border rounded-2xl"}>
                <CommandInput
                    value={search}
                    ref={inputRef}
                    onValueChange={(value) => {
                        setSearch(value)
                        setOpen(value.trim().length >= MIN_SEARCH_LENGTH)
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setOpen(false);
                            inputRef.current?.blur();
                            return;
                        }

                        if (event.key === "ArrowDown" && !open && hasEnoughCharacters) {
                            setOpen(true);
                        }
                    }}
                    className={"text-base"}
                    placeholder="Search symbol or company name..."/>

                <CommandList className={`absolute left-0 top-full mt-2 w-full rounded-md border bg-background-2 shadow-lg z-[1000] ${open ? "block" : "hidden"}`}>
                    {!hasEnoughCharacters ? (
                        <div className="px-3 py-3 text-sm text-gray-400">
                            Type at least {MIN_SEARCH_LENGTH} characters
                        </div>
                    ) : null}

                    {hasEnoughCharacters && isLoading ? (
                        <div className="px-3 py-3 text-sm text-gray-400">
                            Searching…
                        </div>
                    ) : null}

                    {hasEnoughCharacters && !isLoading ? (
                        <>
                            <CommandEmpty>No results found</CommandEmpty>
                            {groupedResults.map((group, index) => (
                                <div key={group.heading}>
                                    {index > 0 ? <CommandSeparator /> : null}
                                    <CommandGroup heading={group.heading}>
                                        {group.items.map((symbol) => (
                                            <CommandItem
                                                key={String(symbol.symbol)}
                                                value={`${String(symbol.symbol ?? "")} ${String(symbol.name ?? "")}`}
                                                className={"cursor-pointer"}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onSelect={() => navigateToSymbol(String(symbol.symbol ?? ""))}
                                            >
                                                <div className={"flex min-w-0 items-center gap-2"}>
                                                    <span className="shrink-0 font-medium">
                                                        {highlight(symbol.symbol as string | undefined, search)}
                                                    </span>
                                                    <span className="truncate text-sm text-gray-400">
                                                        {highlight(symbol.name as string | undefined, search)}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </div>
                            ))}
                        </>
                    ) : null}
                </CommandList>

            </Command>
        </div>
    )
}
