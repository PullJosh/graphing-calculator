export type Point = [number, number];

export interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Box3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export type Color = "red" | "blue" | "black";
export type Axis = "x" | "y" | "z";
