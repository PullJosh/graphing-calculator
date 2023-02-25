import { extend, Object3DNode, useFrame, useThree } from "@react-three/fiber";
import { useContext, useRef } from "react";
import { Euler, Vector2, Vector3, Color as ThreeColor, Line } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { useClippingPlanes } from "../../../hooks/useClippingPlanes";
import { useWorldCoordinateTransformation } from "../../../hooks/useWorldCoordinateTransformation";
import { Axis, Color } from "../../../types";
import { getColor } from "../../../utils/tailwindColors";
import { Graph3DContext } from "../Graph3D";

extend({ LineMaterial, Line2, Line_: Line });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    line2: Object3DNode<Line2, typeof Line2>;
    line_: Object3DNode<Line, typeof Line>;
  }
}

interface VectorProps {
  /** Coordinates of the vector */
  value: Vector3;

  /** Origin of the vector */
  origin: Vector3;

  /** Color of the vector */
  color: Color | ThreeColor;

  /** Opacity of the vector */
  opacity?: number;

  /** Width of the vector */
  width?: number;

  /** Clipping planes to apply to the contour */
  clippingPlanes?: Axis[];

  /** Whether or not to show an arrow at the head of the vector */
  showHead?: boolean;

  /** Whether or not to show a sphere at the tail of the vector */
  showTail?: boolean;

  /** Whether or not to display the vector as a cone */
  showAsCone?: boolean;
}

export function Vector({
  value,
  origin,
  color,
  opacity = 1,
  width = 3,
  clippingPlanes,
  showHead = true,
  showTail = true,
  showAsCone = false,
}: VectorProps) {
  const { scale, position, rotation } = useWorldCoordinateTransformation();

  const { size } = useThree();

  const { dimension } = useContext(Graph3DContext);

  const nearestDim =
    dimension.progress === undefined
      ? dimension.value
      : dimension.progress > 0.5
      ? dimension.to
      : dimension.from;

  const planes = useClippingPlanes(
    clippingPlanes ?? (nearestDim === "3D" ? ["x", "y", "z"] : ["x", "y"])
  );

  const geometryRef = useRef<LineGeometry>(null);

  const dest = origin.clone().add(value);

  useFrame(() => {
    if (geometryRef.current) {
      geometryRef.current.setPositions([
        origin.x,
        origin.y,
        origin.z,
        dest.x,
        dest.y,
        dest.z,
      ]);
    }
  });

  if (value.length() === 0) {
    return null;
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {showTail && !showAsCone && (
        <mesh
          position={origin}
          scale={new Vector3(1 / scale.x, 1 / scale.y, 1 / scale.z)}
        >
          <sphereGeometry attach="geometry" args={[width * 0.005, 32, 32]} />
          <meshBasicMaterial
            attach="material"
            color={getColor(color)}
            clippingPlanes={planes}
          />
        </mesh>
      )}
      {!showAsCone && (
        <line2>
          <lineGeometry attach="geometry" ref={geometryRef} />
          <lineMaterial
            attach="material"
            color={getColor(color)}
            linewidth={width}
            resolution={new Vector2(size.width, size.height)}
            clippingPlanes={planes}
            clipping={true}
          />
        </line2>
      )}
      {showHead && !showAsCone && (
        <mesh
          position={dest}
          scale={new Vector3(1 / scale.x, 1 / scale.y, 1 / scale.z)}
          rotation={
            new Euler(
              Math.atan2(value.z, Math.hypot(value.x, value.y)),
              0,
              Math.atan2(value.y, value.x) - Math.PI / 2,
              "ZYX"
            )
          }
        >
          <coneGeometry
            attach="geometry"
            args={[width * 0.005, width * 0.015, 32]}
          />
          <meshBasicMaterial
            attach="material"
            color={getColor(color)}
            clippingPlanes={planes}
          />
        </mesh>
      )}
      {showAsCone && (
        <mesh
          position={value.clone().multiplyScalar(0.5).add(origin)}
          // scale={new Vector3(1 / scale.x, 1 / scale.y, 1 / scale.z)}
          rotation={
            new Euler(
              Math.atan2(value.z, Math.hypot(value.x, value.y)),
              0,
              Math.atan2(value.y, value.x) - Math.PI / 2,
              "ZYX"
            )
          }
        >
          <coneGeometry
            attach="geometry"
            args={[width * 0.05 * value.length(), value.length(), 32]}
          />
          <meshBasicMaterial
            attach="material"
            color={getColor(color)}
            clippingPlanes={planes}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      )}
    </group>
  );
}
