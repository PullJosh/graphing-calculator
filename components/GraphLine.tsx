import { useContext } from "react";
import classNames from "classnames";
import {
  useCoordinateTransformations,
  GraphContext,
  GraphLayer,
} from "./Graph";
import type { Point } from "../lib";

interface GraphLineProps {
  line: [Point, Point];
  color: "red" | "blue";
}

export function GraphLine({ line, color }: GraphLineProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = useCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const [A, B] = line;

  const start: Point = [
    A[0] + (B[0] - A[0]) * 1000,
    A[1] + (B[1] - A[1]) * 1000,
  ];
  const end: Point = [A[0] - (B[0] - A[0]) * 1000, A[1] - (B[1] - A[1]) * 1000];

  const [sx, sy] = toScreenPos(start);
  const [ex, ey] = toScreenPos(end);

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={sx}
          y1={sy}
          x2={ex}
          y2={ey}
          className={classNames({
            "stroke-red-600": color === "red",
            "stroke-blue-600": color === "blue",
          })}
          strokeWidth={3}
        />
      </svg>
    </GraphLayer>
  );
}
