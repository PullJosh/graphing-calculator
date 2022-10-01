import { useContext } from "react";
import classNames from "classnames";
import {
  useCoordinateTransformations,
  GraphContext,
  GraphLayer,
} from "./Graph";

interface GraphPointProps {
  point: [number, number];
  color: "red" | "blue";
  size?: number;
}

export function GraphPoint({ point, color, size = 8 }: GraphPointProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = useCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const pos = toScreenPos(point);

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle
          cx={pos[0]}
          cy={pos[1]}
          r={size}
          className={classNames({
            "fill-red-600": color === "red",
            "fill-blue-600": color === "blue",
          })}
        />
      </svg>
    </GraphLayer>
  );
}
