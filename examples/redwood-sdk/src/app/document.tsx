import type { DocumentProps } from "rwsdk/router";

import stylesUrl from "../styles.css?url";

export const Document: React.FC<DocumentProps> = ({ children, rw: { nonce } }) => (
    <html lang="en" className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Content Layer × RedwoodSDK</title>
            <link rel="modulepreload" href="/src/client.tsx" />
            <link rel="stylesheet" href={stylesUrl} />
        </head>
        <body className="font-sans">
            <div className="mx-auto max-w-2xl p-6">{children}</div>
            <script nonce={nonce}>import("/src/client.tsx")</script>
        </body>
    </html>
);
