import { css } from "remix/component";

export let htmlStyle = css({
    backgroundColor: "var(--color-white)",
    color: "var(--color-gray-900)",
    "@media (prefers-color-scheme: dark)": {
        backgroundColor: "var(--color-gray-950)",
        color: "var(--color-gray-50)",
    },
});

export let bodyStyle = css({
    fontFamily: "var(--font-sans)",
});

export let containerStyle = css({
    maxWidth: "42rem",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "calc(var(--spacing) * 6)",
});

export let pageHeadingStyle = css({
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "calc(var(--spacing) * 6)",
});

export let postListStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "calc(var(--spacing) * 4)",
});

export let postLinkStyle = css({
    display: "block",
    borderRadius: "var(--radius-md)",
    padding: "calc(var(--spacing) * 4)",
    "&:hover": {
        backgroundColor: "var(--color-gray-100)",
    },
    "@media (prefers-color-scheme: dark)": {
        "&:hover": {
            backgroundColor: "var(--color-gray-900)",
        },
    },
});

export let postTitleStyle = css({
    fontSize: "1.125rem",
    fontWeight: 600,
});

export let postSummaryStyle = css({
    marginTop: "calc(var(--spacing) * 1)",
    fontSize: "0.875rem",
    color: "var(--color-gray-600)",
    "@media (prefers-color-scheme: dark)": {
        color: "var(--color-gray-400)",
    },
});

export let postDateStyle = css({
    marginTop: "calc(var(--spacing) * 2)",
    display: "block",
    fontSize: "0.75rem",
    color: "var(--color-gray-500)",
});

export let articleHeaderStyle = css({
    marginBottom: "calc(var(--spacing) * 6)",
});

export let articleTitleStyle = css({
    fontSize: "1.875rem",
    fontWeight: 700,
});

export let articleMetaStyle = css({
    marginTop: "calc(var(--spacing) * 3)",
    display: "flex",
    alignItems: "center",
    gap: "calc(var(--spacing) * 2)",
    fontSize: "0.875rem",
    color: "var(--color-gray-600)",
    "@media (prefers-color-scheme: dark)": {
        color: "var(--color-gray-400)",
    },
});

export let avatarStyle = css({
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "9999px",
});

export let proseStyle = css({
    "& h2": {
        fontSize: "1.5rem",
        fontWeight: 600,
        marginTop: "calc(var(--spacing) * 8)",
        marginBottom: "calc(var(--spacing) * 4)",
    },
    "& h3": {
        fontSize: "1.25rem",
        fontWeight: 600,
        marginTop: "calc(var(--spacing) * 6)",
        marginBottom: "calc(var(--spacing) * 3)",
    },
    "& p": {
        lineHeight: 1.7,
        marginTop: "calc(var(--spacing) * 4)",
    },
    "& ul, & ol": {
        marginTop: "calc(var(--spacing) * 4)",
        paddingLeft: "calc(var(--spacing) * 6)",
    },
    "& ul": { listStyle: "disc" },
    "& ol": { listStyle: "decimal" },
    "& li": { lineHeight: 1.7, marginTop: "calc(var(--spacing) * 1)" },
    "& :not(pre) > code": {
        fontSize: "0.875em",
        padding: "0.1em 0.3em",
        borderRadius: "var(--radius-sm)",
        backgroundColor: "var(--color-gray-100)",
        "@media (prefers-color-scheme: dark)": {
            backgroundColor: "var(--color-gray-900)",
        },
    },
    "& a": {
        textDecoration: "underline",
    },
    "& strong": { fontWeight: 600 },
    "& em": { fontStyle: "italic" },
});

export let codeBlockContainerStyle = css({
    position: "relative",
    marginTop: "calc(var(--spacing) * 4)",
    marginBottom: "calc(var(--spacing) * 4)",
    overflow: "hidden",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-slate-900)",
    color: "var(--color-slate-100)",
});

export let codeBlockButtonStyle = css({
    position: "absolute",
    top: "calc(var(--spacing) * 2)",
    right: "calc(var(--spacing) * 2)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-slate-700)",
    backgroundColor: "var(--color-slate-800)",
    padding: "calc(var(--spacing) * 1) calc(var(--spacing) * 2)",
    fontSize: "0.75rem",
    color: "var(--color-slate-200)",
    "&:hover": {
        backgroundColor: "var(--color-slate-700)",
    },
});

export let codeBlockPreStyle = css({
    overflowX: "auto",
    padding:
        "calc(var(--spacing) * 4) calc(var(--spacing) * 20) calc(var(--spacing) * 4) calc(var(--spacing) * 4)",
    fontWeight: 400,
    fontSize: "0.875rem",
});
