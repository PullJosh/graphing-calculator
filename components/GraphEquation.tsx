import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import type { Box, Contour, Point, TreeNode } from "../lib";
import { useCoordinateTransformations, GraphContext } from "./Graph";
import { GraphContours } from "./GraphContours";

interface GraphEquationProps {
  equation: string;
  color: "red" | "blue";
  debug?: boolean;
}

export function useContoursForEquation(
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

export function GraphEquation({
  equation,
  color,
  debug = false,
}: GraphEquationProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos } = useCoordinateTransformations(
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

  return (
    <GraphContours
      contours={contours.map((contour) => contour.points)}
      color={color}
    />
  );
}
