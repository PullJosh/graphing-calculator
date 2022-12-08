import { useMemo } from "react";
// import { GraphContext3D } from "./Graph3D";
import { GraphContours3D } from "./GraphContours3D";
import { useFlatContoursForEquation } from "../../hooks/useFlatContoursForEquation";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { Box } from "../../lib";
const ce = new ComputeEngine();

interface GraphEquation3DProps {
  equation: string;
  color: "red" | "blue";
}

export function GraphEquation3D({ equation, color }: GraphEquation3DProps) {
  // const { graphWindow } = useContext(GraphContext3D)!;
  const graphWindow: Box = {
    minX: -10,
    maxX: 10,
    minY: -10,
    maxY: 10,
    // minZ: -10,
    // maxZ: 10,
  };

  const mathJSON = useMemo(() => ce.parse(equation), [equation]);
  let flatContours = useFlatContoursForEquation(mathJSON, graphWindow, 7n, 4n);

  return <GraphContours3D flatContours={flatContours} color={color} />;
}
