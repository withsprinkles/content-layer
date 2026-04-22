import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { Post } from "@/app/pages/post";

export type AppContext = {};

export default defineApp([
    setCommonHeaders(),
    render(Document, [route("/", Home), route("/blog/:slug", Post)]),
]);
