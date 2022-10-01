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
  contours: Point[][];
  color: "red" | "blue";
}

export function GraphContours({ contours, color }: GraphContoursProps) {
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

  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    let points: Point[] = [];

    for (const point of contour) {
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

    touchTargets.push(
      <polyline
        key={`c-${i}`}
        strokeWidth={50}
        className="stroke-transparent pointer-events-auto"
        onMouseDown={onMouseDown}
        fill="none"
        points={points.map((pt) => pt.join(",")).join(" ")}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    );
  }

  let dragPointText: ReactNode = null;
  if (dragState.dragging) {
    console.log(dragState.pos);
    const nearestPoint = findNearestPoint(contours, dragState.pos);
    const [x, y] = toScreenPos(nearestPoint);
    children.push(
      <circle
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
          {touchTargets}
        </svg>
        {dragPointText}
      </GraphLayer>
    </>
  );
}

function findNearestPoint(contours: Point[][], pos: Point): Point {
  let nearestPoint: Point = contours[0][0];
  let nearestDistance = Infinity;

  for (const contour of contours) {
    for (let i = 1; i < contour.length; i++) {
      const p1 = contour[i - 1];
      const p2 = contour[i];
      const p = closestPointOnSegment(p1, p2, pos);
      const distance = Math.hypot(p[0] - pos[0], p[1] - pos[1]);
      if (distance < nearestDistance) {
        nearestPoint = p;
        nearestDistance = distance;
      }
    }
  }

  return nearestPoint;
}

function closestPointOnSegment(a: Point, b: Point, point: Point): Point {
  const t =
    ((point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1])) /
    ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);

  if (t < 0) return a;
  if (t > 1) return b;
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}
