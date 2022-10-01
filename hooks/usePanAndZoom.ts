import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from "react";

export function useDragPan<Value>(
  value: Value,
  pan: (oldValue: Value, dx: number, dy: number) => void,
  zoom: (zoomFactor: number, zoomCenter: [number, number]) => void
) {
  interface DragState {
    startX: number;
    startY: number;
    startValue: Value;
  }

  const [dragState, setDragState] = useState<DragState | null>(null);

  const onMouseDown: MouseEventHandler = (event) => {
    setDragState({
      startX: event.clientX,
      startY: event.clientY,
      startValue: value,
    });
  };

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragState === null) return;

      pan(
        dragState.startValue,
        event.clientX - dragState.startX,
        event.clientY - dragState.startY
      );
    },
    [dragState, pan]
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      if (dragState === null) return;

      pan(
        dragState.startValue,
        event.clientX - dragState.startX,
        event.clientY - dragState.startY
      );

      setDragState(null);
    },
    [dragState, pan]
  );

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      let zoomAmount = -event.deltaY / 100;
      // zoomAmount = normalizeZoomAmount(range, zoomAmount, minR, maxR);
      zoom(1 - zoomAmount, [event.clientX - ]);
    },
    [zoom]
  );

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return { onMouseDown, onWheel };
}

function normalizeZoomAmount(range, zoomAmount, minR, maxR) {
  const currentR = Math.min(
    (range[0][1] - range[0][0]) / 2,
    (range[1][1] - range[1][0]) / 2
  );
  if (minR) {
    if ((1 - zoomAmount) * currentR < minR) {
      zoomAmount = 1 - minR / currentR;
    }
  }
  if (maxR) {
    if ((1 - zoomAmount) * currentR > maxR) {
      zoomAmount = 1 - maxR / currentR;
    }
  }
  return zoomAmount;
}
