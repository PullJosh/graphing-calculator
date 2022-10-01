import { ReactNode, useContext } from "react";
import classNames from "classnames";
import {
  useCoordinateTransformations,
  GraphContext,
  GraphLayer,
} from "./Graph";

interface GraphGridProps {
  xStep: number;
  yStep: number;
}

export function GraphGrid({ xStep, yStep }: GraphGridProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = useCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const children: ReactNode[] = [];

  for (
    let x = Math.ceil(graphWindow.minX / xStep) * xStep;
    x <= Math.floor(graphWindow.maxX / xStep) * xStep;
    x += xStep
  ) {
    const [sx, sy] = toScreenPos([x, graphWindow.minY]);
    const [ex, ey] = toScreenPos([x, graphWindow.maxY]);

    children.push(
      <line
        key={`x-${x}`}
        className={classNames({
          "stroke-gray-300": x !== 0,
          "stroke-gray-500": x === 0,
        })}
        strokeWidth={1}
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
      />
    );
  }

  for (
    let y = Math.ceil(graphWindow.minY / yStep) * yStep;
    y <= Math.floor(graphWindow.maxY / xStep) * xStep;
    y += yStep
  ) {
    const [sx, sy] = toScreenPos([graphWindow.minX, y]);
    const [ex, ey] = toScreenPos([graphWindow.maxX, y]);

    children.push(
      <line
        key={`y-${y}`}
        className={classNames({
          "stroke-gray-300": y !== 0,
          "stroke-gray-500": y === 0,
        })}
        strokeWidth={1}
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
      />
    );
  }

  return (
    <GraphLayer>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {children}
      </svg>
    </GraphLayer>
  );
}
