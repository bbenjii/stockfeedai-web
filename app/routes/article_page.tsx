import { ArticleFull } from "@/components/article-full"; // adjust path to where you placed it
import type {Article} from "@/components/article"; // adjust path
import {getArticle} from "@/lib/api";

export async function loader({params, request}: {params: {slug?: string}, request: Request}) {
    if (!params.slug) {
        throw new Response("Article not found", {status: 404});
    }

    const article = await getArticle(params.slug, request.signal);

    if (!article) {
        throw new Response("Article not found", {status: 404});
    }

    return {
        article,
    };
}

export default function ArticlePage({loaderData}: {loaderData: {article: Article}}) {
    return (
        <div className={"relative  flex h-full flex-col max-w-300 mx-auto gap-5"}>
            <ArticleFull article={loaderData.article as Article} />
        </div>
    );
}
