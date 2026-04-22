/// <reference types="vite/client" />

declare module "*?url" {
    const result: string;
    export default result;
}

declare module "*.css" {}

declare module "*.css?url" {
    const result: string;
    export default result;
}

declare module "virtual:vite-preamble";
