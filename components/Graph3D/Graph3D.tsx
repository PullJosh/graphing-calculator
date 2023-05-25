"use client";

import {
  createContext,
  Dispatch,
  forwardRef,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Camera,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { lerp, lerpQuaternion, lerpVec3, lerpWindow } from "../../utils/lerp";
import { useEffectOnce } from "usehooks-ts";

export const Graph3D = forwardRef<HTMLCanvasElement, Graph3DInnerProps>(
  function Graph3D(props, ref) {
    return (
      <Canvas
        gl={{ localClippingEnabled: true }}
        ref={ref}
        className="bg-white dark:bg-black"
        resize={{
          debounce: 0, // Respond instantly to changes in the parent's size
          offsetSize: true, // Size the canvas properly when placed inside a scaled slidehsow `Slide`
        }}
      >
        <Graph3DInner {...props} />
      </Canvas>
    );
  }
);

type Graph3DContextType = ViewInfo & {
  axisComponentCounts: {
    x: number;
    y: number;
    z: number;
  };
  setAxisComponentCounts: Dispatch<
    SetStateAction<{
      x: number;
      y: number;
      z: number;
    }>
  >;
  varValues: Record<string, number>;
};

export const Graph3DContext = createContext<Graph3DContextType>({
  dimension: { value: "3D" },
  cameraType: { value: "perspective" },
  window: {
    value: [
      [-5, -5, -5],
      [5, 5, 5],
    ],
  },
  windowWorldCoordinates: {
    value: [
      [-1, -1, -1],
      [1, 1, 1],
    ],
  },
  toSceneX: () => 0,
  toSceneY: () => 0,
  toSceneZ: () => 0,
  axisComponentCounts: { x: 0, y: 0, z: 0 },
  setAxisComponentCounts: () => {},
  varValues: {},
});

type CameraView = "1D" | "2D" | "3D-orthographic" | "3D-perspective";

interface Graph3DInnerProps {
  /** The children of the graph. Everything to be graphed is passed here. */
  children: (data: ViewInfo) => ReactNode;

  /** The width of the graph canvas in pixels */
  width?: number;

  /** The height of the graph canvas in pixels */
  height?: number;

  /** The dimension and camera type of the graph */
  view?: CameraView;

  /** The center point of the graphing window */
  defaultWindowCenter?: [number, number];

  /** The area of the graphing window (if in 2D) */
  defaultWindowArea?: number;

  /** Whether the user can pan the graph */
  allowPan?: boolean;

  /** Whether the user can zoom the graph */
  allowZoom?: boolean;

  /** Whether the graph should rotate automatically (in 3D) */
  autoRotate?: boolean;

  /** The (non-axis) variable values to use when computing graphs */
  varValues?: Record<string, number>;
}

function Graph3DInner({
  children,
  width = 400,
  height = 400,
  view = "2D",
  defaultWindowCenter = [0, 0],
  defaultWindowArea = 100,
  allowPan = true,
  allowZoom = true,
  autoRotate = false,
  varValues = {},
}: Graph3DInnerProps) {
  const viewInfo = useDimensionCamerasAndControls(
    view,
    defaultWindowCenter,
    defaultWindowArea,
    allowPan,
    allowZoom,
    autoRotate
  );

  const [axisComponentCounts, setAxisComponentCounts] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  return (
    <Graph3DContext.Provider
      value={{
        ...viewInfo,
        axisComponentCounts,
        setAxisComponentCounts,
        varValues,
      }}
    >
      <ambientLight />
      {/* <pointLight position={[10, 10, 10]} /> */}
      {/* <pointLight position={[-10, 7, -5]} intensity={0.5} /> */}
      {children(viewInfo)}
    </Graph3DContext.Provider>
  );
}

type Dimension = "1D" | "2D" | "3D";
type CameraType = "perspective" | "orthographic";

interface ViewOptionsStatic {
  dimension: Dimension;
  cameraType: CameraType;
  window: [[number, number, number], [number, number, number]];
  windowWorldCoordinates: [[number, number, number], [number, number, number]];
}

type ViewOptions = {
  [K in keyof ViewOptionsStatic]: AnimatableValue<ViewOptionsStatic[K]>;
};

type ViewInfo = ViewOptions & {
  toSceneX: (x: number) => number;
  toSceneY: (y: number) => number;
  toSceneZ: (z: number) => number;
};

type AnimatableValue<T> = {
  value: T;
  from?: T;
  to?: T;
  progress?: number;
};

const ORBIT_DISTANCE = 4;

const perspectiveFov = 50;
const orthographicFov = 0.01;
const near = 0.1;
const far = 10;

// Get quaternion pointing from target toward camera
const directionToAngle = (direction: Vector3): Quaternion => {
  const dummy = new Object3D(); // Object positioned at origin
  dummy.lookAt(direction);
  return dummy.quaternion.clone();
};

type Window = [[number, number, number], [number, number, number]];
function getIdealWindow(
  dimension: Dimension,
  viewportAspect: number,
  windowAspect: number,
  area: number,
  center: [number, number]
): [Window, Window] {
  // Get top/bottom/left/right coordinates of orthographic camera
  const top = ORBIT_DISTANCE * Math.tan((perspectiveFov / 2) * (Math.PI / 180));
  const bottom = -top;
  const right = top * viewportAspect;
  const left = -right;

  switch (dimension) {
    case "1D":
      return [
        [
          [-5, 0, 0],
          [5, 0, 0],
        ],
        [
          [left, 0, 0],
          [right, 0, 0],
        ],
      ];
    case "2D":
      return [
        getWindowWithAreaAndAspectRatio(area, windowAspect, center, [0, 0]),
        [
          [left, bottom, 0],
          [right, top, 0],
        ],
      ];
    case "3D":
      return [
        getWindowWithAreaAndAspectRatio(area, windowAspect, center, [-5, 5]),
        [
          [-1, -1, -1],
          [1, 1, 1],
        ],
      ];
  }
}

function getWindowWithAreaAndAspectRatio(
  area: number,
  aspect: number,
  center: [number, number],
  [minZ, maxZ]: [number, number]
): Window {
  const width = Math.sqrt(area * aspect);
  const height = area / width;

  return [
    [center[0] - width / 2, center[1] - height / 2, minZ],
    [center[0] + width / 2, center[1] + height / 2, maxZ],
  ];
}

function useDimensionCamerasAndControls(
  view: CameraView,
  defaultWindowCenter: [number, number] = [0, 0],
  defaultWindowArea: number = 100,
  allowPan: boolean = true,
  allowZoom: boolean = true,
  autoRotate: boolean = false
): ViewInfo {
  const defaultCameraType =
    view === "3D-perspective" ? "perspective" : "orthographic";

  const defaultDimension = (
    {
      "1D": "1D",
      "2D": "2D",
      "3D-perspective": "3D",
      "3D-orthographic": "3D",
    } as const
  )[view];

  const pCam = usePerspectiveCamera(defaultCameraType === "perspective");
  const oCam = useOrthographicCamera(defaultCameraType === "orthographic");

  const orbitControls = useOrbitControls(
    defaultCameraType === "perspective" ? pCam : oCam,
    defaultDimension === "3D" && allowPan,
    autoRotate
  );

  const { viewport } = useThree();

  const [dimension, setDimensionRaw] = useState<AnimatableValue<Dimension>>({
    value: defaultDimension,
  });

  const [cameraType, setCameraTypeRaw] = useState<AnimatableValue<CameraType>>({
    value: defaultCameraType,
  });

  const [defaultWindow, defaultWWC] = getIdealWindow(
    defaultDimension,
    viewport.aspect,
    defaultDimension === "2D" ? viewport.aspect : 1,
    defaultWindowArea,
    defaultWindowCenter
  );
  const [window, setWindow] = useState<AnimatableValue<Window>>({
    value: defaultWindow,
  });
  const [windowWorldCoordinates, setWindowWorldCoordinates] = useState<
    AnimatableValue<Window>
  >({ value: defaultWWC });

  const animate = useAnimateThree();

  const updateCameras = useCallback(
    (fov: number, target: Vector3, angle: Quaternion, distance: number) => {
      const requiredHeight =
        distance * Math.tan((perspectiveFov / 2) * (Math.PI / 180));
      const actualDistance =
        requiredHeight / Math.tan((fov / 2) * (Math.PI / 180));

      pCam.fov = fov;
      pCam.position
        .set(0, 0, 1)
        .applyQuaternion(angle)
        .multiplyScalar(actualDistance)
        .add(target);
      pCam.quaternion.copy(angle);
      pCam.near = near + actualDistance - distance;
      pCam.far = far + actualDistance - distance;
      pCam.updateProjectionMatrix();

      oCam.position
        .set(0, 0, 1)
        .applyQuaternion(angle)
        .multiplyScalar(distance)
        .add(target);
      oCam.quaternion.copy(angle);
      oCam.top = requiredHeight;
      oCam.bottom = -requiredHeight;
      oCam.right = requiredHeight * viewport.aspect;
      oCam.left = -requiredHeight * viewport.aspect;
      oCam.near = near;
      oCam.far = far;
      oCam.updateProjectionMatrix();
    },
    [oCam, pCam, viewport.aspect]
  );

  useEffectOnce(() => {
    switch (defaultDimension) {
      case "1D":
      case "2D":
        updateCameras(
          orthographicFov,
          new Vector3(0, 0, 0),
          directionToAngle(new Vector3(0, 1, 0)),
          ORBIT_DISTANCE
        );
        break;
      case "3D":
        updateCameras(
          defaultCameraType === "perspective"
            ? perspectiveFov
            : orthographicFov,
          new Vector3(0, 0, 0),
          directionToAngle(new Vector3(1, 1, 1)),
          ORBIT_DISTANCE
        );
        break;
    }
  });

  interface CameraKeyframe {
    dimension: Dimension;

    cameraType: CameraType;
    cameraTarget: Vector3;
    cameraDirection: Vector3;
    cameraDistance: number;

    window: [[number, number, number], [number, number, number]];
    windowWorldCoordinates: [
      [number, number, number],
      [number, number, number]
    ];
  }
  const animateCameraMove = useCallback(
    (
      toPartial: Partial<CameraKeyframe>,
      fromPartial?: Partial<CameraKeyframe>,
      onComplete?: () => void
    ) => {
      const currentKeyframe: CameraKeyframe = {
        dimension: dimension.value,
        cameraType: cameraType.value,
        cameraTarget: new Vector3(0, 0, 0),
        cameraDirection:
          cameraType.value === "perspective"
            ? pCam.position.clone().sub(new Vector3(0, 0, 0)).normalize()
            : oCam.position.clone().sub(new Vector3(0, 0, 0)).normalize(),
        cameraDistance:
          cameraType.value === "perspective"
            ? pCam.position.clone().sub(new Vector3(0, 0, 0)).length()
            : oCam.position.clone().sub(new Vector3(0, 0, 0)).length(),
        window: window.value,
        windowWorldCoordinates: windowWorldCoordinates.value,
      };

      const from: CameraKeyframe = { ...currentKeyframe, ...fromPartial };
      const to: CameraKeyframe = { ...currentKeyframe, ...toPartial };

      const fromFov =
        from.cameraType === "perspective" ? perspectiveFov : orthographicFov;
      const toFov =
        to.cameraType === "perspective" ? perspectiveFov : orthographicFov;

      const fromAngle = directionToAngle(from.cameraDirection);
      const toAngle = directionToAngle(to.cameraDirection);

      const updateState = (t: number) => {
        setDimensionRaw({
          value: to.dimension,
          from: from.dimension,
          to: to.dimension,
          progress: t,
        });
        setCameraTypeRaw({
          value: to.cameraType,
          from: from.cameraType,
          to: to.cameraType,
          progress: t,
        });
        setWindow({
          value: lerpWindow(from.window, to.window, t),
          from: from.window,
          to: to.window,
          progress: t,
        });
        setWindowWorldCoordinates({
          value: lerpWindow(
            from.windowWorldCoordinates,
            to.windowWorldCoordinates,
            t
          ),
          from: from.windowWorldCoordinates,
          to: to.windowWorldCoordinates,
          progress: t,
        });
      };

      return animate({
        onStart: (get, set) => {
          updateCameras(
            fromFov,
            from.cameraTarget,
            fromAngle,
            from.cameraDistance
          );
          updateState(0);

          orbitControls.enabled = false;

          if (
            from.cameraType === "orthographic" &&
            to.cameraType === "orthographic"
          ) {
            set({ camera: oCam });
          } else {
            set({ camera: pCam });
          }
        },
        onFrame: (t, get, set) => {
          const fov = lerp(fromFov, toFov, t);
          const target = lerpVec3(from.cameraTarget, to.cameraTarget, t);
          const angle = lerpQuaternion(fromAngle, toAngle, t);
          const distance = lerp(from.cameraDistance, to.cameraDistance, t);

          updateCameras(fov, target, angle, distance);
          updateState(t);
        },
        onComplete: (get, set) => {
          updateCameras(toFov, to.cameraTarget, toAngle, to.cameraDistance);
          updateState(1);

          set({ camera: to.cameraType === "perspective" ? pCam : oCam });
          if (to.dimension === "3D") {
            orbitControls.object =
              to.cameraType === "perspective" ? pCam : oCam;
          }

          // Set values to static (no longer animating, no .from or .to)
          setDimensionRaw({ value: to.dimension });
          setCameraTypeRaw({ value: to.cameraType });
          setWindow({ value: to.window });
          setWindowWorldCoordinates({ value: to.windowWorldCoordinates });

          orbitControls.enabled = to.dimension === "3D" && allowPan;

          onComplete?.();
        },
        ease: easeInOut,
        duration: to.dimension !== from.dimension ? 500 : 300,
      });
    },
    [
      dimension.value,
      cameraType.value,
      pCam,
      oCam,
      window.value,
      windowWorldCoordinates.value,
      animate,
      updateCameras,
      orbitControls,
      allowPan,
    ]
  );

  const updateView = useCallback(
    (newView: CameraView) => {
      const newDimension: Dimension = (
        {
          "1D": "1D",
          "2D": "2D",
          "3D-orthographic": "3D",
          "3D-perspective": "3D",
        } as const
      )[newView];

      const currentDimension = dimension.to ?? dimension.value;
      if (currentDimension === "3D" && newDimension === "3D") {
        // Only changing camera type
        animateCameraMove({
          cameraType:
            newView === "3D-perspective" ? "perspective" : "orthographic",
        });
        return;
      }

      const oldWidth = window.value[1][0] - window.value[0][0];
      const oldHeight = window.value[1][1] - window.value[0][1];

      const oldArea = oldWidth * oldHeight;
      const oldAspect = oldWidth / oldHeight;

      const oldWorldWidth =
        windowWorldCoordinates.value[1][0] - windowWorldCoordinates.value[0][0];
      const oldWorldHeight =
        windowWorldCoordinates.value[1][1] - windowWorldCoordinates.value[0][1];

      const oldWorldAspect = oldWorldWidth / oldWorldHeight;

      const oldCenter: [number, number] = [
        (window.value[0][0] + window.value[1][0]) / 2,
        (window.value[0][1] + window.value[1][1]) / 2,
      ];

      let newAspect = 1;
      let newArea = oldArea;
      if (dimension.value === "1D") {
        // If coming from 1D, make it square
        newAspect = viewport.aspect;
        newArea = oldWidth * (oldWidth * viewport.aspect);
      } else {
        // Preserve the old aspect ratio, but account for the fact
        // that the world aspect ratio might have changed
        const newWorldAspect = newDimension === "3D" ? 1 : viewport.aspect;
        newAspect = (oldAspect / oldWorldAspect) * newWorldAspect;
      }

      const [newWindow, newWWC] = getIdealWindow(
        newDimension,
        viewport.aspect,
        newAspect,
        newArea,
        oldCenter
      );

      switch (newDimension) {
        case "1D": {
          animateCameraMove({
            dimension: "1D",
            cameraType: "orthographic",
            cameraTarget: new Vector3(0, 0, 0),
            cameraDirection: new Vector3(0, 1, 0),
            cameraDistance: ORBIT_DISTANCE,
            window: newWindow,
            windowWorldCoordinates: newWWC,
          });
          break;
        }
        case "2D": {
          animateCameraMove({
            dimension: "2D",
            cameraType: "orthographic",
            cameraTarget: new Vector3(0, 0, 0),
            cameraDirection: new Vector3(0, 1, 0),
            cameraDistance: ORBIT_DISTANCE,
            window: newWindow,
            windowWorldCoordinates: newWWC,
          });
          break;
        }
        case "3D": {
          animateCameraMove({
            dimension: "3D",
            cameraType:
              newView === "3D-orthographic" ? "orthographic" : "perspective",
            cameraTarget: new Vector3(0, 0, 0),
            cameraDirection: new Vector3(1, 1, 1).normalize(),
            cameraDistance: ORBIT_DISTANCE,
            window: newWindow,
            windowWorldCoordinates: newWWC,
          });
          break;
        }
      }
    },
    [
      dimension.to,
      dimension.value,
      window.value,
      windowWorldCoordinates.value,
      viewport.aspect,
      animateCameraMove,
    ]
  );

  useEffect(() => {
    // Set dimension based on view
    const currentDimension = dimension.to ?? dimension.value;
    const currentCameraType = cameraType.to ?? cameraType.value;
    if (
      defaultDimension !== currentDimension ||
      defaultCameraType !== currentCameraType
    ) {
      updateView(view);
    }
  }, [
    cameraType.to,
    cameraType.value,
    defaultCameraType,
    defaultDimension,
    dimension.to,
    dimension.value,
    updateView,
    view,
  ]);

  const toSceneX = useCallback(
    (x: number) => {
      if (window.value[1][0] === window.value[0][0]) {
        return windowWorldCoordinates.value[0][0];
      }

      return (
        ((x - window.value[0][0]) / (window.value[1][0] - window.value[0][0])) *
          (windowWorldCoordinates.value[1][0] -
            windowWorldCoordinates.value[0][0]) +
        windowWorldCoordinates.value[0][0]
      );
    },
    [window.value, windowWorldCoordinates.value]
  );

  const toSceneY = useCallback(
    (y: number) => {
      if (window.value[1][1] === window.value[0][1]) {
        return windowWorldCoordinates.value[0][1];
      }

      return (
        ((y - window.value[0][1]) / (window.value[1][1] - window.value[0][1])) *
          (windowWorldCoordinates.value[1][1] -
            windowWorldCoordinates.value[0][1]) +
        windowWorldCoordinates.value[0][1]
      );
    },
    [window.value, windowWorldCoordinates.value]
  );

  const toSceneZ = useCallback(
    (z: number) => {
      if (window.value[1][2] === window.value[0][2]) {
        return windowWorldCoordinates.value[0][2];
      }

      return (
        ((z - window.value[0][2]) / (window.value[1][2] - window.value[0][2])) *
          (windowWorldCoordinates.value[1][2] -
            windowWorldCoordinates.value[0][2]) +
        windowWorldCoordinates.value[0][2]
      );
    },
    [window.value, windowWorldCoordinates.value]
  );

  // Click and drag to pan
  interface DragState {
    startWindow: Window;
    startMouse: [number, number];
  }
  const [dragState, setDragState] = useState<DragState | null>(null);
  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      if (dimension.value === "3D" && !event.shiftKey) return;
      setDragState({
        startWindow: window.value,
        startMouse: [event.clientX, event.clientY],
      });
    },
    [dimension.value, window.value]
  );
  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragState === null) return;
      if (dimension.value === "3D" && !event.shiftKey) {
        setDragState(null);
        return;
      }

      if (!allowPan) return;

      const [x, y] = dragState.startMouse;
      const dx = event.clientX - x;
      const dy = event.clientY - y;

      setWindow((window) => {
        if (window.from !== undefined || window.to !== undefined) {
          // Currently animating; don't also drag
          // TODO: Allow dragging while animating? (Update .from and .to, not just .value?)
          return window;
        }

        const windowWidth = window.value[1][0] - window.value[0][0];
        const xMoveScale =
          dimension.value === "3D" ? 0.03 : windowWidth / viewport.width;

        const windowHeight = window.value[1][1] - window.value[0][1];
        const yMoveScale =
          dimension.value === "3D" ? 0.03 : windowHeight / viewport.height;

        return {
          value: [
            [
              dragState.startWindow[0][0] - dx * xMoveScale,
              dragState.startWindow[0][1] + dy * yMoveScale,
              dragState.startWindow[0][2],
            ],
            [
              dragState.startWindow[1][0] - dx * xMoveScale,
              dragState.startWindow[1][1] + dy * yMoveScale,
              dragState.startWindow[1][2],
            ],
          ],
        };
      });
    },
    [dimension.value, dragState, viewport.height, viewport.width, allowPan]
  );
  const onMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener("mousedown", onMouseDown);
    global.addEventListener("mousemove", onMouseMove);
    global.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      global.removeEventListener("mousemove", onMouseMove);
      global.removeEventListener("mouseup", onMouseUp);
    };
  }, [gl.domElement, onMouseDown, onMouseMove, onMouseUp]);

  // Scroll to zoom
  const onWheel = useCallback(
    (event: WheelEvent) => {
      // if (dimension.value === "3D" && !event.shiftKey) return;

      if (!allowZoom) return;

      const { deltaY } = event;
      const zoom = 1.1 ** (-deltaY / 50);

      const zoomRange = (
        min: number,
        max: number,
        zoom: number,
        center = 0.5
      ) => {
        const range = max - min;
        const newRange = range / zoom;
        const offset = (range - newRange) * center;
        return [min + offset, max - offset];
      };

      // const rect = gl.domElement.getBoundingClientRect();
      // const zoomCenter = [
      //   (event.clientX - rect.x) / rect.width,
      //   (event.clientY - rect.y) / rect.height,
      // ];

      // const zoomCenterCoords = [
      //   window.value[0][0] +
      //     zoomCenter[0] * (window.value[1][0] - window.value[0][0]),
      //   window.value[0][1] +
      //     zoomCenter[1] * (window.value[1][1] - window.value[0][1]),
      // ];

      setWindow((window) => {
        if (window.from !== undefined || window.to !== undefined) {
          // Currently animating; don't also zoom
          return window;
        }

        const [minX, maxX] = zoomRange(
          window.value[0][0],
          window.value[1][0],
          zoom
        );
        const [minY, maxY] = zoomRange(
          window.value[0][1],
          window.value[1][1],
          zoom
        );
        const [minZ, maxZ] = zoomRange(
          window.value[0][2],
          window.value[1][2],
          zoom
        );

        return {
          value: [
            [minX, minY, minZ],
            [maxX, maxY, maxZ],
          ],
        };
      });

      event.preventDefault();
    },
    [dimension.value, allowZoom]
  );

  useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener("wheel", onWheel);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [gl.domElement, onWheel]);

  // Adapt window and camera viewport when canvas resizes
  const canvasSizeRef = useRef({
    width: gl.domElement.clientWidth,
    height: gl.domElement.clientHeight,
  });
  useFrame(() => {
    const newSize = {
      width: gl.domElement.clientWidth,
      height: gl.domElement.clientHeight,
    };

    const oldSize = canvasSizeRef.current;
    if (newSize.width === oldSize.width && newSize.height === oldSize.height) {
      // Size hasn't changed; nothing to do
      return;
    }

    canvasSizeRef.current = newSize;

    // Canvas has been resized. Update window and camera viewport.
    const windowValue = window.to ?? window.value;
    const newArea =
      (windowValue[1][0] - windowValue[0][0]) *
      (windowValue[1][1] - windowValue[0][1]);
    const newCenter = [
      (windowValue[0][0] + windowValue[1][0]) / 2,
      (windowValue[0][1] + windowValue[1][1]) / 2,
    ] as [number, number];
    const [newWindow, newWWC] = getIdealWindow(
      dimension.value,
      newSize.width / newSize.height,
      dimension.value === "2D" ? newSize.width / newSize.height : 1,
      newArea,
      newCenter
    );

    setWindow({ value: newWindow });
    setWindowWorldCoordinates({ value: newWWC });

    // Call updateCameras() to refresh them for the new viewport.
    // Pass in all the existing camera properties so that nothing else changes.
    updateCameras(
      cameraType.value === "orthographic" ? orthographicFov : perspectiveFov,
      new Vector3(0, 0, 0),
      cameraType.value === "orthographic" ? oCam.quaternion : pCam.quaternion,
      ORBIT_DISTANCE
    );
  });

  return {
    dimension,
    cameraType,
    window,
    windowWorldCoordinates,
    toSceneX,
    toSceneY,
    toSceneZ,
  };
}

