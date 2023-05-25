"use client";

import classNames from "classnames";
import { useSlideshowContext } from "./Slideshow";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSlideContext } from "./Slide";

interface BoxProps {
  children:
    | React.ReactNode
    | ((data: { editingContent: boolean }) => React.ReactNode);

  x: number;
  y: number;
  width: number;
  height: number;

  onChange?: (x: number, y: number, width: number, height: number) => void;
  onDelete?: () => void;
}

export function Box({
  children,
  x,
  y,
  width,
  height,
  onChange,
  onDelete,
}: BoxProps) {
  const { mode } = useSlideshowContext();

  const [editingContent, setEditingContent] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={contentRef}
        className="absolute"
        style={{ left: x, top: y, width, height }}
      >
        {typeof children === "function"
          ? children({ editingContent })
          : children}
      </div>
      {mode === "editing" && (
        <DraggableBoxHandles
          x={x}
          y={y}
          width={width}
          height={height}
          onChange={onChange ?? (() => {})}
          onDelete={onDelete}
          editingContent={editingContent}
          setEditingContent={setEditingContent}
          contentRef={contentRef}
        />
      )}
    </>
  );
}

// Overlay that appears above the box while it is selected and
// allows it to be moved around. Note that this does NOT affect
// the rendering of the box itself because it is on a completely
// separate z-layer and purely overlays the box. (It does NOT contain
// the box's content.)
interface DraggableBoxHandlesProps {
  x: number;
  y: number;
  width: number;
  height: number;

  onChange: (x: number, y: number, width: number, height: number) => void;
  onDelete?: () => void;

  editingContent: boolean;
  setEditingContent: (editingContent: boolean) => void;

  contentRef: React.RefObject<HTMLDivElement>;
}

function DraggableBoxHandles({
  x,
  y,
  width,
  height,
  onChange,
  onDelete,
  editingContent,
  setEditingContent,
  contentRef,
}: DraggableBoxHandlesProps) {
  const [selected, setSelected] = useState(false);

  // Handle keyboard shortcuts
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(false);
        setEditingContent(false);
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        if (selected && !editingContent) {
          onDelete?.();
        }
      }
    },
    [editingContent, onDelete, selected, setEditingContent]
  );

  // Dragging and dropping main box area (not handles)
  interface DragStart {
    mouse: { x: number; y: number };
    value: { x: number; y: number; width: number; height: number };
  }
  const [dragStart, setDragStart] = useState<DragStart | null>(null);

  const {
    slideRef,
    width: slideWidth,
    height: slideHeight,
  } = useSlideContext();

  const getMousePositionOnSlide = useCallback(
    (event: MouseEvent) => {
      const bbox = slideRef.current?.getBoundingClientRect()!;

      return {
        x: ((event.clientX - bbox.left) / bbox.width) * slideWidth,
        y: ((event.clientY - bbox.top) / bbox.height) * slideHeight,
      };
    },
    [slideRef, slideWidth, slideHeight]
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      setDragStart((dragStart) => {
        if (dragStart) return dragStart;

        event.preventDefault();

        const pos = getMousePositionOnSlide(event.nativeEvent);
        return {
          mouse: pos,
          value: { x, y, width, height },
        };
      });
    },
    [getMousePositionOnSlide, height, width, x, y]
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragStart) {
        setSelected(true);

        const pos = getMousePositionOnSlide(event);
        const dx = pos.x - dragStart.mouse.x;
        const dy = pos.y - dragStart.mouse.y;

        onChange(
          dragStart.value.x + dx,
          dragStart.value.y + dy,
          dragStart.value.width,
          dragStart.value.height
        );
      }
    },
    [dragStart, getMousePositionOnSlide, onChange]
  );

  const onMouseUp = useCallback((event: MouseEvent) => {
    setDragStart(null);
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const handlesWrapperRef = useRef<HTMLDivElement>(null);
  const onClickAnywhere = useCallback(
    (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      if (handlesWrapperRef.current?.contains(event.target as Node)) return;
      if (contentRef.current?.contains(event.target as Node)) return;
      setSelected(false);
      setEditingContent(false);
    },
    [contentRef, setEditingContent]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("click", onClickAnywhere);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("click", onClickAnywhere);
    };
  }, [onClickAnywhere, onKeyDown, onMouseMove, onMouseUp]);

  return (
    <>
      <div
        ref={ref}
        className={classNames("absolute cursor-move", {
          "outline outline-blue-700": selected || editingContent,
          "bg-blue-500/20": selected && !editingContent,
          "hover:outline outline-gray-300": !selected && !editingContent,
          "pointer-events-none": editingContent,
        })}
        style={{ left: x, top: y, width, height }}
        onMouseDown={onMouseDown}
        onClick={() => setSelected(true)}
        onDoubleClick={() => setEditingContent(true)}
      />
      <div ref={handlesWrapperRef}>
        {selected &&
          !editingContent &&
          [-1, 0, 1].map((handleX) =>
            [-1, 0, 1].map(
              (handleY) =>
                !(handleX === 0 && handleY === 0) && (
                  <Handle
                    key={`${handleX},${handleY}`}
                    boxX={x}
                    boxY={y}
                    boxWidth={width}
                    boxHeight={height}
                    x={handleX}
                    y={handleY}
                    onChange={onChange}
                  />
                )
            )
          )}
      </div>
    </>
  );
}

