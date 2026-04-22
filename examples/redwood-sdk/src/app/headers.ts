import type { RouteMiddleware } from "rwsdk/router";

export const setCommonHeaders =
    (): RouteMiddleware =>
    ({ response, rw: { nonce } }) => {
        if (!import.meta.env.VITE_IS_DEV_SERVER) {
            response.headers.set(
                "Strict-Transport-Security",
                "max-age=63072000; includeSubDomains; preload",
            );
        }

        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("Referrer-Policy", "no-referrer");
        response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
        response.headers.set(
            "Content-Security-Policy",
            `default-src 'self'; script-src 'self' 'unsafe-eval' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' https://gravatar.com; frame-ancestors 'self'; object-src 'none';`,
        );
    };
