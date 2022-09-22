import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { Box, Contour, Point, TreeNode } from "../lib";
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

function useContoursForEquation(
  equation: string,
  graphWindow: Box
): {
  tree: TreeNode | null;
  contours: Contour[] | null;
  marchingSquaresContours: Contour[] | null;
} {
  const workerRef = useRef<Worker | null>(null);
  const [contours, setContours] = useState<Contour[] | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [marchingSquaresContours, setMarchingSquaresContours] = useState<
    Contour[] | null
  >(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/graphEquation.worker.ts", import.meta.url)
    );
    workerRef.current.onmessage = (event) => {
      const { data } = event;
      if ("contours" in data) {
        setContours(data.contours);
      }
      if ("tree" in data) {
        setTree(data.tree);
      }
      if ("marchingSquaresContours" in data) {
        setMarchingSquaresContours(data.marchingSquaresContours);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ equation, graphWindow });
  }, [equation, graphWindow]);

  return { tree, contours, marchingSquaresContours };
}

interface GraphEquationProps {
  equation: string;
  color: "red" | "blue";
  debug?: boolean;
}

export function GraphEquation({
  equation,
  color,
  debug = false,
}: GraphEquationProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const { tree, contours, marchingSquaresContours } = useContoursForEquation(
    equation,
    graphWindow
  );
  if (!contours) return null;

  let children: ReactNode[] = [];

  if (debug && tree) {
    const drawTree = (node: TreeNode) => {
      switch (node.type) {
        case "zero": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="blue"
              stroke="navy"
              strokeWidth={1}
            />
          );
          break;
        }
        case "negative": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="#333"
              stroke="#111"
              strokeWidth={1}
            />
          );
          break;
        }
        case "positive": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="#ddd"
              stroke="#ccc"
              strokeWidth={1}
            />
          );
          break;
        }
        case "leaf": {
          const [minX, minY] = toScreenPos([node.box.minX, node.box.minY]);
          const [maxX, maxY] = toScreenPos([node.box.maxX, node.box.maxY]);
          children.push(
            <rect
              key={node.boxPath.join(" ")}
              x={minX}
              y={maxY}
              width={maxX - minX}
              height={Math.abs(maxY - minY)}
              fill="white"
              stroke="lime"
              strokeWidth={1}
            />
          );
          break;
        }
        case "root":
          for (const child of node.children) {
            drawTree(child);
          }
          break;
      }
    };

    drawTree(tree);
  }

  if (debug && marchingSquaresContours) {
    for (let i = 0; i < marchingSquaresContours.length; i++) {
      const contour = marchingSquaresContours[i];
      let points: Point[] = [];

      for (const point of contour.points) {
        points.push(toScreenPos(point));
      }

      children.push(
        <polyline
          key={`msc-${i}`}
          strokeWidth={3}
          className="stroke-purple-600"
          fill="none"
          points={points.map((pt) => pt.join(",")).join(" ")}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );
    }
  }

  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    let points: Point[] = [];

    for (const point of contour.points) {
      points.push(toScreenPos(point));
    }

    children.push(
      <polyline
        key={`c-${i}`}
        strokeWidth={3}
        className={classNames({
          "stroke-red-600": color === "red",
          "stroke-blue-600": color === "blue",
        })}
        fill="none"
        points={points.map((pt) => pt.join(",")).join(" ")}
        strokeLinejoin="round"
        strokeLinecap="round"
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

interface GraphPointProps {
  point: [number, number];
  color: "red" | "blue";
  size?: number;
}

export function GraphPoint({ point, color, size = 8 }: GraphPointProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const pos = toScreenPos(point);

  return (
    <g>
      <circle
        cx={pos[0]}
        cy={pos[1]}
        r={size}
        className={classNames({
          "fill-red-600": color === "red",
          "fill-blue-600": color === "blue",
        })}
      />
    </g>
  );
}

interface GraphLineProps {
  line: [Point, Point];
  color: "red" | "blue";
}

export function GraphLine({ line, color }: GraphLineProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = getCoordinateTransformations(
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
    <g>
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
    </g>
  );
}
