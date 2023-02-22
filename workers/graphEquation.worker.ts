import {
  graph_equation_to_float_array as graphEquationToFloatArray,
  graph_equation_to_float_array_3d as graphEquationToFloatArray3D,
} from "../rust/joshs_graphing_calculator_lib/pkg/joshs_graphing_calculator_lib";

import { expose } from "comlink";

const api = {
  graphEquation2D: graphEquationToFloatArray,
  graphEquation3D: (
    ...args: Parameters<typeof graphEquationToFloatArray3D>
  ) => {
    return graphEquationToFloatArray3D(...args);
  },
};

export type API = typeof api;

expose(api);
