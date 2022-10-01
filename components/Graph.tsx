import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { Box, Contour, Point, TreeNode } from "../lib";
import { useDragPan } from "../hooks/useDragPan";

interface GraphContext {
  width: number;
  height: number;
  graphWindow: Box;
}

export const GraphContext = createContext<GraphContext | null>(null);

interface GraphProps {
  width?: number;
  height?: number;
  children: ReactNode;
}

export function Graph({ width = 400, height = 400, children }: GraphProps) {
  const [graphWindow, setGraphWindow] = useState<Box>({
    minX: -4,
    maxX: 4,
    minY: -4,
    maxY: 4,
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
    <div
      className="relative"
      style={{ width, height }}
      onMouseDown={onMouseDown}
    >
      <GraphContext.Provider value={{ width, height, graphWindow }}>
        {children}
      </GraphContext.Provider>
    </div>
  );
}

interface GraphLayerProps {
  children: ReactNode;
  level?: "base" | "touchTarget";
}

export function GraphLayer({ children, level = "base" }: GraphLayerProps) {
  const zMap = {
    base: 500,
    touchTarget: 1000,
  };

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 w-full h-full"
      style={{ zIndex: zMap[level] }}
    >
      {children}
    </div>
  );
}

export function useCoordinateTransformations(
  graphWindow: Box,
  width: number,
  height: number
) {
  const toScreenPos = useCallback(
    ([x, y]: [number, number]): [number, number] => {
      return [
        0.5 +
          width *
            ((x - graphWindow.minX) / (graphWindow.maxX - graphWindow.minX)),
        0.5 +
          height *
            (1 -
              (y - graphWindow.minY) / (graphWindow.maxY - graphWindow.minY)),
      ];
    },
    [graphWindow, width, height]
  );

  const toGraphPos = useCallback(
    ([x, y]: [number, number]): [number, number] => {
      return [
        graphWindow.minX +
          ((x - 0.5) / width) * (graphWindow.maxX - graphWindow.minX),
        graphWindow.maxY -
          ((y - 0.5) / height) * (graphWindow.maxY - graphWindow.minY),
      ];
    },
    [graphWindow, width, height]
  );

  return { toScreenPos, toGraphPos };
}
