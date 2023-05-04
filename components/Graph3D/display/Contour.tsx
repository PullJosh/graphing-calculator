import { extend, Object3DNode, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { Line, Vector2 } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { useClippingPlanes } from "../../../hooks/useClippingPlanes";
import { useWorldCoordinateTransformation } from "../../../hooks/useWorldCoordinateTransformation";
import { Axis, Color } from "../../../types";
import { getColor } from "../../../utils/tailwindColors";

extend({ LineMaterial, Line2, Line_: Line });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    line2: Object3DNode<Line2, typeof Line2>;
    line_: Object3DNode<Line, typeof Line>;
  }
}

interface ContourProps {
  /** Float32Array representing contour points. Should
   * be a multiple of 3 in length, where every 3 numbers
   * correspond to an x/y/z in math space. */
  points: Float32Array;

  /** Color of the contour */
  color: Color;

  /** Width of the contour, or "px" for a hairline contour */
  width?: "px" | number;

  /** Clipping planes to apply to the contour */
  clippingPlanes?: Axis[];
}

export function Contour({
  points,
  color,
  width = 3,
  clippingPlanes = ["x", "y"],
}: ContourProps) {
  const clippingPlanes2D = useClippingPlanes(clippingPlanes);

  if (points.length % 3 !== 0) {
    throw new Error(
      `Contour \`points\` must be a multiple of 3 in length (got ${points.length}).`
    );
  }

  if (points.length < 6) {
    return null;
  }

  if (width === "px") {
    return (
      <HairlineContour
        points={points}
        color={color}
        clippingPlanes={clippingPlanes2D}
      />
    );
  }

  return (
    <ThickContour
      points={points}
      color={color}
      width={width}
      clippingPlanes={clippingPlanes2D}
    />
  );
}

interface ThickContourProps {
  points: Float32Array;
  color: Color;
  width: number;

  clippingPlanes?: any;
}

function ThickContour({
  points,
  color,
  width,
  clippingPlanes,
}: ThickContourProps) {
  const { scale, position, rotation } = useWorldCoordinateTransformation();

  const { size } = useThree();

  const geometry = useMemo(() => {
    const g = new LineGeometry();
    g.setPositions(points);
    return g;
  }, [points]);

  return (
    <line2
      scale={scale}
      position={position}
      rotation={rotation}
      geometry={geometry}
    >
      <lineMaterial
        attach="material"
        color={getColor(color)}
        // linewidth={lerp(
        //   (dimension.from ?? dimension.value) === "3D" ? 0 : 3,
        //   (dimension.to ?? dimension.value) === "3D" ? 0 : 3,
        //   dimension.progress ?? 0
        // )}
        linewidth={width}
        resolution={new Vector2(size.width, size.height)}
        clippingPlanes={clippingPlanes}
        clipping={true}
        // transparent={true}
      />
    </line2>
  );
}

interface HairlineContourProps {
  points: Float32Array;
  color: Color;

  clippingPlanes?: any;
}

function HairlineContour({
  points,
  color,
  clippingPlanes,
}: HairlineContourProps) {
  const { scale, position, rotation } = useWorldCoordinateTransformation();

  return (
    <line_ scale={scale} position={position} rotation={rotation}>
      <bufferGeometry attach="geometry" key={JSON.stringify(points)}>
        <bufferAttribute
          attach="attributes-position"
          array={points}
          count={points.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        attach="material"
        color={getColor(color)}
        clippingPlanes={clippingPlanes}
      />
    </line_>
  );
}
