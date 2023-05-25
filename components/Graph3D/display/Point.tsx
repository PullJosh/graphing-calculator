"use client";

import { Vector3 } from "three";
import { useWorldCoordinateTransformation } from "../../../hooks/useWorldCoordinateTransformation";
import { getColor } from "../../../utils/tailwindColors";

interface PointProps {
  point: Vector3;
}

export function Point({ point }: PointProps) {
  const { position, rotation, scale } = useWorldCoordinateTransformation();

  const inverseScale = new Vector3(1 / scale.x, 1 / scale.y, 1 / scale.z);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={point} scale={inverseScale}>
        <sphereGeometry args={[0.04]} />
        <meshBasicMaterial color={getColor("red")} />
      </mesh>
    </group>
  );
}
