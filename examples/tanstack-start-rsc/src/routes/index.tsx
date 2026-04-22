import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCollection } from "sprinkles:content";

const getBlogList = createServerFn().handler(async () => {
    return (await getCollection("blog"))
        .map(post => {
            let { author: _author, ...p } = post.data;
            return { ...p, id: post.id };
        })
        .toSorted((a, b) => b.publishedOn.getTime() - a.publishedOn.getTime());
});

export const Route = createFileRoute("/")({
    loader: async () => ({
        posts: await getBlogList(),
    }),
    component: HomePage,
});

function HomePage() {
    let { posts } = Route.useLoaderData();
    return (
        <main>
            <h1 className="mb-6 text-2xl font-bold">Blog</h1>
            <ul className="space-y-4">
                {posts.map(post => (
                    <li key={post.id}>
                        <Link
                            to="/blog/$slug"
                            params={{ slug: post.id }}
                            className="block rounded-md p-4 hover:bg-gray-100 dark:hover:bg-gray-900"
                        >
                            <h2 className="text-lg font-semibold">{post.title}</h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {post.summary}
                            </p>
                            <time
                                className="mt-2 block text-xs text-gray-500"
                                dateTime={post.publishedOn.toISOString()}
                            >
                                {post.publishedOn.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    timeZone: "UTC",
                                })}
                            </time>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
