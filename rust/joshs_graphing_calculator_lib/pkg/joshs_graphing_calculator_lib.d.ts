/* tslint:disable */
/* eslint-disable */
/**
* @param {string} math_json
* @param {number} x_min
* @param {number} x_max
* @param {number} y_min
* @param {number} y_max
* @param {bigint} depth
* @param {bigint} search_depth
* @returns {Float64Array}
*/
export function graph_equation_to_float_array(math_json: string, x_min: number, x_max: number, y_min: number, y_max: number, depth: bigint, search_depth: bigint): Float64Array;
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
