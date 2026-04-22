import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import { valibotValidator } from "@tanstack/valibot-adapter";
import { getEntry, render } from "sprinkles:content";
import * as v from "valibot";

const getPost = createServerFn()
    .inputValidator(valibotValidator(v.object({ slug: v.string() })))
    .handler(async ({ data }) => {
        let post = await getEntry("blog", data.slug);
        if (!post) {
            return null;
        }

        let author = await getEntry(post.data.author);
        let { Content } = await render(post);

        let content = await renderServerComponent(<Content />);
        let { author: _author, ...p } = post.data;

        return { post: p, author: author?.data, content };
    });

export const Route = createFileRoute("/blog/$slug")({
    loader: async ({ params }) => {
        let payload = await getPost({ data: { slug: params.slug } });
        if (!payload?.post) {
            throw notFound();
        }
        return payload;
    },
    component: PostPage,
});

function PostPage() {
    let { post, author, content } = Route.useLoaderData();

    return (
        <article>
            <header className="mb-6">
                <h1 className="text-3xl font-bold">{post.title}</h1>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {author && (
                        <>
                            <img src={author.avatar} alt="" className="h-6 w-6 rounded-full" />
                            <span>{author.name}</span>
                            <span aria-hidden>·</span>
                        </>
                    )}
                    <time dateTime={post.publishedOn.toISOString()}>
                        {post.publishedOn.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            timeZone: "UTC",
                        })}
                    </time>
                </div>
            </header>
            <div className="prose dark:prose-invert">{content}</div>
        </article>
    );
}
