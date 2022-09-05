import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { Box, Contour, Point } from "../lib";
import { useDragPan } from "../hooks/useDragPan";
import classNames from "classnames";

interface GraphContext {
  width: number;
  height: number;
  graphWindow: Box;
}
const GraphContext = createContext<GraphContext | null>(null);

interface GraphProps {
  width?: number;
  height?: number;
  children: ReactNode;
}

export function Graph({ width = 400, height = 400, children }: GraphProps) {
  const [graphWindow, setGraphWindow] = useState<Box>({
    minX: -10,
    maxX: 10,
    minY: -10,
    maxY: 10,
  });

  // Update graph window when width or height changes
  useLayoutEffect(() => {
    setGraphWindow((graphWindow) => {
      let aspectRatio = width / height;
      if (isNaN(aspectRatio)) aspectRatio = 1;

      // When updating graph window, preserve the overall area being displayed
      const area =
        (graphWindow.maxX - graphWindow.minX) *
        (graphWindow.maxY - graphWindow.minY);

      const newGraphWidth = Math.sqrt(area * aspectRatio);
      const newGraphHeight = Math.sqrt(area / aspectRatio);
      const centerX = (graphWindow.maxX + graphWindow.minX) / 2;
      const centerY = (graphWindow.maxY + graphWindow.minY) / 2;

      return {
        minX: centerX - newGraphWidth / 2,
        maxX: centerX + newGraphWidth / 2,
        minY: centerY - newGraphHeight / 2,
        maxY: centerY + newGraphHeight / 2,
      };
    });
  }, [width, height]);

  const { onMouseDown } = useDragPan(graphWindow, (oldWindow, dx, dy) => {
    const xScale = (oldWindow.maxX - oldWindow.minX) / width;
    const yScale = (oldWindow.maxY - oldWindow.minY) / height;

    setGraphWindow({
      minX: oldWindow.minX - dx * xScale,
      maxX: oldWindow.maxX - dx * xScale,
      minY: oldWindow.minY + dy * yScale,
      maxY: oldWindow.maxY + dy * yScale,
    });
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onMouseDown={onMouseDown}
    >
      <GraphContext.Provider value={{ width, height, graphWindow }}>
        {children}
      </GraphContext.Provider>
    </svg>
  );
}

function getCoordinateTransformations(
  graphWindow: Box,
  width: number,
  height: number
) {
  const toScreenPos = ([x, y]: [number, number]): [number, number] => {
    return [
      0.5 +
        width *
          ((x - graphWindow.minX) / (graphWindow.maxX - graphWindow.minX)),
      0.5 +
        height *
          (1 - (y - graphWindow.minY) / (graphWindow.maxY - graphWindow.minY)),
    ];
  };

  return { toScreenPos };
}

interface GraphEquationProps {
  equation: string;
  color: "red" | "blue";
}

function useContoursForEquation(
  equation: string,
  graphWindow: Box
): Contour[] | null {
  const workerRef = useRef<Worker | null>(null);
  const [contours, setContours] = useState<Contour[] | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/graphEquation.worker.ts", import.meta.url)
    );
    workerRef.current.onmessage = (event) => {
      const { data } = event;
      if ("contours" in data) {
        setContours(data.contours);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ equation, graphWindow });
  }, [equation, graphWindow]);

  return contours;
}

export function GraphEquation({ equation, color }: GraphEquationProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const contours = useContoursForEquation(equation, graphWindow);
  if (!contours) return null;

  let children: ReactNode[] = [];
  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    let points: Point[] = [];

    for (const point of contour.points) {
      points.push(toScreenPos(point));
    }

    children.push(
      <polyline
        key={i}
        strokeWidth={3}
        className={classNames({
          "stroke-red-600": color === "red",
          "stroke-blue-600": color === "blue",
        })}
        fill="none"
        points={points.map((pt) => pt.join(",")).join(" ")}
      />
    );
  }

  return <g>{children}</g>;
}

interface GraphGridProps {
  xStep: number;
  yStep: number;
}

export function GraphGrid({ xStep, yStep }: GraphGridProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
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

  return <g>{children}</g>;
}
