import type { PageProps } from "waku/router";

import { getCollection, getEntry, render } from "sprinkles:content";

export default async function PostPage({ slug }: PageProps<"/blog/[slug]">) {
    let post = await getEntry("blog", slug);
    if (!post) {
        return null;
    }

    let author = await getEntry(post.data.author);
    let { Content } = await render(post);

    return (
        <article>
            <title>{post.data.title}</title>
            <header className="mb-6">
                <h1 className="text-3xl font-bold">{post.data.title}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {author && (
                        <>
                            <img src={author.data.avatar} alt="" className="h-6 w-6 rounded-full" />
                            <span>{author.data.name}</span>
                            <span aria-hidden>·</span>
                        </>
                    )}
                    <time dateTime={post.data.publishedOn.toISOString()}>
                        {post.data.publishedOn.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            timeZone: "UTC",
                        })}
                    </time>
                </div>
            </header>
            <div className="prose dark:prose-invert">
                <Content />
            </div>
        </article>
    );
}

export const getConfig = async () => {
    let posts = await getCollection("blog");
    return {
        render: "static",
        staticPaths: posts.map(post => post.id),
    } as const;
};
