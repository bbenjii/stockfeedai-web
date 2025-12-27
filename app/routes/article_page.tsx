import { useEffect, useState } from "react";
import { fetch_util } from "@/lib/utils";
import { ArticleFull } from "@/components/article-full"; // adjust path to where you placed it
import type {Article} from "@/components/article"; // adjust path

export default function ArticlePage({ params }: { params: { slug: string } }) {
    const slug = params?.slug ?? "";

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchArticle(s: string) {
        const url = `/article/${encodeURIComponent(s)}`;
        const result = await fetch_util(url);
        return (result?.article ?? null) ;
    }

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetchArticle(slug);

                if (cancelled) return;

                setArticle(res);
            } catch (e: any) {
                if (cancelled) return;
                setError(e?.message ?? "Failed to fetch article");
                setArticle(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    return (
        <div className={"relative  flex h-full flex-col max-w-300 mx-auto gap-5"}>
            {loading ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-gray-300">
                    Loading article…
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-gray-200">
                    {error}
                </div>
            ) : !article || !article.url ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-gray-300">
                    Article not found.
                </div>
            ) : (
                <ArticleFull article={article} />
            )}
        </div>
    );
}
