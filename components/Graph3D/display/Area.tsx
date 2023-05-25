"use client";

import { useMemo } from "react";
import { DoubleSide, Euler, Shape, TwoPassDoubleSide, Vector3 } from "three";
import { useWorldCoordinateTransformation } from "../../../hooks/useWorldCoordinateTransformation";
import { Axis, Color } from "../../../types";
import { getColor } from "../../../utils/tailwindColors";
import { Contour } from "./Contour";

interface AreaProps {
  shape: Shape;
  color: Color;

  axes?: [Axis, Axis];
  normalAxisPosition?: number;

  outline?: boolean;
  outlineWidth?: "px" | number;
  outlineColor?: Color;
}

export function Area({
  shape,
  color,
  axes: [axis1, axis2] = ["x", "y"],
  normalAxisPosition = 0,
  outline = true,
  outlineWidth = 3,
  outlineColor = color,
}: AreaProps) {
  const { scale, position, rotation } = useWorldCoordinateTransformation();

  if (axis1 === axis2) {
    throw new Error(
      `Area \`axes\` must be different (got ["${axis1}", "${axis2}"]).`
    );
  }

  const normalAxis = ["x", "y", "z"].find(
    (axis) => axis !== axis1 && axis !== axis2
  ) as Axis;

  let outlinePoints: Float32Array | undefined = useMemo(() => {
    if (!outline) return undefined;

    const points = shape.getPoints();
    const outlinePoints = new Float32Array(points.length * 3);
    const axisIndices = [axis1, axis2].map((axis) =>
      ["x", "y", "z"].indexOf(axis)
    );
    for (let i = 0; i < points.length; i++) {
      outlinePoints[i * 3 + axisIndices[0]] = points[i].x;
      outlinePoints[i * 3 + axisIndices[1]] = points[i].y;
      outlinePoints[i * 3 + ["x", "y", "z"].indexOf(normalAxis)] =
        normalAxisPosition;
    }
    return outlinePoints;
  }, [shape, outline, axis1, axis2, normalAxis, normalAxisPosition]);

  const translation = new Vector3(
    normalAxis === "x" ? normalAxisPosition : 0,
    normalAxis === "y" ? normalAxisPosition : 0,
    normalAxis === "z" ? normalAxisPosition : 0
  );

  return (
    <>
      <group scale={scale} position={position} rotation={rotation}>
        <mesh
          rotation={
            axis1 === "y" && axis2 === "x"
              ? new Euler(Math.PI, Math.PI / 2, 0, "YXZ")
              : new Euler(
                  axis2 === "z" ? Math.PI / 2 : 0,
                  (axis1 === "y" ? Math.PI / 2 : 0) +
                    (axis2 === "x" ? Math.PI / 2 : 0) *
                      (axis1 === "z" ? -1 : 1),
                  axis1 === "z" ? Math.PI / 2 : 0
                )
          }
          position={translation}
        >
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial
            color={getColor(color)}
            opacity={0.5}
            transparent={true}
            side={DoubleSide}
          />
        </mesh>
      </group>
      {outlinePoints && (
        <Contour
          points={outlinePoints}
          color={outlineColor}
          width={outlineWidth}
          clippingPlanes={[]}
        />
      )}
    </>
  );
}
