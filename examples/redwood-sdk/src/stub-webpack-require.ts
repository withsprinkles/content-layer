// Predeclare a no-op `__webpack_require__` global so that
// `react-server-dom-webpack/client.browser`'s module-init code can read
// `__webpack_require__.u` without throwing. rwsdk's own `setWebpackRequire`
// replaces this with the real implementation once its module body runs.
//
// Needed because Vite+'s Rolldown-based dev optimizer bundles rwsdk/client
// and react-server-dom-webpack into one chunk and hoists all imports to the
// chunk header — so `react-server-dom-webpack` evaluates before the body of
// rwsdk's `setWebpackRequire.js` runs.
declare global {
    var __webpack_require__: (id: string) => unknown;
}

globalThis.__webpack_require__ = function webpackRequireStub() {
    return undefined;
};

export {};
