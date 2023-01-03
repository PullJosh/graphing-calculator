import { GraphGridLine3D } from "./GraphGridLine3D";

interface GraphAxis3DProps {
  axis: "x" | "y" | "z";
}

export function GraphAxis3D({ axis }: GraphAxis3DProps) {
  return (
    <GraphGridLine3D
      x={axis === "x" ? null : 0}
      y={axis === "y" ? null : 0}
      z={axis === "z" ? null : 0}
      color="#64748b"
      width={2}
    />
  );
}
