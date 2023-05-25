"use client";

import { extend, Object3DNode, useThree } from "@react-three/fiber";

import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { Vector2, Vector3 } from "three";
import { useContext } from "react";
import { Graph3DContext } from "./Graph3D";
import { useClippingPlanes } from "../../hooks/useClippingPlanes";

extend({ LineMaterial, LineGeometry, Line2 });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
    line2: Object3DNode<Line2, typeof Line2>;
  }
}

interface GraphCurve3DProps {
  color: "red" | "blue" | "black";
  positions: Float32Array;
}

export function GraphCurve3D({ positions, color }: GraphCurve3DProps) {
  const viewInfo = useContext(Graph3DContext);
  const window = viewInfo.window.value;
  const windowWorldCoordinates = viewInfo.windowWorldCoordinates.value;

  const scale = new Vector3(
    window[1][0] === window[0][0]
      ? 1
      : (windowWorldCoordinates[1][0] - windowWorldCoordinates[0][0]) /
        (window[1][0] - window[0][0]),
    window[1][2] === window[0][2]
      ? 1
      : (windowWorldCoordinates[1][2] - windowWorldCoordinates[0][2]) /
        (window[1][2] - window[0][2]),
    window[1][1] === window[0][1]
      ? 1
      : (windowWorldCoordinates[1][1] - windowWorldCoordinates[0][1]) /
        (window[1][1] - window[0][1])
  );

  const { size } = useThree();

  const clippingPlanes = useClippingPlanes();

  return (
    <line2 scale={scale}>
      <lineGeometry
        attach="geometry"
        onUpdate={(self) => {
          self.setPositions(positions);
        }}
      />
      <lineMaterial
        attach="material"
        color={
          {
            red: "rgb(220, 38, 38)",
            blue: "rgb(37, 99, 235)",
            black: "rgb(0, 0, 0)",
          }[color]
        }
        linewidth={2}
        resolution={new Vector2(size.width, size.height)}
        clippingPlanes={clippingPlanes}
        clipping={true}
        transparent={true}
        depthTest={false}
        dashed={true}
        dashScale={0.05}
        dashSize={1}
        gapSize={2}
        // depthFunc={GreaterEqualDepth}
      />
    </line2>
  );
}
