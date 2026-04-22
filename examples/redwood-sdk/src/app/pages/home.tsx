import { getCollection } from "sprinkles:content";

import { link } from "@/app/shared/links";

export async function Home() {
    let posts = (await getCollection("blog")).toSorted(
        (a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime(),
    );

    return (
        <main>
            <h1 className="mb-6 text-2xl font-bold">Blog</h1>
            <ul className="space-y-4">
                {posts.map(post => (
                    <li key={post.id}>
                        <a
                            href={link("/blog/:slug", { slug: post.id })}
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
                        </a>
                    </li>
                ))}
            </ul>
        </main>
    );
}
