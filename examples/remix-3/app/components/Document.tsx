import clientAssets from "#/entry.browser.ts?assets=client";
import serverAssets from "#/entry.server.tsx?assets=ssr";
import indexCss from "#/index.css?url";
import { bodyStyle, containerStyle, htmlStyle } from "#/styles.ts";
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { getContext } from "remix/async-context-middleware";
import { Frame } from "remix/component";

export function Document() {
    let { url } = getContext();
    let assets = mergeAssets(clientAssets, serverAssets);

    return () => (
        <html lang="en" mix={htmlStyle}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Content Layer × Remix 3</title>
                <link href={indexCss} rel="stylesheet" />
                {assets.css.map(attrs => (
                    <link key={attrs.href} {...attrs} rel="stylesheet" />
                ))}
                <script async src={clientAssets.entry} type="module" />
                {assets.js.map(attrs => (
                    <link key={attrs.href} {...attrs} rel="modulepreload" />
                ))}
            </head>
            <body mix={bodyStyle}>
                <div mix={containerStyle}>
                    <Frame name="content" src={url.toString()} />
                </div>
            </body>
        </html>
    );
}
