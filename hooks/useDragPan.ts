import { MouseEventHandler, useCallback, useEffect, useState } from "react";

export function useDragPan<Value>(
  value: Value,
  update: (oldValue: Value, dx: number, dy: number) => void
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

      update(
        dragState.startValue,
        event.clientX - dragState.startX,
        event.clientY - dragState.startY
      );
    },
    [dragState, update]
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      if (dragState === null) return;

      update(
        dragState.startValue,
        event.clientX - dragState.startX,
        event.clientY - dragState.startY
      );

      setDragState(null);
    },
    [dragState, update]
  );

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return { onMouseDown };
}
