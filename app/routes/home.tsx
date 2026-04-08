import type {Route} from "./+types/home";
import ArticleFeed from "@/components/article-feed";
import {DEFAULT_ARTICLE_FILTERS, getArticles} from "@/lib/api";
import type {Article} from "@/components/article";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "New React Router App"},
        {name: "description", content: "Welcome to React Router!"},
    ];
}

export async function loader({request}: Route.LoaderArgs) {
    const articles = await getArticles(DEFAULT_ARTICLE_FILTERS, {
        signal: request.signal,
    });

    return {
        initialArticles: articles,
    };
}

export default function Home({loaderData}: Route.ComponentProps) {
    return (
        <Dashboard initialArticles={loaderData.initialArticles}/>
    );
}

export function Dashboard({initialArticles}: {initialArticles: unknown[]}) {
    return (
        <div className={"relative overflow-hidden flex h-full flex-col max-w-300 mx-auto gap-5"}>
                {/* Articles list */}
                <div className={"grid grid-cols-1 overflow-x-hidden"}>
                    <ArticleFeed show_filters={true} initialArticles={initialArticles as Article[]}/>
                </div>
        </div>
    );
}
