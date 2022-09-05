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

function normalize([x, y]: [number, number]): [number, number] {
  const length = Math.hypot(x, y) ?? 1;
  return [x / length, y / length];
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

  type Point = [number, number];
  function getLeafSegments(classification: number, box: Box): [Point, Point][] {
    // "method of false position"
    const findZero = (a: Point, b: Point): Point => {
      const fa = f(...a);
      const fb = f(...b);
      let t = -fa / (fb - fa);
      if (fa === fb) {
        t = 0.5;
      }
      // Use t = 0.5 to visualize the joints more directly
      // t = 0.5;
      return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    };

    const bottomLeft: Point = [box.minX, box.minY];
    const bottomRight: Point = [box.maxX, box.minY];
    const topLeft: Point = [box.minX, box.maxY];
    const topRight: Point = [box.maxX, box.maxY];

    const left = (): Point => findZero(bottomLeft, topLeft);
    const right = (): Point => findZero(bottomRight, topRight);
    const top = (): Point => findZero(topLeft, topRight);
    const bottom = (): Point => findZero(bottomLeft, bottomRight);

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

  // Old method that relies on guess-and-check (vs. actually solving)
  function getLeafVertex(box: Box, segments: [Point, Point][]): Point | null {
    const points = segments.flat();

    if (points.length >= 2) {
      // Build a cost function that gives each
      // possible vertex point a terribleness score
      const cost = (v: Point): number => {
        let result = 0;
        for (const point of points) {
          let normalVector = df(...point);
          if (normalVector[0] === 0 && normalVector[1] === 0) {
            // If the gradient is zero, we may be at a corner (because
            // the gradient function defaults to returning 0 when the
            // actual derivative is undefined).
            // Since we're trying to find the corner point, and this
            // may be it, penalize `v` for being far from here.
            result += Math.hypot(v[0] - point[0], v[1] - point[1]);
            continue;
          }
          normalVector = normalize(normalVector);
          const projectionDist =
            (v[0] - point[0]) * normalVector[0] +
            (v[1] - point[1]) * normalVector[1]; // Dot product
          result += projectionDist ** 2;
        }

        return result;
      };

      // Find low-cost point by trial and error
      let bestPoint: Point = [
        (box.minX + box.maxX) / 2,
        (box.minY + box.maxY) / 2,
      ];
      let bestCost = Infinity;
      for (let x = 0; x <= 1; x += 0.1) {
        for (let y = 0; y <= 1; y += 0.1) {
          const newPoint: Point = [
            box.minX * x + box.maxX * (1 - x),
            box.minY * y + box.maxY * (1 - y),
          ];
          const newCost = cost(newPoint);
          if (newCost < bestCost) {
            bestCost = newCost;
            bestPoint = newPoint;
          }
        }
      }

      return bestPoint;
    }

    return null;
  }

  /*
  function getLeafVertex(box: Box, segments: [Point, Point][]): Point | null {
    // Get flat list of points (from segments)
    const points = segments.flat();

    if (points.length < 2) {
      return null;
    }

    // Get average of all points
    let center: Point = points.reduce(
      (sum, point): Point => [sum[0] + point[0], sum[1] + point[1]],
      [0, 0]
    );
    center[0] /= points.length;
    center[1] /= points.length;

    // For each point, get the normal (unit) vector based on the gradient function
    const normals: Point[] = points.map((pt) => normalize(df(...pt)));

    // Vector operations
    const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
    const subtract = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
    const dot = (a: number[], b: number[]): number =>
      a.map((x, i) => x * b[i]).reduce((a, b) => a + b, 0);

    // Matrix operations
    const transpose = (matrix: number[][]): number[][] =>
      matrix[0].map((_, i) => matrix.map((row) => row[i]));
    const multiply = (a: number[][], b: number[][]): number[][] =>
      a.map((row) => b[0].map((_, i) => dot(row, transpose(b)[i])));
    const inverse = (
      matrix: number[][]
    ): [[number, number], [number, number]] => {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det],
      ];
    };

    // We want to find a least-squares solution to Ax = b, where A and b are as follows:
    const A = [
      ...points,
      // [box.minX, (box.minY + box.maxY) / 2],
      // [(box.minX + box.maxX) / 2, box.minY],
    ]; // Matrix with n rows and 2 columns
    const b = [
      ...points.map(
        (pt, i) => [dot(subtract(pt, center), normals[i])] as [number]
      ),
      // [dot(subtract([box.minX, (box.minY + box.maxY) / 2], center), [1, 0])] as [number],
      // [dot(subtract([(box.minX + box.maxX) / 2, box.minY], center), [0, 1])] as [number],
    ];

    // The least-squares solution is x = (A^T A)^-1 A^T b
    const A_T = transpose(A);
    const x: Point = transpose(
      multiply(multiply(inverse(multiply(A_T, A)), A_T), b)
    )[0] as Point;

    let result = add(center, x);
    result[0] = Math.max(box.minX, Math.min(box.maxX, result[0]));
    result[1] = Math.max(box.minY, Math.min(box.maxY, result[1]));
    
    return result;
  }
  */

  // Given a particular box, grab the four vertex values
  // and use those values to create a linear approximation
  // of f(x, y).
  // function interpolate(box: Box): (x: number, y: number) => number {
  //   const { minX, maxX, minY, maxY } = box;

  //   const approxF = (x: number, y: number): number => {
  //     const dx = (x - minX) / (maxX - minX);
  //     const dy = (y - minY) / (maxY - minY);
  //     const ab = f(minX, minY) * (1 - dx) + f(maxX, minY) * dx;
  //     const cd = f(minX, maxY) * (1 - dx) + f(maxX, maxY) * dx;
  //     return ab * (1 - dy) + cd * dy;
  //   };

  //   return approxF;
  // }

  // Simplify the tree by merging leaves in areas where the
  // contour is mostly "flat" (i.e. well approximated by linear interpolation).
  // This means the leaves will be larger and less precise in simpler areas
  // and smaller and more complicated in more complex areas.
  // function mergeLeaves(
  //   treeNode: TreeNode,
  //   requiredDepth = 0,
  //   threshold = 0.001
  // ): TreeNode {
  //   if (treeNode.type !== "root") {
  //     return treeNode;
  //   }

  //   // This is a root node. Begin by recursively
  //   // applying mergeLeaves to all children
  //   const newChildren = treeNode.children.map((child) =>
  //     mergeLeaves(child, requiredDepth - 1, threshold)
  //   ) as [TreeNode, TreeNode, TreeNode, TreeNode];

  //   const newNode = {
  //     ...treeNode,
  //     children: newChildren,
  //   };

  //   if (requiredDepth <= 0) {
  //     if (newNode.children.some((child) => child.type === "leaf")) {
  //       const { minX, maxX, minY, maxY } = newNode.box;
  //       const midX = (minX + maxX) / 2;
  //       const midY = (minY + maxY) / 2;

  //       const approxF = interpolate(newNode.box);
  //       const score = (x: number, y: number) => {
  //         return Math.abs(approxF(x, y) - f(x, y));
  //       };

  //       // If the behavior of f is roughly linear here, merge all
  //       // the children into a single leaf node
  //       if (
  //         score(midX, midY) < threshold &&
  //         score(midX, minY) < threshold &&
  //         score(maxX, midY) < threshold &&
  //         score(minX, midY) < threshold &&
  //         score(midX, maxY) < threshold
  //       ) {
  //         const vertexValues = getBoxVertexValues(newNode.box);
  //         const classification = getLeafClassification(vertexValues);
  //         const segments = getLeafSegments(classification, newNode.box);
  //         const vertex = getLeafVertex(newNode.box, segments);
  //         return {
  //           type: "leaf",
  //           boxPath: newNode.boxPath,
  //           box: newNode.box,
  //           classification,
  //           segments,
  //           vertex,
  //         };
  //       }
  //     }
  //   }

  //   return newNode;
  // }

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
        const segments = getLeafSegments(classification, box);
        const vertex = getLeafVertex(box, segments);
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
  // tree = mergeLeaves(tree, searchDepth, 0.001);
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

export interface GraphableExpressionSet {
  include: {
    expression: math.MathNode;
    opWithZero: "="; // "<" | "<=" | "=" | ">=" | ">";
  }[];
  exclude: {
    expression: math.MathNode;
    opWithZero: "="; // "<" | "<=" | "=" | ">=" | ">";
  }[];
}

export function equationToGraphableExpressionSet(
  node: math.MathNode
): GraphableExpressionSet {
  function mergeSets(
    expressionSets: GraphableExpressionSet[]
  ): GraphableExpressionSet {
    return {
      include: expressionSets.flatMap((set) => set.include),
      exclude: expressionSets.flatMap((set) => set.exclude),
    };
  }

  function negateSet(
    expressionSet: GraphableExpressionSet
  ): GraphableExpressionSet {
    return {
      include: expressionSet.exclude,
      exclude: expressionSet.include,
    };
  }

  function step(node: math.MathNode): GraphableExpressionSet {
    if (node.type === "AssignmentNode") {
      return step(
        new math.OperatorNode("==", "equal", [node.object, node.value])
      );
    }

    if (node.type === "OperatorNode") {
      if (node.fn === "equal") {
        return step(new math.OperatorNode("-", "subtract", node.args));
      }
      if (node.fn === "multiply") {
        return mergeSets(node.args.map(step));
      }
      if (node.fn === "divide") {
        return mergeSets([step(node.args[0]), negateSet(step(node.args[1]))]);
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

    return {
      include: [{ expression: node, opWithZero: "=" }],
      exclude: [],
    };
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
    const averageGoodResults = (values: any[]): number => {
      let result: number = 0;
      let numberOfIncludedPoints = 0;
      for (const value of values) {
        if (isReasonableReal(value)) {
          result += value;
          numberOfIncludedPoints++;
        }
      }
      if (numberOfIncludedPoints > 0) {
        result /= numberOfIncludedPoints;
      }
      return result;
    };
    const epsilon = 0.0001;

    let dx = dfdx.evaluate({ x, y });
    if (!isReasonableReal(dx)) {
      // This very dumb trick is a Josh original. If the derivative is undefined,
      // calculate its value at nearby points and take the average.
      dx = averageGoodResults([
        dfdx.evaluate({ x: x + epsilon, y: y + epsilon }),
        dfdx.evaluate({ x: x - epsilon, y: y + epsilon }),
        dfdx.evaluate({ x: x + epsilon, y: y - epsilon }),
        dfdx.evaluate({ x: x - epsilon, y: y - epsilon }),
      ]);
    }

    let dy = dfdy.evaluate({ x, y });
    if (!isReasonableReal(dy)) {
      dy = averageGoodResults([
        dfdy.evaluate({ x: x + epsilon, y: y + epsilon }),
        dfdy.evaluate({ x: x - epsilon, y: y + epsilon }),
        dfdy.evaluate({ x: x + epsilon, y: y - epsilon }),
        dfdy.evaluate({ x: x - epsilon, y: y - epsilon }),
      ]);
    }

    return [dx, dy];
  };

  return [f, df];
}

export function graphExpressionSet(
  graphableExpressionSet: GraphableExpressionSet,
  graphWindow: Box,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  function toScreenPos([x, y]: [number, number]): [number, number] {
    return [
      0.5 +
        width *
          ((x - graphWindow.minX) / (graphWindow.maxX - graphWindow.minX)),
      0.5 +
        height *
          (1 - (y - graphWindow.minY) / (graphWindow.maxY - graphWindow.minY)),
    ];
  }

  function drawTreeStructure(treeNode: TreeNode) {
    const drawRect = (box: Box) => {
      const topLeft = toScreenPos([box.minX, box.maxY]);
      ctx.rect(
        topLeft[0],
        topLeft[1],
        (width * (box.maxX - box.minX)) / (graphWindow.maxX - graphWindow.minX),
        (height * (box.maxY - box.minY)) / (graphWindow.maxY - graphWindow.minY)
      );
    };

    switch (treeNode.type) {
      case "root":
        for (const child of treeNode.children) {
          drawTreeStructure(child);
        }
        break;
      case "positive":
        ctx.beginPath();
        // ctx.fillStyle = "white";
        ctx.strokeStyle = "#eee";
        ctx.lineWidth = 1;
        drawRect(treeNode.box);
        // ctx.fill();
        ctx.stroke();
        break;
      case "negative":
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.fillStyle = "#222";
        ctx.lineWidth = 1;
        drawRect(treeNode.box);
        // ctx.fill();
        ctx.stroke();
        break;
      case "zero":
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 1;
        drawRect(treeNode.box);
        ctx.fill();
        ctx.stroke();
        break;
      case "leaf": {
        ctx.beginPath();
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 1;
        drawRect(treeNode.box);
        ctx.stroke();
      }
    }
  }

  function drawContours(contours: Contour[], color: string = "black") {
    for (const contour of contours) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.moveTo(...toScreenPos(contour.points[0]));
      for (const point of contour.points.slice(1)) {
        ctx.lineTo(...toScreenPos(point));
      }
      ctx.stroke();
    }
  }

  function drawVectorField(
    f: (x: number, y: number) => [x: number, y: number]
  ) {
    let maxLength = 0;
    for (let i = 0; i <= 20; i++) {
      for (let j = 0; j <= 20; j++) {
        const x =
          graphWindow.minX + (i / 20) * (graphWindow.maxX - graphWindow.minX);
        const y =
          graphWindow.minY + (j / 20) * (graphWindow.maxY - graphWindow.minY);

        const length = Math.hypot(...f(x, y));
        if (length > maxLength) {
          maxLength = length;
        }
      }
    }

    for (let i = 0; i <= 20; i++) {
      for (let j = 0; j <= 20; j++) {
        const x =
          graphWindow.minX + (i / 20) * (graphWindow.maxX - graphWindow.minX);
        const y =
          graphWindow.minY + (j / 20) * (graphWindow.maxY - graphWindow.minY);

        let [dx, dy] = f(x, y);
        const length = Math.hypot(dx, dy);
        const newLength = length / Math.max(maxLength, 1);
        dx *= newLength / length;
        dy *= newLength / length;

        ctx.beginPath();
        ctx.fillStyle = "#ccc";
        ctx.arc(...toScreenPos([x, y]), 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.moveTo(...toScreenPos([x, y]));
        const endpoint = toScreenPos([x, y]);
        ctx.lineTo(endpoint[0] + dx * 10, endpoint[1] - dy * 10);
        ctx.stroke();
      }
    }
  }

  for (const { expression } of graphableExpressionSet.include) {
    const [f, df] = expressionToFunctionAndGradient(expression);

    (window as any).f = f;
    (window as any).df = df;

    // drawVectorField(df);

    const tree = generateQuadtree(f, graphWindow, df, 5, 6);
    // drawTreeStructure(tree);

    // const contours = getMarchingSquaresContours(tree);
    // drawContours(contours, "blue");

    const leafConnections = getLeafConnections(f, tree);
    const dualContours = getDualContours(leafConnections);
    drawContours(dualContours);
  }
}
