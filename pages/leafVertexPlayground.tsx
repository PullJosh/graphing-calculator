import { useState } from "react";
import {
  Graph,
  GraphEquation,
  GraphGrid,
  GraphLine,
  GraphPoint,
} from "../components/Graph";

import {
  equationToGraphableExpression,
  expressionToFunctionAndGradient,
  getLeafVertex,
  normalize,
  Point,
} from "../lib/index";
import * as math from "mathjs";

export default function LeafVertexPlayground() {
  const [pointA, setPointA] = useState<Point>([-5, 0]);
  const [pointB, setPointB] = useState<Point>([-4, 3]);
  const [eq, setEq] = useState("x^2 +y^2 = 25");

  let leafPoint: Point | null = null;
  let normalA: Point | null = null,
    normalB: Point | null = null;
  try {
    const node = math.parse(eq.replaceAll("=", "=="));
    const { expression } = equationToGraphableExpression(node);
    const [f, df] = expressionToFunctionAndGradient(expression);
    leafPoint = getLeafVertex(
      { minX: -10, maxX: 10, minY: -10, maxY: 10 },
      [[pointA, pointB]],
      df
    );
    normalA = normalize(df(...pointA));
    normalB = normalize(df(...pointB));
  } catch (err) {
    console.error(err);
  }

  return (
    <div>
      <label className="block">
        Point A: (
        <input
          type="number"
          value={pointA[0]}
          onChange={(event) =>
            setPointA([Number(event.target.value), pointA[1]])
          }
        />
        ,{" "}
        <input
          type="number"
          value={pointA[1]}
          onChange={(event) =>
            setPointA([pointA[0], Number(event.target.value)])
          }
        />
        )
      </label>
      <label className="block">
        Point B: (
        <input
          type="number"
          value={pointB[0]}
          onChange={(event) =>
            setPointB([Number(event.target.value), pointB[1]])
          }
        />
        ,{" "}
        <input
          type="number"
          value={pointB[1]}
          onChange={(event) =>
            setPointB([pointB[0], Number(event.target.value)])
          }
        />
        )
      </label>
      <label className="block">
        Equation:{" "}
        <input value={eq} onChange={(event) => setEq(event.target.value)} />
      </label>
      <div className="border border-gray-400 w-[400px] h-[400px]">
        <Graph width={400} height={400}>
          <GraphGrid xStep={1} yStep={1} />
          <GraphEquation equation={eq} color="red" />
          <GraphPoint point={pointA} color="blue" />
          {normalA && (
            <GraphLine
              line={[pointA, [pointA[0] + normalA[1], pointA[1] - normalA[0]]]}
              color="blue"
            />
          )}
          <GraphPoint point={pointB} color="blue" />
          {normalB && (
            <GraphLine
              line={[pointB, [pointB[0] + normalB[1], pointB[1] - normalB[0]]]}
              color="blue"
            />
          )}
          {normalA && (
            <GraphPoint
              point={[pointA[0] + normalA[0], pointA[1] + normalA[1]]}
              color="red"
              size={3}
            />
          )}
          {normalB && (
            <GraphPoint
              point={[pointB[0] + normalB[0], pointB[1] + normalB[1]]}
              color="red"
              size={3}
            />
          )}
          {leafPoint && <GraphPoint point={leafPoint} color="red" />}
        </Graph>
      </div>
      {leafPoint && (
        <div>
          Leaf: ({leafPoint[0]}, {leafPoint[1]})
        </div>
      )}
      {!leafPoint && <div>No leaf found</div>}
    </div>
  );
}
