import type { App } from "rwsdk/worker";

import { linkFor } from "rwsdk/router";

export const link = linkFor<App>();