const easeInOut = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function useAnimateThree() {
  const { get, set } = useThree();
  type Get = typeof get;
  type Set = typeof set;

  const animationRef = useRef<{
    startDate: number;
    duration: number;
    onFrame: (t: number, get: Get, set: Set) => void;
    onComplete: (get: Get, set: Set) => void;
    ease: (t: number) => number;
  } | null>(null);

  useFrame(() => {
    const animation = animationRef.current;
    if (animation === null) return;

    const { startDate, duration, ease, onFrame, onComplete } = animation;

    let t = (Date.now() - startDate) / duration;
    if (t > 1) t = 1;

    onFrame(ease(t), get, set);

    if (t >= 1) {
      onComplete(get, set);
      animationRef.current = null;
    }
  });

  const animate = (
    options: Partial<{
      onStart: (get: Get, set: Set) => void;
      onFrame: (t: number, get: Get, set: Set) => void;
      onComplete: (get: Get, set: Set) => void;
      duration: number;
      ease: (t: number) => number;
    }> = {}
  ) => {
    const { onStart, onFrame, onComplete, duration, ease } = options;

    return new Promise<void>((resolve) => {
      onStart?.(get, set);
      animationRef.current = {
        startDate: Date.now(),
        duration: duration ?? 500,
        onFrame: onFrame ?? (() => {}),
        onComplete: (get, set) => {
          onComplete?.(get, set);
          resolve();
        },
        ease: ease ?? ((t) => t),
      };
    });
  };

  return animate;
}

