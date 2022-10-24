import { graph_equation_to_contours_json as graphEquationToContoursJSON } from "joshs_graphing_calculator_lib";

import { expose } from "comlink";
import type { Contour } from "../lib";

const api = {
  // graphEquationToContoursJSON: graph_equation_to_contours_json,
  graphAllRegionsToContours: async (
    equation: string,
    regions: number[][],
    depth: bigint,
    searchDepth: bigint
  ) => {
    const resultsJSON = await Promise.all(
      regions.map((region) =>
        graphEquationToContoursJSON(
          equation,
          BigInt(region[0]),
          BigInt(region[1]),
          BigInt(region[2]),
          depth,
          searchDepth
        )
      )
    );
    const result: Contour[] = resultsJSON.flatMap((json) => JSON.parse(json));
    return result.map((contour) => contour.points).slice(0, 20);
  },
};

export type API = typeof api;

expose(api);
