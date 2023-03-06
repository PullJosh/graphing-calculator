import { Color } from "../types";
import { Color as ThreeColor } from "three";

import colors from "tailwindcss/colors";

const namedColors = {
  red: new ThreeColor(colors.red[600]),
  blue: new ThreeColor(colors.blue[600]),
  black: new ThreeColor(colors.gray[900]),
};

export function getColor(color: Color | ThreeColor): ThreeColor {
  if (typeof color === "string") {
    return namedColors[color];
  }

  return color;
}
