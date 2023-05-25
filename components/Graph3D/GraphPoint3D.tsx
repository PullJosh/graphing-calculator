"use client";

import { useContext } from "react";
import { Vector3 } from "three";
import { Graph3DContext } from "./Graph3D";

interface GraphPoint3DProps {
  x: number;
  y: number;
  z: number;
}

export function GraphPoint3D({ x, y, z }: GraphPoint3DProps) {
  const { toSceneX, toSceneY, toSceneZ } = useContext(Graph3DContext);

  return (
    <mesh position={new Vector3(toSceneX(x), toSceneZ(z), -toSceneY(y))}>
      <sphereGeometry args={[0.05, 32, 32]} />
      <meshBasicMaterial color="red" opacity={0.4} transparent={true} />
    </mesh>
  );
}
