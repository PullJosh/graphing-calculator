import dynamic from "next/dynamic";

const GraphEquation3D = dynamic(
  () => import("./GraphEquation3DInternal").then((mod) => mod.GraphEquation3D),
  { ssr: false }
);

export { GraphEquation3D };
