import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  MapControls,
  GizmoHelper,
  GizmoViewcube,
  GizmoViewport,
} from "@react-three/drei";
import {
  DoubleSide,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import tunnel from "tunnel-rat";
import classNames from "classnames";

const t = tunnel();

interface Graph3DProps {
  children: ReactNode;
}

export function Graph3D({ children }: Graph3DProps) {
  return (
    <>
      <div className="absolute top-4 left-4 z-20">
        <t.Out />
      </div>
      <Canvas
        // camera={{ position: [0, 10, 0], zoom: 1 }}
        onCreated={(state) => (state.gl.localClippingEnabled = true)}
      >
        <DimensionAwareControls>
          {({ dimension, setDimension }) => (
            <>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              {/* <gridHelper position={[0, 0, 0]} /> */}
              {/* <fog attach="fog" color="white" near={1} far={10} /> */}
              {children}
              <t.In>
                <div className="flex space-x-2">
                  <div className="bg-gray-200 p-1 rounded-md">
                    <button
                      className={classNames("text-sm px-2 py-1", {
                        "bg-white shadow-sm rounded": dimension === "2D",
                      })}
                      onClick={() => setDimension("2D")}
                      disabled={dimension === "2D"}
                    >
                      2D
                    </button>
                    <button
                      className={classNames("text-sm px-2 py-1", {
                        "bg-white shadow-sm rounded": dimension === "3D",
                      })}
                      onClick={() => setDimension("3D")}
                      disabled={dimension === "3D"}
                    >
                      3D
                    </button>
                  </div>
                  {dimension === "3D" && (
                    <div className="bg-gray-200 p-1 rounded-md">
                      <button
                        className={classNames("text-sm px-2 py-1", {
                          "bg-white shadow-sm rounded": false,
                        })}
                        disabled={true}
                      >
                        1st Person
                      </button>
                      <button
                        className={classNames("text-sm px-2 py-1", {
                          "bg-white shadow-sm rounded": true,
                        })}
                        disabled={true}
                      >
                        3rd Person
                      </button>
                    </div>
                  )}
                  {dimension === "3D" && (
                    <div className="bg-gray-200 p-1 rounded-md">
                      <button
                        className={classNames("text-sm px-2 py-1", {
                          "bg-white shadow-sm rounded": true,
                        })}
                        disabled={true}
                      >
                        Perspective
                      </button>
                      <button
                        className={classNames("text-sm px-2 py-1", {
                          "bg-white shadow-sm rounded": false,
                        })}
                        disabled={true}
                      >
                        Isometric
                      </button>
                    </div>
                  )}
                </div>
              </t.In>
              {dimension === "3D" && (
                <>
                  <GizmoHelper alignment="top-right" margin={[80, 80]}>
                    <GizmoViewcube
                      color="#eee"
                      faces={[
                        "Right",
                        "Left",
                        "Top",
                        "Bottom",
                        "Front",
                        "Back",
                      ]}
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
            </>
          )}
        </DimensionAwareControls>
      </Canvas>
    </>
  );
}

interface DimensionAwareControlsProps {
  children: (props: {
    dimension: "2D" | "3D";
    setDimension: (newDimension: "2D" | "3D") => void;
  }) => ReactNode;
}

function DimensionAwareControls({ children }: DimensionAwareControlsProps) {
  const [dimension, setDimension] = useState<"2D" | "3D">("3D");
  const [cameraType, setCameraType] = useState<"perspective" | "orthographic">(
    "perspective"
  );

  const perspectiveCameraRef = useRef<PerspectiveCamera | null>(null);
  const orthographicCameraRef = useRef<OrthographicCamera | null>(null);
  const mapControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);

  const transitionInfo = useRef<{
    startTime: number;
    duration: number;
    isFirstFrame: boolean;
    focusPoint: Vector3;
    radius: number;
    startAngle: Quaternion;
    endAngle: Quaternion;
    newCameraType: "perspective" | "orthographic";
  } | null>(null);

  const transitionCamera = useCallback(
    (
      newCameraType: "perspective" | "orthographic",
      newDirection: Vector3 | null = null,
      duration = 500
    ) => {
      const pCam = perspectiveCameraRef.current!;
      const oCam = orthographicCameraRef.current!;

      const currentControls =
        dimension === "3D" ? orbitControlsRef.current : mapControlsRef.current;

      const focusPoint = currentControls.target;

      if (cameraType === "orthographic" && newCameraType === "perspective") {
        // Switching from Orthographic -> Perspective
        // Set the perspective camera's position to be equivalent to that of the
        // orthographic camera
        pCam.fov = 50;
        const desiredHeight = oCam.top - oCam.bottom;
        const requiredDist =
          desiredHeight / (2 * Math.tan((pCam.fov / 2) * (Math.PI / 180)));
        pCam.position
          .copy(oCam.position)
          .normalize()
          .multiplyScalar(requiredDist);
        pCam.quaternion.copy(oCam.quaternion);
        pCam.zoom = oCam.zoom;
        pCam.updateProjectionMatrix();
      }

      const radius = pCam.position.distanceTo(focusPoint);
      const startAngle = pCam.quaternion.clone();

      // Compute endAngle based on the provided `newDirection`
      let endAngle: Quaternion;
      if (newDirection === null) {
        endAngle = startAngle.clone();
      } else {
        const targetPosition = newDirection
          .clone()
          .multiplyScalar(radius)
          .add(focusPoint);

        const dummy = new Object3D();
        dummy.position.copy(focusPoint);
        dummy.lookAt(targetPosition);

        endAngle = dummy.quaternion.clone();
      }

      transitionInfo.current = {
        startTime: Date.now(),
        duration,
        isFirstFrame: true,

        focusPoint,
        radius,

        startAngle: startAngle,
        endAngle: endAngle,

        newCameraType,
      };
    },
    [cameraType, dimension]
  );

  const { set, viewport } = useThree();
  useFrame(() => {
    const pCam = perspectiveCameraRef.current!;

    pCam.aspect = viewport.aspect;
    pCam.updateProjectionMatrix();
  });

  // Continually run camera transition code
  useFrame(() => {
    const pCam = perspectiveCameraRef.current!;
    const oCam = orthographicCameraRef.current!;

    if (transitionInfo.current === null) return;

    // oCam.left = oCam.top * viewport.aspect;
    // oCam.right = oCam.bottom * viewport.aspect;

    const {
      startTime,
      duration,

      focusPoint,
      radius,

      startAngle,
      endAngle,

      newCameraType,
    } = transitionInfo.current;

    // Do special work on first frame
    if (transitionInfo.current.isFirstFrame) {
      transitionInfo.current.isFirstFrame = false;

      if (newCameraType === "perspective") {
        setCameraType("perspective");
        set({ camera: pCam });
      }
    }

    let t = (Date.now() - startTime) / duration;
    if (t > 1) t = 1;

    const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

    const angle = new Quaternion().slerpQuaternions(
      startAngle,
      endAngle,
      ease(t)
    );

    const fov =
      newCameraType === "orthographic"
        ? lerp(50, 0.1, ease(t))
        : lerp(0.1, 50, ease(t));
    pCam.fov = fov;
    pCam.updateProjectionMatrix();

    // Get height of camera view at the focus point when fov = 50
    const desiredHeight = 2 * Math.tan((50 / 2) * (Math.PI / 180)) * radius;

    // Find the distance from the focus point that the camera needs to be at
    // to achieve the desired height using the current fov
    const requiredDist =
      desiredHeight / (2 * Math.tan((pCam.fov / 2) * (Math.PI / 180)));

    console.log(fov, requiredDist, radius);

    pCam.position
      .set(0, 0, 1)
      .applyQuaternion(angle)
      .multiplyScalar(requiredDist)
      .add(focusPoint);
    // pCam.up.set(0, 1, 0).applyQuaternion(angle).normalize();
    pCam.quaternion.copy(angle);
    pCam.updateProjectionMatrix();

    oCam.position
      .set(0, 0, 1)
      .applyQuaternion(angle)
      .multiplyScalar(radius)
      .add(focusPoint);
    // oCam.up.set(0, 1, 0).applyQuaternion(angle).normalize();
    oCam.quaternion.copy(angle);
    oCam.top = desiredHeight / 2;
    oCam.bottom = -desiredHeight / 2;
    oCam.left = oCam.bottom * viewport.aspect;
    oCam.right = oCam.top * viewport.aspect;
    oCam.updateProjectionMatrix();

    mapControlsRef.current.update();

    // Do special work on last frame
    if (t >= 1) {
      oCam.up.set(0, 1, 0);
      pCam.up.set(0, 1, 0);
      oCam.updateProjectionMatrix();
      pCam.updateProjectionMatrix();

      if (newCameraType === "orthographic") {
        setCameraType("orthographic");
        set({ camera: oCam });
      }

      orbitControlsRef.current.update();
      transitionInfo.current = null;
    }
  });

  const setDimensionAndTransitionCamera = useCallback(
    (newDimension: "2D" | "3D") => {
      switch (newDimension) {
        case "2D": {
          // Transition to 2D
          mapControlsRef.current.target.copy(orbitControlsRef.current.target);
          mapControlsRef.current.zoom = perspectiveCameraRef.current!.zoom;
          mapControlsRef.current.update();

          // transitionCamera("orthographic", new Vector3(0, 1, 0));
          transitionCamera("orthographic");
          break;
        }
        case "3D": {
          // Transition to 3D
          orbitControlsRef.current.target.copy(mapControlsRef.current.target);
          orbitControlsRef.current.zoom = perspectiveCameraRef.current!.zoom;
          orbitControlsRef.current.update();

          // transitionCamera("perspective", new Vector3(1, 1, 1));
          transitionCamera("perspective");
          break;
        }
      }

      setDimension(newDimension);
    },
    [transitionCamera]
  );

  // Use the perspective camera as the default camera
  const { camera } = useThree();
  useEffect(() => {
    const pCam = perspectiveCameraRef.current;
    const oCam = orthographicCameraRef.current;

    if (cameraType === "perspective" && camera !== pCam) {
      set({ camera: pCam! });
    }
    if (cameraType === "orthographic" && camera !== oCam) {
      set({ camera: oCam! });
    }
  }, [camera, cameraType, set]);

  return (
    <>
      <perspectiveCamera
        ref={perspectiveCameraRef}
        position={[10, 10, 10]}
        fov={50}
        zoom={1}
      />
      <orthographicCamera ref={orthographicCameraRef} position={[10, 10, 10]} />
      <MapControls
        ref={mapControlsRef}
        attach="mapControls"
        camera={orthographicCameraRef.current!}
        enabled={dimension === "2D"}
        makeDefault={dimension === "2D"}
        enableDamping={false}
        // dampingFactor={0.3}
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
      />
      <OrbitControls
        ref={orbitControlsRef}
        attach="orbitControls"
        camera={perspectiveCameraRef.current!}
        enabled={dimension === "3D"}
        makeDefault={dimension === "3D"}
        zoomSpeed={1.0}
        enablePan={true}
        dampingFactor={0.2}
      />
      {children({ dimension, setDimension: setDimensionAndTransitionCamera })}
    </>
  );
}
