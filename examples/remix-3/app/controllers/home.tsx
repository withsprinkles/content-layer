import type { Action } from "remix/fetch-router";

import { Document } from "#/components/Document.tsx";
import { document, frame } from "#/lib/render.tsx";
import {
    pageHeadingStyle,
    postDateStyle,
    postLinkStyle,
    postListStyle,
    postSummaryStyle,
    postTitleStyle,
} from "#/styles.ts";
import { getCollection } from "sprinkles:content";

export default (async ctx => {
    if (ctx.headers.get("x-remix-frame") !== "content") {
        return document(<Document />);
    }
    let posts = (await getCollection("blog")).toSorted(
        (a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime(),
    );
    return frame(
        <main>
            <h1 mix={pageHeadingStyle}>Blog</h1>
            <ul mix={postListStyle}>
                {posts.map(post => (
                    <li key={post.id}>
                        <a href={`/blog/${post.id}`} rmx-target="content" mix={postLinkStyle}>
                            <h2 mix={postTitleStyle}>{post.data.title}</h2>
                            <p mix={postSummaryStyle}>{post.data.summary}</p>
                            <time
                                mix={postDateStyle}
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
        </main>,
    );
}) satisfies Action<"GET", "/">;
