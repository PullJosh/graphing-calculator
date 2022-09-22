import * as math from "mathjs";

export type Point = [number, number];

export interface Contour {
  points: Point[];
}

export interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

type BoxPath = (0 | 1 | 2 | 3)[]; // [] points to root `box`

export type TreeNode =
  | {
      type: "root";
      boxPath: BoxPath;
      box: Box;
      children: [TreeNode, TreeNode, TreeNode, TreeNode];
    }
  | {
      type: "leaf";
      boxPath: BoxPath;
      box: Box;
      classification: number;
      segments: [Point, Point][];
      vertex: Point | null;
    }
  | { type: "negative"; boxPath: BoxPath; box: Box }
  | { type: "positive"; boxPath: BoxPath; box: Box }
  | { type: "zero"; boxPath: BoxPath; box: Box };

function pointsEqual(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function contoursEqual(a: Contour, b: Contour): boolean {
  if (a.points.length !== b.points.length) {
    return false;
  }

  for (let i = 0; i < a.points.length; i++) {
    if (!pointsEqual(a.points[i], b.points[i])) {
      return false;
    }
  }

  return true;
}

function removeDuplicates<T>(arr: T[], isEqual: (a: T, b: T) => boolean): T[] {
  let newArr: T[] = [];

  for (const value of arr) {
    if (!newArr.some((x) => isEqual(x, value))) {
      newArr.push(value);
    }
  }

  return newArr;
}

function simplifyContour(contour: Contour): Contour {
  // Remove adjacent, equal points
  let newContourPoints: Point[] = [];
  for (let i = 0; i < contour.points.length; i++) {
    if (
      i === 0 ||
      !pointsEqual(
        newContourPoints[newContourPoints.length - 1],
        contour.points[i]
      )
    ) {
      newContourPoints.push(contour.points[i]);
    }
  }

  return { points: newContourPoints };
}

function simplifyContours(contours: Contour[]): Contour[] {
  let newContours = contours.map(simplifyContour);

  newContours = removeDuplicates(newContours, contoursEqual);

  // Join adjacent contours
  let done: boolean;
  do {
    done = true;
    $outer: for (let i = 0; i < newContours.length; i++) {
      for (let j = 0; j < newContours.length; j++) {
        if (i === j) continue;

        let mergedContour: Contour | null = null;

        if (pointsEqual(newContours[i].points[0], newContours[j].points[0])) {
          mergedContour = {
            points: [
              ...newContours[i].points.slice(1).reverse(),
              ...newContours[j].points,
            ],
          };
        }

        if (
          pointsEqual(
            newContours[i].points[newContours[i].points.length - 1],
            newContours[j].points[0]
          )
        ) {
          mergedContour = {
            points: [
              ...newContours[i].points,
              ...newContours[j].points.slice(1),
            ],
          };
        }

        if (
          pointsEqual(
            newContours[i].points[newContours[i].points.length - 1],
            newContours[j].points[newContours[j].points.length - 1]
          )
        ) {
          mergedContour = {
            points: [
              ...newContours[i].points,
              ...newContours[j].points.slice(0, -1).reverse(),
            ],
          };
        }

        if (mergedContour !== null) {
          newContours[i] = mergedContour;
          newContours.splice(j, 1);
          done = false;
          break $outer;
        }
      }
    }
  } while (!done);

  return newContours;
}

function derivative(
  f: (x: number, y: number) => number
): (x: number, y: number) => [dx: number, dy: number] {
  const df = (x: number, y: number): [dfdx: number, dfdy: number] => {
    const epsilon = 0.001;
    return [
      (f(x + epsilon, y) - f(x - epsilon, y)) / (2 * epsilon),
      (f(x, y + epsilon) - f(x, y - epsilon)) / (2 * epsilon),
    ];
  };
  return df;
}

export function normalize([x, y]: [number, number]): [number, number] {
  const length = Math.hypot(x, y) || 1;
  return [x / length, y / length];
}

function getBoxVertex(box: Box, vertexNumber: 0 | 1 | 2 | 3): Point {
  switch (vertexNumber) {
    case 0:
      return [box.minX, box.minY];
    case 1:
      return [box.maxX, box.minY];
    case 2:
      return [box.minX, box.maxY];
    case 3:
      return [box.maxX, box.maxY];
  }
}

function getLeafClassification(
  vertexValues: [number, number, number, number]
): number {
  const vertexClassifications = vertexValues.map((value) => {
    if (isNaN(value)) {
      // Always returning true here happens to work for one particular
      // hyperbola I'm graphing, but it might not always be correct.
      return false;
    }
    return value < 0;
  });

  const classification =
    (vertexClassifications[0] ? 8 : 0) +
    (vertexClassifications[1] ? 4 : 0) +
    (vertexClassifications[2] ? 2 : 0) +
    (vertexClassifications[3] ? 1 : 0);

  return classification;
}

// Method of false position
function findZero(f: (...point: Point) => number, a: Point, b: Point): Point {
  const fa = f(...a);
  const fb = f(...b);
  let t = -fa / (fb - fa);
  if (fa === fb) {
    t = 0.5;
  }
  // Use t = 0.5 to visualize the joints more directly
  // t = 0.5;
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

function getLeafSegments(
  classification: number,
  box: Box,
  f: (...point: Point) => number
): [Point, Point][] {
  const bottomLeft: Point = [box.minX, box.minY];
  const bottomRight: Point = [box.maxX, box.minY];
  const topLeft: Point = [box.minX, box.maxY];
  const topRight: Point = [box.maxX, box.maxY];

  const left = (): Point => findZero(f, bottomLeft, topLeft);
  const right = (): Point => findZero(f, bottomRight, topRight);
  const top = (): Point => findZero(f, topLeft, topRight);
  const bottom = (): Point => findZero(f, bottomLeft, bottomRight);

  const lookupTable: [Point, Point][][] = [
    [],
    [[top(), right()]],
    [[left(), top()]],
    [[left(), right()]],
    [[right(), bottom()]],
    [[top(), bottom()]],
    [
      [right(), bottom()],
      [left(), top()],
    ],
    [[left(), bottom()]],
    [[bottom(), left()]],
    [
      [bottom(), left()],
      [top(), right()],
    ],
    [[bottom(), top()]],
    [[bottom(), right()]],
    [[right(), left()]],
    [[top(), left()]],
    [[right(), top()]],
    [],
  ];

  return lookupTable[classification];
}

function inBox(point: Point, box: Box): boolean {
  return (
    point[0] >= box.minX &&
    point[0] <= box.maxX &&
    point[1] >= box.minY &&
    point[1] <= box.maxY
  );
}

// https://www.mattkeeter.com/projects/qef/
export function getLeafVertex(
  box: Box,
  segments: [Point, Point][],
  df: (...point: Point) => [number, number]
): Point | null {
  // Get flat list of points (from segments)
  const points: Point[] = segments.flat();
  if (points.length < 2) return null;

  // For each point, get the normal (unit) vector based on the gradient function
  const normals: Point[] = points.map((pt) => normalize(df(...pt)));

  // Get average of all points
  const center = math.mean(points, 0) as Point;

  const A = math.matrix([...normals]);
  const b = math.matrix(
    points.map((pt, i) => [math.dot(math.subtract(pt, center), normals[i])])
  );

  const A_T_A = math.multiply(math.transpose(A), A);
  const A_T_b = math.multiply(math.transpose(A), b);

  function solve(A_T_A: math.Matrix, A_T_b: math.Matrix): Point {
    try {
      // @ts-expect-error (math.pinv() exists but is not in the types)
      const result = math.multiply(math.pinv(A_T_A), A_T_b);
      return math.add(
        (math.transpose(result).toArray()[0] as number[]).slice(0, 2),
        center
      ) as Point;
    } catch (err) {
      console.error(err);
      console.log(A, b);
      return center;
    }
  }

  let point: Point = solve(A_T_A, A_T_b);

  if (inBox(point, box)) {
    return point;
  }

  const constrain = (
    axis: number,
    value: number
  ): [A_T_A: math.Matrix, A_T_b: math.Matrix] => {
    const sparse = (index: number, length: number) => {
      return new Array(length).fill(0).map((_, i) => (i === index ? 1 : 0));
    };

    return [
      math.concat(
        math.concat(A_T_A, math.matrix(math.transpose([sparse(axis, 2)]))),
        math.matrix([sparse(axis, 3)]),
        0
      ) as math.Matrix,
      math.concat(A_T_b, [[value]], 0) as math.Matrix,
    ];
  };

  const solutions = [
    solve(...constrain(0, box.minX - center[0])),
    solve(...constrain(0, box.maxX - center[0])),
    solve(...constrain(1, box.minY - center[1])),
    solve(...constrain(1, box.maxY - center[1])),
  ];

  const getBestSolution = (solutions: Point[]): Point => {
    const errors = solutions.map((s) =>
      normals
        .map((n, i) => math.dot(math.subtract(s, points[i]), n) ** 2)
        .reduce((a, b) => a + b, 0)
    );
    const minError = math.min(errors);
    return solutions[errors.indexOf(minError)];
  };

  const validSolutions = solutions.filter((s) => inBox(s, box));

  if (validSolutions.length > 0) {
    return getBestSolution(validSolutions);
  }

  return math.add(
    getBestSolution([
      math.subtract([box.minX, box.minY], center),
      math.subtract([box.maxX, box.minY], center),
      math.subtract([box.minX, box.maxY], center),
      math.subtract([box.maxX, box.maxY], center),
    ]),
    center
  );
}

export function generateQuadtree(
  f: (x: number, y: number) => number,
  box: Box,
  df: (x: number, y: number) => [dx: number, dy: number] = derivative(f),
  searchDepth = 3,
  plotDepth = 5
): TreeNode {
  function getBoxAtPath(path: BoxPath): Box {
    let result = box;
    for (let i = 0; i < path.length; i++) {
      const vertexPosition = path[i];
      const isLeft = vertexPosition === 0 || vertexPosition === 2;
      const isBottom = vertexPosition === 0 || vertexPosition === 1;
      result = {
        minX: isLeft ? result.minX : (result.minX + result.maxX) / 2,
        maxX: isLeft ? (result.minX + result.maxX) / 2 : result.maxX,
        minY: isBottom ? result.minY : (result.minY + result.maxY) / 2,
        maxY: isBottom ? (result.minY + result.maxY) / 2 : result.maxY,
      };
    }
    return result;
  }

  function getVertexValue(vertex: Point): number {
    return f(vertex[0], vertex[1]);
  }

  function getBoxVertexValues(box: Box): [number, number, number, number] {
    return [
      getVertexValue(getBoxVertex(box, 0)),
      getVertexValue(getBoxVertex(box, 1)),
      getVertexValue(getBoxVertex(box, 2)),
      getVertexValue(getBoxVertex(box, 3)),
    ];
  }

  function buildTree(boxPath: BoxPath, depth = 0): TreeNode {
    const box = getBoxAtPath(boxPath);

    if (depth >= searchDepth) {
      const vertexValues = getBoxVertexValues(box);

      // All vertex values are == 0
      if (vertexValues.every((v) => v === 0)) {
        return { type: "zero", boxPath, box };
      }

      // All vertex values are < 0
      if (vertexValues.every((v) => v < 0)) {
        return { type: "negative", boxPath, box };
      }

      // All vertex values are >= 0
      if (vertexValues.every((v) => v >= 0)) {
        return { type: "positive", boxPath, box };
      }

      if (depth >= plotDepth) {
        const classification = getLeafClassification(vertexValues);
        const segments = getLeafSegments(classification, box, f);
        const vertex = getLeafVertex(box, segments, df);
        return { type: "leaf", boxPath, box, classification, segments, vertex };
      }
    }

    return {
      type: "root",
      boxPath,
      box,
      children: [
        buildTree([...boxPath, 0], depth + 1),
        buildTree([...boxPath, 1], depth + 1),
        buildTree([...boxPath, 2], depth + 1),
        buildTree([...boxPath, 3], depth + 1),
      ],
    };
  }

  let tree = buildTree([]);
  return tree;
}

type LeafNode = Extract<TreeNode, { type: "leaf" }>;
type LeafNodeWithVertex = Omit<LeafNode, "vertex"> & { vertex: Point };
type LeafConnection = [LeafNodeWithVertex, LeafNodeWithVertex];
export function getLeafConnections(
  f: (x: number, y: number) => number,
  treeNode: TreeNode
): LeafConnection[] {
  function getVerticalConnections(
    treeNodeTop: TreeNode,
    treeNodeBottom: TreeNode
  ): LeafConnection[] {
    if (treeNodeTop.type === "root") {
      if (treeNodeBottom.type === "root") {
        return [
          ...getVerticalConnections(
            treeNodeTop.children[0],
            treeNodeBottom.children[2]
          ),
          ...getVerticalConnections(
            treeNodeTop.children[1],
            treeNodeBottom.children[3]
          ),
        ];
      } else {
        return [
          ...getVerticalConnections(treeNodeTop.children[0], treeNodeBottom),
          ...getVerticalConnections(treeNodeTop.children[1], treeNodeBottom),
        ];
      }
    } else {
      if (treeNodeBottom.type === "root") {
        return [
          ...getVerticalConnections(treeNodeTop, treeNodeBottom.children[2]),
          ...getVerticalConnections(treeNodeTop, treeNodeBottom.children[3]),
        ];
      } else {
        if (treeNodeTop.type === "leaf" && treeNodeBottom.type === "leaf") {
          if (treeNodeTop.vertex !== null && treeNodeBottom.vertex !== null) {
            const edge: [Point, Point] = [
              [
                Math.max(treeNodeTop.box.minX, treeNodeBottom.box.minX),
                treeNodeTop.box.minY,
              ],
              [
                Math.min(treeNodeTop.box.maxX, treeNodeBottom.box.maxX),
                treeNodeTop.box.minY,
              ],
            ];
            const signs = edge.map((pt) => Math.sign(f(...pt)));
            if (signs[0] !== signs[1]) {
              if (!signs.includes(NaN)) {
                return [
                  [
                    treeNodeTop as LeafNodeWithVertex,
                    treeNodeBottom as LeafNodeWithVertex,
                  ],
                ];
              }
            }
          }
        }
        return [];
      }
    }
  }

  function getHorizontalConnections(
    treeNodeLeft: TreeNode,
    treeNodeRight: TreeNode
  ): LeafConnection[] {
    if (treeNodeLeft.type === "root") {
      if (treeNodeRight.type === "root") {
        return [
          ...getHorizontalConnections(
            treeNodeLeft.children[3],
            treeNodeRight.children[2]
          ),
          ...getHorizontalConnections(
            treeNodeLeft.children[1],
            treeNodeRight.children[0]
          ),
        ];
      } else {
        return [
          ...getHorizontalConnections(treeNodeLeft.children[3], treeNodeRight),
          ...getHorizontalConnections(treeNodeLeft.children[1], treeNodeRight),
        ];
      }
    } else {
      if (treeNodeRight.type === "root") {
        return [
          ...getHorizontalConnections(treeNodeLeft, treeNodeRight.children[2]),
          ...getHorizontalConnections(treeNodeLeft, treeNodeRight.children[0]),
        ];
      } else {
        if (treeNodeLeft.type === "leaf" && treeNodeRight.type === "leaf") {
          if (treeNodeLeft.vertex !== null && treeNodeRight.vertex !== null) {
            const edge: [Point, Point] = [
              [
                treeNodeLeft.box.maxX,
                Math.max(treeNodeLeft.box.minY, treeNodeRight.box.minY),
              ],
              [
                treeNodeLeft.box.maxX,
                Math.min(treeNodeLeft.box.maxY, treeNodeRight.box.maxY),
              ],
            ];
            const signs = edge.map((pt) => Math.sign(f(...pt)));
            if (signs[0] !== signs[1]) {
              if (!signs.includes(NaN)) {
                return [
                  [
                    treeNodeLeft as LeafNodeWithVertex,
                    treeNodeRight as LeafNodeWithVertex,
                  ],
                ];
              }
            }
          }
        }
        return [];
      }
    }
  }

  function getFaceConnections(treeNode: TreeNode): LeafConnection[] {
    if (treeNode.type === "root") {
      return [
        ...treeNode.children.flatMap(getFaceConnections),
        ...getVerticalConnections(treeNode.children[2], treeNode.children[0]),
        ...getVerticalConnections(treeNode.children[3], treeNode.children[1]),
        ...getHorizontalConnections(treeNode.children[0], treeNode.children[1]),
        ...getHorizontalConnections(treeNode.children[2], treeNode.children[3]),
      ];
    }

    return [];
  }

  return getFaceConnections(treeNode);
}

export function getMarchingSquaresContours(treeNode: TreeNode): Contour[] {
  let contours: Contour[] = [];

  switch (treeNode.type) {
    case "root":
      for (const child of treeNode.children) {
        contours = [...contours, ...getMarchingSquaresContours(child)];
      }
      break;
    case "leaf":
      for (const segment of treeNode.segments) {
        contours.push({ points: segment });
      }
      break;
  }

  return simplifyContours(contours);
}

export function getDualContours(leafConnections: LeafConnection[]) {
  const contours = leafConnections.map((connection): Contour => {
    return { points: connection.map((leaf) => leaf.vertex) };
  });

  return simplifyContours(contours);
}

/*
  TODO: Find ways to represent...
    - Simple equalities and inequalities
    - Restricted domains
    - Simplified multiplication (graph each term independently, then merge)
    - Inequality chains (e.g. 0.5 < x^2 < x)
*/
export interface GraphableExpression {
  expression: math.MathNode;
  opWithZero: "="; // "<" | "<=" | "=" | ">=" | ">";
}

export function equationToGraphableExpression(
  node: math.MathNode
): GraphableExpression {
  function step(node: math.MathNode): GraphableExpression {
    if (node.type === "AssignmentNode") {
      return step(
        new math.OperatorNode("==", "equal", [node.object, node.value])
      );
    }

    if (node.type === "OperatorNode") {
      if (node.fn === "equal") {
        return step(new math.OperatorNode("-", "subtract", node.args));
      }
      // if (node.fn === "multiply") {
      //   return mergeSets(node.args.map(step));
      // }
      if (node.fn === "divide") {
        // return mergeSets([step(node.args[0]), negateSet(step(node.args[1]))]);
        return step(node.args[0]); // TODO: Constrain domain (denominator != 0)
      }
      if (node.fn === "pow") {
        if (node.args[1].type === "ConstantNode") {
          if (node.args[1].value >= 1) {
            return step(node.args[0]);
          }
        }
      }
      if (node.fn === "unaryMinus" || node.fn === "unaryPlus") {
        return step(node.args[0]);
      }
    }

    if (node.type === "FunctionNode") {
      if (node.fn.name === "abs") {
        return step(node.args[0]);
      }
    }

    node = math.simplify(node);

    return { expression: node, opWithZero: "=" };
  }

  return step(node);
}

export function expressionToFunctionAndGradient(
  expression: math.MathNode
): [
  f: (x: number, y: number) => number,
  df: (x: number, y: number) => [dx: number, dy: number]
] {
  const compiled = expression.compile();
  const f = (x: number, y: number): number => {
    return compiled.evaluate({ x, y });
  };
  const dfdx = math.derivative(expression, "x").compile();
  const dfdy = math.derivative(expression, "y").compile();
  const df = (x: number, y: number): [dx: number, dy: number] => {
    const isReasonableReal = (x: any) => {
      return typeof x === "number" && !isNaN(x) && isFinite(x);
    };
    const isReasonablePair = (dx: number, dy: number): boolean => {
      return isReasonableReal(dx) && isReasonableReal(dy);
    };
    const firstGoodResult = (values: [number, number][]): [number, number] => {
      for (const value of values) {
        if (isReasonablePair(...value)) {
          return value;
        }
      }
      return [0, 0];
    };
    const epsilon = 0.0001;

    let dx = dfdx.evaluate({ x, y });
    let dy = dfdy.evaluate({ x, y });
    if (!isReasonableReal(dx) || !isReasonableReal(dy)) {
      // This very dumb trick is a Josh original. If the derivative is undefined,
      // calculate its value at nearby points and take the average.
      [dx, dy] = firstGoodResult([
        [
          dfdx.evaluate({ x: x + epsilon, y: y + epsilon }),
          dfdy.evaluate({ x: x + epsilon, y: y + epsilon }),
        ],
        [
          dfdx.evaluate({ x: x - epsilon, y: y - epsilon }),
          dfdy.evaluate({ x: x - epsilon, y: y - epsilon }),
        ],
        [
          dfdx.evaluate({ x: x + epsilon, y: y - epsilon }),
          dfdy.evaluate({ x: x + epsilon, y: y - epsilon }),
        ],
        [
          dfdx.evaluate({ x: x - epsilon, y: y + epsilon }),
          dfdy.evaluate({ x: x - epsilon, y: y + epsilon }),
        ],
      ]);
    }

    return [dx, dy];
  };

  return [f, df];
}
