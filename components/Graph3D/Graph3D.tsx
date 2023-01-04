import {
  Component,
  createContext,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube, GizmoViewport } from "@react-three/drei";
import {
  Camera,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import tunnel from "tunnel-rat";
import classNames from "classnames";
import { lerp, lerpQuaternion, lerpVec3, lerpWindow } from "../../utils/lerp";
import { useEffectOnce } from "usehooks-ts";

type Graph3DProps = Graph3DInnerProps;

export const Graph3D = forwardRef<
  HTMLCanvasElement,
  Omit<Graph3DProps, "UITunnel">
>(function Graph3D(props, ref) {
  const [uiTunnel] = useState(() => tunnel());

  return (
    <>
      <div className="absolute top-4 left-4 z-20">
        <uiTunnel.Out />
      </div>
      <Canvas gl={{ localClippingEnabled: true }} ref={ref}>
        <Graph3DInner {...props} UITunnel={uiTunnel.In} />
      </Canvas>
    </>
  );
});

export const Graph3DContext = createContext<ViewInfo>({
  dimension: { value: "3D" },
  setDimension: () => {},
  cameraType: { value: "perspective" },
  setCameraType: () => {},
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
});

interface Graph3DInnerProps {
  children: (data: ViewInfo) => ReactNode;
  UITunnel: (props: { children: ReactNode }) => null;
  showControls?: boolean;
  defaultDimension?: Dimension;
  defaultCameraType?: CameraType;
  autoRotate?: boolean;
}

function Graph3DInner({
  children,
  UITunnel,
  showControls = true,
  defaultDimension = "3D",
  defaultCameraType = defaultDimension === "3D"
    ? "perspective"
    : "orthographic",
  autoRotate = false,
}: Graph3DInnerProps) {
  const viewInfo = useDimensionCamerasAndControls(
    defaultDimension,
    defaultCameraType,
    autoRotate
  );

  const {
    dimension,
    setDimension,
    cameraType,
    setCameraType,
    window,
    windowWorldCoordinates,
  } = viewInfo;

  return (
    <Graph3DContext.Provider value={viewInfo}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {/* <gridHelper position={[0, 0, 0]} /> */}
      {/* <fog attach="fog" color="white" near={1} far={10} /> */}
      {children(viewInfo)}
      <UITunnel>
        {showControls && (
          <div className="flex space-x-2">
            <div className="bg-gray-200 p-1 rounded-md flex">
              <button
                className={classNames("flex text-sm px-2 py-1", {
                  "bg-white shadow-sm rounded": dimension.value === "1D",
                })}
                onClick={() => setDimension("1D")}
                disabled={dimension.value === "1D"}
              >
                1D
              </button>
              <button
                className={classNames("flex text-sm px-2 py-1", {
                  "bg-white shadow-sm rounded": dimension.value === "2D",
                })}
                onClick={() => setDimension("2D")}
                disabled={dimension.value === "2D"}
              >
                2D
              </button>
              <button
                className={classNames("flex text-sm px-2 py-1", {
                  "bg-white shadow-sm rounded": dimension.value === "3D",
                })}
                onClick={() => setDimension("3D")}
                disabled={dimension.value === "3D"}
              >
                3D
              </button>
            </div>
            {dimension.value === "3D" && (
              <div className="bg-gray-200 p-1 rounded-md flex">
                <button
                  className={classNames("flex text-sm px-2 py-1", {
                    "bg-white shadow-sm rounded":
                      cameraType.value === "perspective",
                  })}
                  onClick={() => setCameraType("perspective")}
                  disabled={cameraType.value === "perspective"}
                  title="Perspective camera"
                >
                  <svg
                    viewBox="0 0 20 20"
                    width={20}
                    height={20}
                    fill="none"
                    className="block stroke-gray-600"
                    strokeWidth={2}
                    style={{
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                    }}
                  >
                    <g transform="matrix(1,0,0,1,0,-0.75)">
                      <path d="M2.206,5.5L10,2.5L17.794,5.5L10,10L2.206,5.5Z" />
                    </g>
                    <g transform="matrix(-0.5,0.866025,-0.866025,-0.5,23.6603,5.58975)">
                      <path d="M2.206,5.5L10,2.5L17.794,5.5L10,10L2.206,5.5Z" />
                    </g>
                    <g transform="matrix(-0.5,-0.866025,0.866025,-0.5,6.33975,22.9103)">
                      <path d="M2.206,5.5L10,2.5L17.794,5.5L10,10L2.206,5.5Z" />
                    </g>
                  </svg>
                </button>
                <button
                  className={classNames("flex text-sm px-2 py-1", {
                    "bg-white shadow-sm rounded":
                      cameraType.value === "orthographic",
                  })}
                  onClick={() => setCameraType("orthographic")}
                  disabled={cameraType.value === "orthographic"}
                  title="Orthographic camera"
                >
                  <svg
                    viewBox="0 0 20 20"
                    width={20}
                    height={20}
                    fill="none"
                    className="block stroke-gray-600"
                    strokeWidth={2}
                    style={{
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                    }}
                  >
                    <path d="M2.206,5.5L10,1L17.794,5.5L10,10L2.206,5.5Z" />
                    <path d="M2.206,14.5L2.206,5.5L10,10L10,19L2.206,14.5Z" />
                    <path d="M10,10L10,19L17.794,14.5L17.794,5.5L10,10Z" />
                  </svg>
                </button>
              </div>
            )}
            {dimension.value === "3D" && (
              <div className="bg-gray-200 p-1 rounded-md flex opacity-50">
                <button
                  className={classNames("flex text-sm px-2 py-1", {
                    "bg-white shadow-sm rounded": false,
                  })}
                  disabled={true}
                >
                  1st Person
                </button>
                <button
                  className={classNames("flex text-sm px-2 py-1", {
                    "bg-white shadow-sm rounded": true,
                  })}
                  disabled={true}
                >
                  3rd Person
                </button>
              </div>
            )}
          </div>
        )}
      </UITunnel>
      {dimension.value === "3D" && showControls && (
        <>
          <GizmoHelper alignment="top-right" margin={[80, 80]}>
            <GizmoViewcube
              color="#eee"
              faces={["Right", "Left", "Top", "Bottom", "Front", "Back"]}
              hoverColor="#ccc"
              opacity={0.8}
              strokeColor="#333"
              textColor="#333"
            />
          </GizmoHelper>
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport />
          </GizmoHelper>
        </>
      )}
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
  setDimension: (newDimension: Dimension) => void;
  setCameraType: (newCameraType: CameraType) => void;

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
const far = 1000;

// Get quaternion pointing from target toward camera
const directionToAngle = (direction: Vector3): Quaternion => {
  const dummy = new Object3D(); // Object positioned at origin
  dummy.lookAt(direction);
  return dummy.quaternion.clone();
};

type Window = [[number, number, number], [number, number, number]];
function getIdealWindow(
  dimension: Dimension,
  aspect: number
): [Window, Window] {
  // Get top/bottom/left/right coordinates of orthographic camera
  const top = ORBIT_DISTANCE * Math.tan((perspectiveFov / 2) * (Math.PI / 180));
  const bottom = -top;
  const right = top * aspect;
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
        [
          [-5, -5 / aspect, 0],
          [5, 5 / aspect, 0],
        ],
        [
          [left, bottom, 0],
          [right, top, 0],
        ],
      ];
    case "3D":
      return [
        [
          [-5, -5, -5],
          [5, 5, 5],
        ],
        [
          [-1, -1, -1],
          [1, 1, 1],
        ],
      ];
  }
}

function useDimensionCamerasAndControls(
  defaultDimension: Dimension = "3D",
  defaultCameraType: CameraType = "perspective",
  autoRotate: boolean = false
): ViewInfo {
  if (defaultDimension !== "3D" && defaultCameraType !== "orthographic") {
    console.error(
      "Passed invalid combination: defaultDimension = ",
      defaultDimension,
      ", defaultCameraType = ",
      defaultCameraType
    );
    defaultCameraType = "orthographic"; // Don't allow illegal combinations
  }

  const pCam = usePerspectiveCamera(defaultCameraType === "perspective");
  const oCam = useOrthographicCamera(defaultCameraType === "orthographic");

  const orbitControls = useOrbitControls(
    defaultCameraType === "perspective" ? pCam : oCam,
    defaultDimension === "3D",
    autoRotate
  );

  const { viewport } = useThree();

  const [dimension, setDimensionRaw] = useState<AnimatableValue<Dimension>>({
    value: defaultDimension,
  });

  const [cameraType, setCameraTypeRaw] = useState<AnimatableValue<CameraType>>({
    value: defaultCameraType,
  });

  const [default3DCameraType, setDefault3DCameraType] =
    useState<CameraType>("perspective");

  const [defaultWindow, defaultWWC] = getIdealWindow(
    defaultDimension,
    viewport.aspect
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
      let to: CameraKeyframe = { ...currentKeyframe, ...toPartial };

      if (to.dimension === "3D" && from.dimension !== "3D") {
        if (!("cameraType" in toPartial)) {
          // If switching to 3D and camera type not specified, use default
          to.cameraType = default3DCameraType;
        }
      }

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

          orbitControls.enabled = to.dimension === "3D";

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
      default3DCameraType,
      updateCameras,
      orbitControls,
    ]
  );

  const setDimension = useCallback(
    (newDimension: Dimension) => {
      const [window, windowWorldCoordinates] = getIdealWindow(
        newDimension,
        viewport.aspect
      );

      switch (newDimension) {
        case "1D": {
          animateCameraMove({
            dimension: "1D",
            cameraType: "orthographic",
            cameraTarget: new Vector3(0, 0, 0),
            cameraDirection: new Vector3(0, 1, 0),
            cameraDistance: ORBIT_DISTANCE,
            window,
            windowWorldCoordinates,
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
            window,
            windowWorldCoordinates,
          });
          break;
        }
        case "3D": {
          animateCameraMove({
            dimension: "3D",
            cameraTarget: new Vector3(0, 0, 0),
            cameraDirection: new Vector3(1, 1, 1).normalize(),
            cameraDistance: ORBIT_DISTANCE,
            window,
            windowWorldCoordinates,
          });
          break;
        }
      }
    },
    [viewport.aspect, animateCameraMove]
  );

  const setCameraType = useCallback(
    (newCameraType: CameraType) => {
      if (dimension.value !== "3D") {
        console.error(
          `Cannot set camera type to ${newCameraType} when in ${dimension.value} (works in 3D only)`
        );
        return;
      }

      setDefault3DCameraType(newCameraType);
      animateCameraMove({ cameraType: newCameraType });
    },
    [animateCameraMove, dimension.value]
  );

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

  return {
    dimension,
    cameraType,
    window,
    windowWorldCoordinates,
    setDimension,
    setCameraType,
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

  useEffect(() => {
    const updateAspect = () => {
      perspectiveCamera.aspect = viewport.aspect;
      perspectiveCamera.updateProjectionMatrix();
    };

    window.addEventListener("resize", updateAspect);
    return () => {
      window.removeEventListener("resize", updateAspect);
    };
  }, [gl.domElement, perspectiveCamera, viewport]);

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
    orbitControls.dampingFactor = 0.2;

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
