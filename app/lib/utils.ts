import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetch_util(url="", method="GET", body=null, errorCallback=({error}:{error:any})=>{}){
    const base_url = import.meta.env.VITE_API_BASE_URL;

    let base = import.meta.env.VITE_API_BASE_URL;

    if (!base) {
        base = "https://stockfeedai-server-283151671335.us-central1.run.app/"
        // throw new Error("VITE_API_BASE_URL is missing at build time");
    }
    const fetch_url = base_url + url;
    const request = {
        method: method,
        body: body,
    }
    try{
        const response = await fetch(fetch_url, request);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.json();
        
    } catch(error:any){
        errorCallback(error)
        
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