import { Remote, wrap } from "comlink";

import type { API } from "./graphEquation.worker";

export const api: Remote<API> = wrap(
  new Worker(new URL("../workers/graphEquation.worker.ts", import.meta.url))
);
