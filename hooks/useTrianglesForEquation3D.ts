import { BoxedExpression } from "@cortex-js/compute-engine";
import type { Box3D } from "../types";

import { useWorkQueue } from "./useWorkQueue";

import { api } from "../workers/graphEquationAPI";

export function useTrianglesForEquation3D(
  equation: BoxedExpression,
  desiredWindow: Box3D,
  varValues: Record<string, number> = {},
  axes: [string, string, string] = ["x", "y", "z"]
) {
  const work = async (
    equation: BoxedExpression,
    var1: string,
    var2: string,
    var3: string,
    desiredWindow: Box3D,
    varValues: Record<string, number>
  ) => {
    let result;

    try {
      // console.log("before result");
      result = api.graphEquation3D(
        JSON.stringify(equation),
        var1,
        var2,
        var3,
        desiredWindow.minX,
        desiredWindow.maxX,
        desiredWindow.minY,
        desiredWindow.maxY,
        desiredWindow.minZ,
        desiredWindow.maxZ,
        varValues
      );
      // console.log("result promise", result);
      result = await result;
      // console.log("after result", result);
    } catch (err) {
      console.error("Error while doing 3D graphing work:", err);
      throw err;
    }

    return result;
  };

  return useWorkQueue(
    work,
    [equation, axes[0], axes[1], axes[2], desiredWindow, varValues],
    new Float64Array(0)
  );
}
