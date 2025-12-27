import type {Article} from "@/components/article";

export function SentimentBadge({sentiment}: { sentiment?: Article["sentiment"] }){
    const s = (sentiment ?? "neutral").toLowerCase();
    const map: Record<string, { label: string; cls: string; dot: string }> = {
        positive: {
            label: "Positive",
            cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            dot: "bg-emerald-400",
        },
        negative: {
            label: "Negative",
            cls: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            dot: "bg-rose-400",
        },
        neutral: {
            label: "Neutral",
            cls: "bg-slate-500/10 text-slate-300 border-slate-500/20",
            dot: "bg-slate-300",
        },
    };
    const v = map[s] ?? map.neutral;

    return (
        <span className={`inline-flex items-center rounded-full border text-xs px-2 py-0.5 ${v.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${v.dot}`}/>
            {v.label}
    </span>
    );
};