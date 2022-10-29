import {
  createContext,
  MouseEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Box } from "../lib";

interface GraphWindow {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

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
  const [graphWindow, setGraphWindow] = useState<GraphWindow>({
    centerX: 0,
    centerY: 0,
    width: 20,
    height: 20,
  });

  // Update graph window when width or height changes
  useEffect(() => {
    setGraphWindow((graphWindow) => {
      let aspectRatio = width / height;
      if (isNaN(aspectRatio)) aspectRatio = 1;

      // When updating graph window, preserve the overall area being displayed
      const area = graphWindow.width * graphWindow.height;

      const newGraphWidth = Math.sqrt(area * aspectRatio);
      const newGraphHeight = Math.sqrt(area / aspectRatio);

      return {
        centerX: graphWindow.centerX,
        centerY: graphWindow.centerY,
        width: newGraphWidth,
        height: newGraphHeight,
      };
    });
  }, [width, height]);

  const ref = useRef<HTMLDivElement>(null);

  interface DragState {
    startX: number;
    startY: number;
    startValue: GraphWindow;
  }

  const [dragState, setDragState] = useState<DragState | null>(null);

  const onMouseDown: MouseEventHandler = (event) => {
    setDragState({
      startX: event.clientX,
      startY: event.clientY,
      startValue: graphWindow,
    });
  };

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragState === null) return;

      const oldWindow = dragState.startValue;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;

      setGraphWindow({
        centerX: oldWindow.centerX - oldWindow.width * (dx / width),
        centerY: oldWindow.centerY + oldWindow.height * (dy / height),
        width: oldWindow.width,
        height: oldWindow.height,
      });
    },
    [dragState, width, height]
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      if (dragState === null) return;

      const oldWindow = dragState.startValue;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;

      setGraphWindow({
        centerX: oldWindow.centerX - oldWindow.width * (dx / width),
        centerY: oldWindow.centerY + oldWindow.height * (dy / height),
        width: oldWindow.width,
        height: oldWindow.height,
      });

      setDragState(null);
    },
    [dragState, width, height]
  );

  const onWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    let zoomAmount = -event.deltaY / 100;
    setGraphWindow((oldWindow) => {
      const newGraphWidth = oldWindow.width * (1 - zoomAmount);
      const newGraphHeight = oldWindow.height * (1 - zoomAmount);

      const rect = ref.current!.getBoundingClientRect();
      const mx = (event.clientX - rect.left) / rect.width;
      const my = (event.clientY - rect.top) / rect.height;
      const focalX = oldWindow.centerX + oldWindow.width * (mx - 0.5);
      const focalY = oldWindow.centerY + oldWindow.height * (0.5 - my);

      return {
        centerX: focalX + newGraphWidth * (0.5 - mx),
        centerY: focalY + newGraphHeight * (my - 0.5),
        width: newGraphWidth,
        height: newGraphHeight,
      };
    });
  }, []);

  const onScroll = useCallback((event: Event) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    const elem = ref.current;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    elem?.addEventListener("wheel", onWheel, { passive: false });
    elem?.addEventListener("scroll", onScroll, { passive: false });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      elem?.removeEventListener("wheel", onWheel);
      elem?.removeEventListener("scroll", onScroll);
    };
  }, [onMouseMove, onMouseUp, onWheel, onScroll, ref]);

  return (
    <div
      ref={ref}
      className="relative"
      style={{ width, height }}
      onMouseDown={onMouseDown}
    >
      <GraphContext.Provider
        value={{
          width,
          height,
          graphWindow: {
            minX: graphWindow.centerX - graphWindow.width / 2,
            maxX: graphWindow.centerX + graphWindow.width / 2,
            minY: graphWindow.centerY - graphWindow.height / 2,
            maxY: graphWindow.centerY + graphWindow.height / 2,
          },
        }}
      >
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
