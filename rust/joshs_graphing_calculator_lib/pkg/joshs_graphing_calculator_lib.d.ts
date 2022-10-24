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
export class GraphRegion {
  free(): void;
/**
* @param {bigint} scale
* @param {bigint} x
* @param {bigint} y
*/
  constructor(scale: bigint, x: bigint, y: bigint);
/**
* @returns {GraphBox}
*/
  to_graph_box(): GraphBox;
}
