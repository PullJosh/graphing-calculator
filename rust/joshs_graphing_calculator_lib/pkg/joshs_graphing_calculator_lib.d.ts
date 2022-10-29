/* tslint:disable */
/* eslint-disable */
/**
* @param {string} math_json
* @param {bigint} scale
* @param {bigint} x
* @param {bigint} y
* @param {bigint} depth
* @param {bigint} search_depth
* @returns {string}
*/
export function graph_equation_to_contours_json(math_json: string, scale: bigint, x: bigint, y: bigint, depth: bigint, search_depth: bigint): string;
/**
* @param {string} math_json
* @param {bigint} scale
* @param {bigint} x
* @param {bigint} y
* @param {bigint} depth
* @param {bigint} search_depth
* @returns {Float64Array}
*/
export function graph_equation_to_float_array(math_json: string, scale: bigint, x: bigint, y: bigint, depth: bigint, search_depth: bigint): Float64Array;
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