function usePerspectiveCamera(setAsDefaultForScene: boolean) {
  const { set, viewport, gl } = useThree();

  const [perspectiveCamera] = useState(() => {
    const pCam = new PerspectiveCamera(
      perspectiveFov,
      viewport.aspect,
      near,
      far
    );

    // Mark camera as "manual", which prevents react-three-fiber from
    // trying to handle fov updates when the viewport changes automatically.
    (pCam as any).manual = true;

    // Initialize camera in <1, 1, 1> direction
    pCam.position.set(1, 1, 1).normalize().multiplyScalar(ORBIT_DISTANCE);
    pCam.lookAt(0, 0, 0);

    if (setAsDefaultForScene) {
      set({ camera: pCam });
    }

    return pCam;
  });

  useFrame(() => {
    if (perspectiveCamera.aspect !== viewport.aspect) {
      perspectiveCamera.aspect = viewport.aspect;
      perspectiveCamera.updateProjectionMatrix();
    }
  });

  return perspectiveCamera;
}

function useOrthographicCamera(setAsDefaultForScene: boolean) {
  const { set, viewport } = useThree();

  const [orthographicCamera] = useState(() => {
    const oCam = new OrthographicCamera(
      // These left, right, top, and bottom values might be wrong
      -viewport.width / 2,
      viewport.width / 2,
      viewport.height / 2,
      -viewport.height / 2,

      0.001,
      1000
    );

    // Mark camera as "manual", which prevents react-three-fiber from
    // trying to handle top/bottom/left/right updates when the viewport changes automatically.
    (oCam as any).manual = true;

    // Initialize camera in <1, 1, 1> direction
    oCam.position.set(1, 1, 1).normalize().multiplyScalar(ORBIT_DISTANCE);
    oCam.lookAt(0, 0, 0);

    if (setAsDefaultForScene) {
      set({ camera: oCam });
    }

    return oCam;
  });

  return orthographicCamera;
}

