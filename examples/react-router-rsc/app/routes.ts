import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("blog/:slug", "routes/post.tsx"),
] satisfies RouteConfig;
