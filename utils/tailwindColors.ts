import { Color } from "../types";

const rgbStrings = {
  red: "rgb(220, 38, 38)",
  blue: "rgb(37, 99, 235)",
  black: "rgb(17, 24, 39)",
};

export function getColor(name: Color) {
  return rgbStrings[name];
}
