import { extend, Object3DNode, useThree } from "@react-three/fiber";
import { useContext } from "react";
import { Vector2 } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { Graph3DContext } from "./Graph3D";

extend({ LineMaterial, LineGeometry, Line2 });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
    line2: Object3DNode<Line2, typeof Line2>;
  }
}

interface GraphGridLine3DProps {
  x: number | null;
  y: number | null;
  z: number | null;

  color?: string;
  width?: number;
}

export function GraphGridLine3D({
  x,
  y,
  z,
  color = "#e2e8f0",
  width = 1,
}: GraphGridLine3DProps) {
  const { size } = useThree();

  const { toSceneX, toSceneY, toSceneZ, windowWorldCoordinates } =
    useContext(Graph3DContext);

  return (
    <line2>
      <lineGeometry
        attach="geometry"
        onUpdate={(self) => {
          let positions = [
            x === null ? windowWorldCoordinates.value[0][0] : toSceneX(x),
            z === null ? windowWorldCoordinates.value[0][2] : toSceneZ(z),
            y === null ? -windowWorldCoordinates.value[0][1] : -toSceneY(y),
            x === null ? windowWorldCoordinates.value[1][0] : toSceneX(x),
            z === null ? windowWorldCoordinates.value[1][2] : toSceneZ(z),
            y === null ? -windowWorldCoordinates.value[1][1] : -toSceneY(y),
          ];

          self.setPositions(positions);
        }}
      />
      <lineMaterial
        color={color}
        linewidth={width}
        resolution={new Vector2(size.width, size.height)}
      />
    </line2>
  );
}
