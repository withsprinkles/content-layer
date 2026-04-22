import type { ReactNode } from "react";

import "../styles.css";

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <div className="bg-white font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-50">
            <title>Content Layer × Waku</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <div className="mx-auto max-w-2xl p-6">{children}</div>
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "static",
    } as const;
};
