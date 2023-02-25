import { BoxedExpression } from "@cortex-js/compute-engine";
import type { Box3D } from "../types";

import { useWorkQueue } from "./useWorkQueue";

import { api } from "../workers/graphEquationAPI";
import { Vector3 } from "three";

export function useVectorField(
  expressions: BoxedExpression[],
  desiredWindow: Box3D,
  step: number,
  varValues: Record<string, number> = {},
  paths: { count: number; length: number; stepEpsilon: number } = {
    count: 0,
    length: 0,
    stepEpsilon: 0.01,
  }
) {
  const work = async (
    expressions: BoxedExpression[],
    desiredWindow: Box3D,
    step: number,
    varValues: Record<string, number>,
    paths: { count: number; length: number; stepEpsilon: number }
  ) => {
    const [vectorData, pathData] = await Promise.all([
      api.graphVectorField(
        expressions.map((expression) => JSON.stringify(expression)),
        step,
        desiredWindow.minX,
        desiredWindow.maxX,
        desiredWindow.minY,
        desiredWindow.maxY,
        desiredWindow.minZ,
        desiredWindow.maxZ,
        varValues
      ),
      paths.count > 0 && paths.length > 0
        ? api.graphVectorFieldPaths(
            expressions.map((expression) => JSON.stringify(expression)),
            paths.count,
            paths.length,
            paths.stepEpsilon,
            desiredWindow.minX,
            desiredWindow.maxX,
            desiredWindow.minY,
            desiredWindow.maxY,
            desiredWindow.minZ,
            desiredWindow.maxZ,
            varValues
          )
        : null,
    ]);

    const origins = [];
    const vectors = [];
    let maxLength = 0;

    for (let i = 0; i < vectorData.length; i += 3 + expressions.length) {
      origins.push(
        new Vector3(vectorData[i], vectorData[i + 1], vectorData[i + 2])
      );

      const vec = new Vector3();
      if (expressions.length >= 1) vec.x = vectorData[i + 3];
      if (expressions.length >= 2) vec.y = vectorData[i + 4];
      if (expressions.length >= 3) vec.z = vectorData[i + 5];
      vectors.push(vec);

      maxLength = Math.max(maxLength, vec.length());
    }

    const pathsResult = [];
    if (pathData !== null) {
      for (let i = 0; i < paths.count; i++) {
        pathsResult.push(
          pathData.subarray(i * paths.length * 3, (i + 1) * paths.length * 3)
        );
      }
    }

    return { origins, vectors, maxLength, paths: pathsResult };
  };

  return useWorkQueue(
    work,
    [expressions, desiredWindow, step, varValues, paths],
    {
      origins: [],
      vectors: [],
      maxLength: 0,
      paths: [],
    }
  );
}
