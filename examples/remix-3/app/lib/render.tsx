import type { RemixNode } from "remix/component";

import { renderToStream } from "remix/component/server";
import { createHtmlResponse } from "remix/response/html";

export function document(node: RemixNode): Response {
    return createHtmlResponse(renderToStream(node));
}

export function frame(node: RemixNode): Response {
    return createHtmlResponse(renderToStream(node));
}
