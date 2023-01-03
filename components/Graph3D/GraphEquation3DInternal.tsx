import { useContext, useMemo } from "react";
// import { GraphContext3D } from "./Graph3D";
import { GraphContours3D } from "./GraphContours3D";
import { useFlatContoursForEquation } from "../../hooks/useFlatContoursForEquation";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { Box } from "../../lib";
import { Graph3DContext } from "./Graph3D";
const ce = new ComputeEngine();

interface GraphEquation3DProps {
  equation: string;
  color: "red" | "blue";
}

export function GraphEquation3D({ equation, color }: GraphEquation3DProps) {
  const { window } = useContext(Graph3DContext);

  const graphWindow: Box = {
    minX: -5,
    maxX: 5,
    minY: -5,
    maxY: 5,
    // minZ: -10,
    // maxZ: 10,
  };

  // const graphWindow: Box = {
  //   minX: window.value[0][0],
  //   maxX: window.value[1][0],
  //   minY: window.value[0][1],
  //   maxY: window.value[1][1],
  //   // minZ: -10,
  //   // maxZ: 10,
  // };

  const mathJSON = useMemo(() => ce.parse(equation), [equation]);
  let flatContours = useFlatContoursForEquation(mathJSON, graphWindow, 7n, 4n);

  return <GraphContours3D flatContours={flatContours} color={color} />;
}
