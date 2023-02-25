import dynamic from "next/dynamic";

const GraphVectorField3D = dynamic(
  () =>
    import("./GraphVectorField3DInternal").then(
      (mod) => mod.GraphVectorField3DInternal
    ),
  { ssr: false }
);

export { GraphVectorField3D };
