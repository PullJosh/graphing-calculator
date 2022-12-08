import { graph_equation_to_float_array as graphEquationToFloatArray } from "joshs_graphing_calculator_lib";

import { expose } from "comlink";

const api = {
  graphAllRegionsToFlatContours: async (
    equation: string,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    // regions: number[][],
    depth: bigint,
    searchDepth: bigint
  ) => {
    return (await graphEquationToFloatArray(
      equation,
      minX,
      maxX,
      minY,
      maxY,
      depth,
      searchDepth
    )) as Float64Array;

    /*
    const results = await Promise.all(
      regions.map(
        (region) =>
          graphEquationToFloatArray(
            equation,
            BigInt(region[0]),
            BigInt(region[1]),
            BigInt(region[2]),
            depth,
            searchDepth
          ) as Float64Array
      )
    );

    // Merge all arrays into one
    let finalResults: Float64Array = new Float64Array(
      results.reduce((a, b) => a + b.length, 0) + results.length * 2
    );
    let offset = 0;
    for (const result of results) {
      finalResults.set(result, offset);
      offset += result.length;
      finalResults[offset] = Infinity;
      finalResults[offset + 1] = Infinity;
      offset += 2;
    }
    return finalResults;
    */
  },
};

export type API = typeof api;

expose(api);
