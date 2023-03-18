import { extend, Object3DNode, useThree } from "@react-three/fiber";
import { useContext } from "react";
import { Euler, Vector2, Vector3 } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { useClippingPlanes } from "../../hooks/useClippingPlanes";
import { Graph3DContext } from "./Graph3D";

import colors from "tailwindcss/colors";
import { ThemeContext } from "../../pages/_app";

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
  arrows?: boolean;
}

export function GraphGridLine3D({
  x,
  y,
  z,
  color,
  width = 1,
  arrows = false,
}: GraphGridLine3DProps) {
  const { size } = useThree();

  const { window, windowWorldCoordinates, toSceneX, toSceneY, toSceneZ } =
    useContext(Graph3DContext);

  let clippingPlaneAxes = Object.entries({ x, y, z })
    .map(([axis, value]) => (value === null ? axis : null))
    .filter((axis) => axis !== null) as ("x" | "y" | "z")[];
  const clippingPlanes = useClippingPlanes(clippingPlaneAxes);

  const { theme } = useContext(ThemeContext);
  if (!color) {
    color = { light: colors.slate[200], dark: colors.slate[700] }[theme];
  }

  if (x !== null && (x < window.value[0][0] || x > window.value[1][0])) {
    return null;
  }

  if (y !== null && (y < window.value[0][1] || y > window.value[1][1])) {
    return null;
  }

  if (z !== null && (z < window.value[0][2] || z > window.value[1][2])) {
    return null;
  }

  return (
    <>
      <line2>
        <lineGeometry
          attach="geometry"
          onUpdate={(self) => {
            let positions = [
              x === null ? windowWorldCoordinates.value[0][0] : toSceneX(x),
              z === null ? windowWorldCoordinates.value[0][2] : toSceneZ(z),
              y === null ? -windowWorldCoordinates.value[0][1] : -toSceneY(y),
              x === null
                ? windowWorldCoordinates.value[1][0] - (arrows ? 0.04 : 0)
                : toSceneX(x),
              z === null
                ? windowWorldCoordinates.value[1][2] - (arrows ? 0.04 : 0)
                : toSceneZ(z),
              y === null
                ? -windowWorldCoordinates.value[1][1] + (arrows ? 0.04 : 0)
                : -toSceneY(y),
            ];

            self.setPositions(positions);
          }}
        />
        <lineMaterial
          color={color}
          linewidth={width}
          resolution={new Vector2(size.width, size.height)}
          clippingPlanes={clippingPlanes}
        />
      </line2>
      {arrows && (
        <>
          <mesh
            position={
              new Vector3(
                x === null
                  ? windowWorldCoordinates.value[1][0] - 0.04
                  : toSceneX(x),
                z === null
                  ? windowWorldCoordinates.value[1][2] - 0.04
                  : toSceneZ(z),
                y === null
                  ? -windowWorldCoordinates.value[1][1] + 0.04
                  : -toSceneY(y)
              )
            }
            rotation={
              new Euler(
                y === null ? -Math.PI / 2 : 0,
                0,
                x === null ? -Math.PI / 2 : 0
              )
            }
          >
            <coneGeometry args={[0.03, 0.08, 20]} />
            <meshBasicMaterial color={color} clippingPlanes={clippingPlanes} />
          </mesh>
        </>
      )}
    </>
  );
}
