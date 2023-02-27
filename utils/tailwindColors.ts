import { Color } from "../types";
import { Color as ThreeColor } from "three";

const namedColors = {
  red: new ThreeColor("rgb(220, 38, 38)"),
  blue: new ThreeColor("rgb(37, 99, 235)"),
  black: new ThreeColor("rgb(17, 24, 39)"),
};

export function getColor(color: Color | ThreeColor): ThreeColor {
  if (typeof color === "string") {
    return namedColors[color];
  }

  return color;
}
