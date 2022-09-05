import * as math from "mathjs";
import {
  Contour,
  equationToGraphableExpressionSet,
  expressionToFunctionAndGradient,
  generateQuadtree,
  getDualContours,
  getLeafConnections,
} from "../lib";

let working = false;

addEventListener("message", (event) => {
  // Ignore updates while currently working
  if (working) return;

  working = true;

  const { data } = event;
  let { equation, graphWindow } = data;

  try {
    const node = math.parse(equation.replaceAll("=", "=="));
    const expressionSet = equationToGraphableExpressionSet(node);

    let contours: Contour[] = [];
    for (const { expression } of expressionSet.include) {
      try {
        const [f, df] = expressionToFunctionAndGradient(expression);

        const tree = generateQuadtree(f, graphWindow, df, 5, 6);
        const leafConnections = getLeafConnections(f, tree);
        const dualContours = getDualContours(leafConnections);

        contours = [...contours, ...dualContours];
      } catch (err) {
        console.error(err);
        continue;
      }
    }
    postMessage({ contours });
  } catch (err) {
    console.error(err);
    postMessage({ contours: [] });
  }

  working = false;
});
