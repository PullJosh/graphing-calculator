import { BoxedExpression } from "@cortex-js/compute-engine";
import type { Box } from "../types";

import { useWorkQueue } from "./useWorkQueue";

import { api } from "../workers/graphEquationAPI";

export function useFlatContoursForEquation(
  equation: BoxedExpression,
  desiredWindow: Box,
  depth = 7n,
  searchDepth = 3n,
  varValues: Record<string, number> = {},
  axes: [string, string] = ["x", "y"]
) {
  const work = (
    equation: BoxedExpression,
    var1: string,
    var2: string,
    desiredWindow: Box,
    depth = 7n,
    searchDepth = 3n,
    varValues: Record<string, number>
  ) => {
    return api.graphEquation2D(
      JSON.stringify(equation),
      var1,
      var2,
      desiredWindow.minX,
      desiredWindow.maxX,
      desiredWindow.minY,
      desiredWindow.maxY,
      depth,
      searchDepth,
      varValues
    );
  };

  return useWorkQueue(
    work,
    [equation, axes[0], axes[1], desiredWindow, depth, searchDepth, varValues],
    new Float64Array(0)
  );
}
