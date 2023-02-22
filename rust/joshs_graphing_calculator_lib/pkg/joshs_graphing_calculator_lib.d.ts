/* tslint:disable */
/* eslint-disable */
/**
* @param {string} math_json
* @param {string} var1
* @param {string} var2
* @param {number} x_min
* @param {number} x_max
* @param {number} y_min
* @param {number} y_max
* @param {bigint} depth
* @param {bigint} search_depth
* @param {any} var_values
* @returns {Float64Array}
*/
export function graph_equation_to_float_array(math_json: string, var1: string, var2: string, x_min: number, x_max: number, y_min: number, y_max: number, depth: bigint, search_depth: bigint, var_values: any): Float64Array;
/**
* @param {string} math_json
* @param {string} var1
* @param {string} var2
* @param {string} var3
* @param {number} x_min
* @param {number} x_max
* @param {number} y_min
* @param {number} y_max
* @param {number} z_min
* @param {number} z_max
* @param {any} var_values
* @returns {Float64Array}
*/
export function graph_equation_to_float_array_3d(math_json: string, var1: string, var2: string, var3: string, x_min: number, x_max: number, y_min: number, y_max: number, z_min: number, z_max: number, var_values: any): Float64Array;
/**
*/
export class GraphBox {
  free(): void;
/**
*/
  x_max: number;
/**
*/
  x_min: number;
/**
*/
  y_max: number;
/**
*/
  y_min: number;
}
/**
*/
export class GraphBox3D {
  free(): void;
/**
*/
  x_max: number;
/**
*/
  x_min: number;
/**
*/
  y_max: number;
/**
*/
  y_min: number;
/**
*/
  z_max: number;
/**
*/
  z_min: number;
}
