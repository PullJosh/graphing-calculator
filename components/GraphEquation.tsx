import dynamic from "next/dynamic";

const GraphEquation = dynamic(
  () => import("./GraphEquationInternal").then((mod) => mod.GraphEquation),
  { ssr: false }
);

export { GraphEquation };
