import { getEntry, render } from "sprinkles:content";

import type { Route } from "./+types/post";

export async function ServerComponent({ params }: Route.ComponentProps) {
    let post = await getEntry("blog", params.slug);
    if (!post) {
        throw new Response(null, { status: 404 });
    }

    let author = await getEntry(post.data.author);
    let { Content } = await render(post);

    return (
        <article>
            <header className="mb-6">
                <h1 className="text-3xl font-bold">{post.data.title}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {author && (
                        <>
                            <img
                                src={author.data.avatar}
                                alt=""
                                className="h-6 w-6 rounded-full"
                            />
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
