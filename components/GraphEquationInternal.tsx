import { useContext, useMemo } from "react";
import { GraphContext } from "./Graph";
import { GraphContours } from "./GraphContours";
import { useFlatContoursForEquation } from "../hooks/useFlatContoursForEquation";

import { ComputeEngine } from "@cortex-js/compute-engine";
const ce = new ComputeEngine();

interface GraphEquationProps {
  equation: string;
  color: "red" | "blue";
}

export function GraphEquation({ equation, color }: GraphEquationProps) {
  const { graphWindow } = useContext(GraphContext)!;

  const mathJSON = useMemo(() => ce.parse(equation), [equation]);
  console.log(JSON.stringify(mathJSON));
  let flatContours = useFlatContoursForEquation(mathJSON, graphWindow, 7n, 4n);

  return <GraphContours flatContours={flatContours} color={color} />;
}
