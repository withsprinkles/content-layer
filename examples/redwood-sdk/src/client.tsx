import "virtual:vite-preamble";
import "./stub-webpack-require";
import { initClient, initClientNavigation } from "rwsdk/client";

const { handleResponse, onHydrated } = initClientNavigation();
initClient({ handleResponse, onHydrated });
