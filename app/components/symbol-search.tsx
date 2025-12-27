import {useEffect, useRef, useState} from "react";
import { useNavigate } from "react-router";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import {CardTitle} from "@/components/ui/card";
import {fetch_util} from "@/lib/utils";


export default function SymbolSearch() {
    const [search, setSearch] = useState("");
    const [symbols, setSymbols] = useState<Record<string, any>[]>([]);
    const [searchCache, setSearchCache] = useState<Record<string, any>>({});
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();

    async function searchSymbols(search : string) {
        const params = new URLSearchParams();

        if (search.trim()) params.set("search", search.trim());
        
        const url = `/stock/symbols?${params.toString()}`;
        if (searchCache[search]) return searchCache[search];
        
        const result = await fetch_util(url);
        setSearchCache({...searchCache, [search]: result.symbols ?? []})
        return result.symbols ?? [];
    }
    
    useEffect(() => {
   
    }, []);

    useEffect(() => {
        searchSymbols(search).then(setSymbols);
    }, [search]);
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
            <Command className={"bg-transparent border  rounded-2xl"}>
                <CommandInput
                    value={search}
                    ref={inputRef}
                    onValueChange={setSearch}
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
                                    <span>{symbol.symbol}</span>
                                    <span>{symbol.name}</span>

                                </div>
                            </CommandItem>
                        )
                    }
                </CommandList>

            </Command>
        </div>
    )
}