import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import { getCollection } from "sprinkles:content";

const getBlogList = createServerFn().handler(async () => {
    let posts = await getCollection("blog");
    let sorted = posts.toSorted(
        (a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime(),
    );

    return await renderServerComponent(
        <main>
            <h1 className="mb-6 text-2xl font-bold">Blog</h1>
            <ul className="space-y-4">
                {sorted.map(post => (
                    <li key={post.id}>
                        <Link
                            to="/blog/$slug"
                            params={{ slug: post.id }}
                            className="block rounded-md p-4 hover:bg-gray-100 dark:hover:bg-gray-900"
                        >
                            <h2 className="text-lg font-semibold">{post.data.title}</h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {post.data.summary}
                            </p>
                            <time
                                className="mt-2 block text-xs text-gray-500"
                                dateTime={post.data.publishedOn.toISOString()}
                            >
                                {post.data.publishedOn.toLocaleDateString("en-US", {
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
        </main>,
    );
});

export const Route = createFileRoute("/")({
    loader: async () => ({
        List: await getBlogList(),
    }),
    component: HomePage,
});

function HomePage() {
    let { List } = Route.useLoaderData();
    return <>{List}</>;
}
