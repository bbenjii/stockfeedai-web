import {useEffect, useRef, useState} from "react";
import { useNavigate } from "react-router";

import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {searchStockSymbols} from "@/lib/api";


export default function SymbolSearch() {
    const [search, setSearch] = useState("");
    const [symbols, setSymbols] = useState<Record<string, any>[]>([]);
    const [searchCache, setSearchCache] = useState<Record<string, Record<string, any>[]>>({});
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const trimmedSearch = search.trim();

        if (trimmedSearch.length < 1) {
            setSymbols([]);
            return;
        }

        if (searchCache[trimmedSearch]) {
            setSymbols(searchCache[trimmedSearch]);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => {
            searchStockSymbols(trimmedSearch, controller.signal)
                .then((results) => {
                    setSymbols(results as Record<string, any>[]);
                    setSearchCache((currentCache) => ({
                        ...currentCache,
                        [trimmedSearch]: results as Record<string, any>[],
                    }));
                })
                .catch((error) => {
                    if (controller.signal.aborted) return;
                    console.error(error);
                    setSymbols([]);
                });
        }, 250);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [search, searchCache]);

    function highlight(text: string, search: string) {
        if (!search) return text;

        const regex = new RegExp(`(${search})`, "ig");

        return text.split(regex).map((part, i) =>
            part.toLowerCase() === search.toLowerCase() ? (
                <span key={i} className="text-green-600">
                {part}
            </span>
            ) : (
                part
            )
        );
    }
    
    return (
        <div
            ref={containerRef}
            className={"relative "}
            onFocus={() => setOpen(true)}
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
                        setOpen(Boolean(value.trim()))
                    }}
                    className={"text-base"}
                    placeholder="Search symbol or company name..."/>

                <CommandList className={`absolute left-0 top-full mt-2 w-full rounded-md border bg-background-2 shadow-lg z-[1000] ${open ? "block" : "hidden"}`}>
                    <CommandEmpty>No results found</CommandEmpty>
                    {
                        symbols.map((symbol, index) =>
                            <CommandItem key={symbol.symbol} className={" cursor-pointer"} 
                                         onMouseDown={(e) => e.preventDefault()} // keep focus for click
                                         onSelect={() => {
                                             setSearch(symbol.symbol)
                                             setOpen(false)
                                             inputRef.current?.blur()
                                             return navigate(`/stock/${symbol.symbol}`);
                                         }}
                            >
                                <div className={"flex gap-2"}>
                                    <span>{highlight(symbol.symbol, search)}</span>
                                    <span>{highlight(symbol.name, search)}</span>
                                </div>
                            </CommandItem>
                        )
                    }
                </CommandList>

            </Command>
        </div>
    )
}
