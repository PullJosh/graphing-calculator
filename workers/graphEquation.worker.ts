import {
  graph_equation_to_float_array as graphEquationToFloatArray,
  graph_equation_to_float_array_3d as graphEquationToFloatArray3D,
  graph_vector_field as graphVectorField,
  graph_vector_field_paths as graphVectorFieldPaths,
} from "../rust/joshs_graphing_calculator_lib/pkg/joshs_graphing_calculator_lib";

import { expose } from "comlink";

const api = {
  graphEquation2D: graphEquationToFloatArray,
  graphEquation3D: graphEquationToFloatArray3D,
  graphVectorField,
  graphVectorFieldPaths,
};

export type API = typeof api;

expose(api);
