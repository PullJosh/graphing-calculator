import * as math from "mathjs";
import {
  Contour,
  equationToGraphableExpression,
  expressionToFunctionAndGradient,
  generateQuadtree,
  getDualContours,
  getLeafConnections,
  getMarchingSquaresContours,
  TreeNode,
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
    const expressionSet = equationToGraphableExpression(node);

    let contours: Contour[] = [];
    let marchingSquaresContours: Contour[] = [];
    let tree: TreeNode | null = null;

    const { expression } = expressionSet;
    try {
      const [f, df] = expressionToFunctionAndGradient(expression);

      tree = generateQuadtree(f, graphWindow, df, 5, 6);

      marchingSquaresContours = [
        ...marchingSquaresContours,
        ...getMarchingSquaresContours(tree),
      ];

      const leafConnections = getLeafConnections(f, tree);
      const dualContours = getDualContours(leafConnections);

      contours = [...contours, ...dualContours];
    } catch (err) {
      console.error(err);
    }

    postMessage({ tree, contours, marchingSquaresContours });
  } catch (err) {
    console.error(err);
    postMessage({ contours: [] });
  }

  working = false;
});
