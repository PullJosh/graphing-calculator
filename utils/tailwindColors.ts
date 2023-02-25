import { Color } from "../types";
import { Color as ThreeColor } from "three";

const rgbStrings = {
  red: "rgb(220, 38, 38)",
  blue: "rgb(37, 99, 235)",
  black: "rgb(17, 24, 39)",
};

export function getColor(color: Color | ThreeColor): string | ThreeColor {
  if (typeof color === "string") {
    return rgbStrings[color];
  }

  return color;
}
