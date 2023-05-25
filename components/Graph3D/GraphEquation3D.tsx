"use client";

import dynamic from "next/dynamic";

const GraphEquation3D = dynamic(
  () =>
    import("./GraphEquation3DInternal").then(
      (mod) => mod.GraphEquation3DInternal
    ),
  { ssr: false }
);

export { GraphEquation3D };
