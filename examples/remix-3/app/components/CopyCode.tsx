import { codeBlockButtonStyle, codeBlockContainerStyle, codeBlockPreStyle } from "#/styles.ts";
import { clientEntry, on } from "remix/component";

export let CopyCode = clientEntry(import.meta.url, handle => {
    let copied = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return ({ lang, children }: { lang?: string; children: string }) => (
        <div mix={codeBlockContainerStyle}>
            <button
                type="button"
                mix={[
                    codeBlockButtonStyle,
                    on("click", async () => {
                        await navigator.clipboard.writeText(children.trim());
                        copied = true;
                        handle.update();
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            copied = false;
                            handle.update();
                        }, 2000);
                    }),
                ]}
            >
                {copied ? "Copied!" : "Copy"}
            </button>
            <pre mix={codeBlockPreStyle}>
                <code className={lang ? `language-${lang}` : undefined}>{children.trim()}</code>
            </pre>
        </div>
    );
});
