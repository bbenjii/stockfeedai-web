import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {fetchJson} from "@/lib/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetch_util(url="", method="GET", body=null, errorCallback=({error}:{error:any})=>{}){
    try{
        return await fetchJson(url, {
            method,
            body,
        });
    } catch(error:any){
        errorCallback({error});
        throw error;
    }
}


export function sourceFromUrl(url: string){
    try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        return host.split(".")[0]?.toUpperCase() ?? host.toUpperCase();
    } catch {
        return "Source";
    }
}

export function timeFromIso(iso?: string | null){
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"});
}
export function extractSlug(url:string) {
    return new URL(url).pathname?.split("/")?.filter(Boolean)?.pop()?.replace(/\.html$/, "");
}