interface HandleProps {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;

  x: number; // -1, 0, or 1
  y: number; // -1, 0, or 1

  onChange: (x: number, y: number, width: number, height: number) => void;
}

function cursorClass(x: number, y: number) {
  const map = [
    ["cursor-nwse-resize", "cursor-ns-resize", "cursor-nesw-resize"],
    ["cursor-ew-resize", "cursor-move", "cursor-ew-resize"],
    ["cursor-nesw-resize", "cursor-ns-resize", "cursor-nwse-resize"],
  ];

  return map[y + 1][x + 1];
}

function Handle({
  boxX,
  boxY,
  boxWidth,
  boxHeight,
  x: handleX,
  y: handleY,
  onChange,
}: HandleProps) {
  // Dragging and dropping handles
  interface DragStart {
    mouse: { x: number; y: number };
    value: { x: number; y: number; width: number; height: number };
  }
  const [dragStart, setDragStart] = useState<DragStart | null>(null);

  const {
    slideRef,
    width: slideWidth,
    height: slideHeight,
  } = useSlideContext();

  const getMousePositionOnSlide = useCallback(
    (event: MouseEvent) => {
      const bbox = slideRef.current?.getBoundingClientRect()!;

      return {
        x: ((event.clientX - bbox.left) / bbox.width) * slideWidth,
        y: ((event.clientY - bbox.top) / bbox.height) * slideHeight,
      };
    },
    [slideRef, slideWidth, slideHeight]
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      setDragStart((dragStart) => {
        if (dragStart) return dragStart;

        event.preventDefault();

        const pos = getMousePositionOnSlide(event.nativeEvent);
        return {
          mouse: pos,
          value: { x: boxX, y: boxY, width: boxWidth, height: boxHeight },
        };
      });
    },
    [boxHeight, boxWidth, boxX, boxY, getMousePositionOnSlide]
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragStart) {
        const pos = getMousePositionOnSlide(event);
        const dx = pos.x - dragStart.mouse.x;
        const dy = pos.y - dragStart.mouse.y;

        const newBox = resize(handleX, handleY, dragStart.value, dx, dy);
        onChange(newBox.x, newBox.y, newBox.width, newBox.height);
      }
    },
    [dragStart, getMousePositionOnSlide, handleX, handleY, onChange]
  );

  const onMouseUp = useCallback((event: MouseEvent) => {
    setDragStart(null);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <div
      style={{
        left: boxX + (handleX + 1) * boxWidth * 0.5,
        top: boxY + (handleY + 1) * boxHeight * 0.5,
      }}
      className={classNames(
        "absolute w-4 h-4 bg-white border border-blue-700 -translate-x-1/2 -translate-y-1/2",
        cursorClass(handleX, handleY)
      )}
      onMouseDown={onMouseDown}
    />
  );
}

function resize(
  handleX: number,
  handleY: number,
  startBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  dx: number,
  dy: number
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  // Move
  if (handleX === 0 && handleY === 0) {
    return {
      x: startBox.x + dx,
      y: startBox.y + dy,
      width: startBox.width,
      height: startBox.height,
    };
  }

  // Resize
  let { x, y, width, height } = startBox;
  switch (handleX) {
    case -1:
      x += dx;
      width -= dx;
      break;
    case 1:
      width += dx;
      break;
  }
  switch (handleY) {
    case -1:
      y += dy;
      height -= dy;
      break;
    case 1:
      height += dy;
      break;
  }

  if (width < 0) {
    x += width;
    width *= -1;
  }
  if (height < 0) {
    y += height;
    height *= -1;
  }

  return { x, y, width, height };
}
