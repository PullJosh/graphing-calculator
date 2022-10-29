import classNames from "classnames";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Point } from "../lib";
import {
  useCoordinateTransformations,
  GraphContext,
  GraphLayer,
} from "./Graph";

interface GraphContoursProps {
  flatContours: Float64Array;
  color: "red" | "blue";
}

export function GraphContours({ flatContours, color }: GraphContoursProps) {
  const { width, height, graphWindow } = useContext(GraphContext)!;

  const { toScreenPos, toGraphPos } = useCoordinateTransformations(
    graphWindow,
    width,
    height
  );

  const touchTargetSVGRef = useRef<SVGSVGElement>(null);

  type DragState =
    | { dragging: false }
    | { dragging: true; pos: [number, number] };
  const [dragState, setDragState] = useState<DragState>({ dragging: false });

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const rect = touchTargetSVGRef.current!.getBoundingClientRect();
      setDragState({
        dragging: true,
        pos: toGraphPos([event.clientX - rect.left, event.clientY - rect.top]),
      });
    },
    [toGraphPos]
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      const rect = touchTargetSVGRef.current!.getBoundingClientRect();
      setDragState((dragState) =>
        dragState.dragging
          ? {
              dragging: true,
              pos: toGraphPos([
                event.clientX - rect.left,
                event.clientY - rect.top,
              ]),
            }
          : { dragging: false }
      );
    },
    [toGraphPos]
  );

  const onMouseUp = useCallback((event: MouseEvent) => {
    setDragState({ dragging: false });
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [onMouseUp, onMouseMove]);

  let children: ReactNode[] = [];
  let touchTargets: ReactNode[] = [];

  let points: [number, number][] = [];
  for (let i = 0; i < flatContours!.length; i += 2) {
    if (flatContours![i] === Infinity) {
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

      touchTargets.push(
        <polyline
          key={`c-${i}`}
          strokeWidth={30}
          className="stroke-transparent pointer-events-auto"
          fill="none"
          points={points.map((pt) => pt.join(",")).join(" ")}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );

      points = [];
    } else {
      points.push(toScreenPos([flatContours![i], flatContours![i + 1]]));
    }
  }

  let dragPointText: ReactNode = null;
  if (dragState.dragging) {
    const nearestPoint = findNearestPoint(flatContours, dragState.pos);
    const [x, y] = toScreenPos(nearestPoint);
    children.push(
      <circle
        key="drag-point"
        cx={x}
        cy={y}
        r={8}
        className={classNames({
          "fill-red-600": color === "red",
          "fill-blue-600": color === "blue",
        })}
      />
    );

    const formatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    });
    dragPointText = (
      <div
        className="absolute ml-4 mb-4 bg-white px-2 py-1 border shadow-sm rounded whitespace-nowrap"
        style={{ bottom: `calc(100% - ${y}px)`, left: x }}
      >
        ({formatter.format(nearestPoint[0])},{" "}
        {formatter.format(nearestPoint[1])})
      </div>
    );
  }

  return (
    <>
      <GraphLayer>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {children}
        </svg>
      </GraphLayer>
      <GraphLayer level="touchTarget">
        <svg
          ref={touchTargetSVGRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          <g onMouseDown={onMouseDown}>{touchTargets}</g>
        </svg>
        {dragPointText}
      </GraphLayer>
    </>
  );
}

function findNearestPoint(flatContours: Float64Array, pos: Point): Point {
  let nearestPoint: Point = [flatContours[0], flatContours[1]];
  let nearestDistance = Infinity;

  for (let i = 0; i < flatContours.length - 2; i += 2) {
    const x = flatContours[i];
    const y = flatContours[i + 1];
    const x2 = flatContours[i + 2];
    const y2 = flatContours[i + 3];
    if (x === Infinity || x2 === Infinity) {
      continue;
    }
    const p = closestPointOnSegment(x, y, x2, y2, pos);
    const distance = Math.hypot(p[0] - pos[0], p[1] - pos[1]);
    if (distance < nearestDistance) {
      nearestPoint = p;
      nearestDistance = distance;
    }
  }

  return nearestPoint;
}

function closestPointOnSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  point: Point
): Point {
  const t =
    ((point[0] - x1) * (x2 - x1) + (point[1] - y1) * (y2 - y1)) /
    ((x2 - x1) ** 2 + (y2 - y1) ** 2);

  if (t < 0) return [x1, y1];
  if (t > 1) return [x2, y2];
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}
