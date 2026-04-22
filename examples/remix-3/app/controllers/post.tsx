import type { Action } from "remix/fetch-router";

import { Document } from "#/components/Document.tsx";
import { document, frame } from "#/lib/render.tsx";
import {
    articleHeaderStyle,
    articleMetaStyle,
    articleTitleStyle,
    avatarStyle,
    proseStyle,
} from "#/styles.ts";
import { getEntry, render } from "sprinkles:content";

export default (async ctx => {
    if (ctx.headers.get("x-remix-frame") !== "content") {
        return document(<Document />);
    }
    let post = await getEntry("blog", ctx.params.slug);
    if (!post) {
        return new Response("Not Found", { status: 404 });
    }
    let author = await getEntry(post.data.author);
    let { Content } = await render(post);
    return frame(
        <article>
            <header mix={articleHeaderStyle}>
                <h1 mix={articleTitleStyle}>{post.data.title}</h1>
                <div mix={articleMetaStyle}>
                    {author && (
                        <>
                            <img src={author.data.avatar} alt="" mix={avatarStyle} />
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
            <div mix={proseStyle}>
                <Content />
            </div>
        </article>,
    );
}) satisfies Action<"GET", "/blog/:slug">;
