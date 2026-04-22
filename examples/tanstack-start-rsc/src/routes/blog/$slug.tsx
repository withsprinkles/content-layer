import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import { getEntry, render } from "sprinkles:content";

const getPost = createServerFn()
    .inputValidator((input: { slug: string }) => input)
    .handler(async ({ data }) => {
        let post = await getEntry("blog", data.slug);
        if (!post) {
            return null;
        }

        let author = await getEntry(post.data.author);
        let { Content } = await render(post);

        return await renderServerComponent(
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
            </article>,
        );
    });

export const Route = createFileRoute("/blog/$slug")({
    loader: async ({ params }) => {
        let Post = await getPost({ data: { slug: params.slug } });
        if (!Post) {
            throw notFound();
        }
        return { Post };
    },
    component: PostPage,
});

function PostPage() {
    let { Post } = Route.useLoaderData();
    return <>{Post}</>;
}