function useOrbitControls(
  targetCamera?: Camera,
  enabled: boolean = true,
  autoRotate: boolean = false
) {
  const { gl, camera } = useThree();

  const [orbitControls] = useState<OrbitControls>(() => {
    const orbitControls = new OrbitControls(
      targetCamera ?? camera,
      gl.domElement
    );

    // Set default target
    orbitControls.target = new Vector3(0, 0, 0);

    // Enable damping
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.3;

    // By default, OrbitControls zooms in and out by moving the camera
    // closer and further away from the target. We do not want this.
    // Instead, we will zoom by changing the window/scale of the graph,
    // which requires a custom implementation.
    orbitControls.enableZoom = false;
    orbitControls.enablePan = false;

    orbitControls.autoRotate = autoRotate;

    orbitControls.enabled = enabled;

    orbitControls.update();

    return orbitControls;
  });

  useFrame(() => {
    orbitControls.update();
  });

  return orbitControls;
}

interface SkyBoxProps {
  files: [string, string, string, string, string, string] | null;
}

function useMemoizedFileNames(
  passedFiles: SkyBoxProps["files"]
): SkyBoxProps["files"] {
  const [files, setFiles] = useState(passedFiles);

  useEffect(() => {
    if (passedFiles === null) {
      if (files !== null) {
        setFiles(null);
      }
      return;
    }

    if (files === null) {
      setFiles(passedFiles);
      return;
    }

    let isSame = true;
    for (let i = 0; i < files.length; i++) {
      if (passedFiles[i] !== files[i]) {
        isSame = false;
        break;
      }
    }

    if (!isSame) {
      setFiles(passedFiles);
    }
  }, [files, passedFiles]);

  return files;
}
