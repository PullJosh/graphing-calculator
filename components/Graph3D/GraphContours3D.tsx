import { useMemo } from "react";
import { extend, Object3DNode, useThree } from "@react-three/fiber";

import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { Plane, Vector2, Vector3 } from "three";

extend({ LineMaterial, LineGeometry, Line2 });
declare module "@react-three/fiber" {
  interface ThreeElements {
    lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
    line2: Object3DNode<Line2, typeof Line2>;
    plane: Object3DNode<Plane, typeof Plane>;
  }
}

interface GraphContours3DProps {
  flatContours: Float64Array;
  color: "red" | "blue";
}

export function GraphContours3D({ flatContours, color }: GraphContours3DProps) {
  const contours = useMemo(() => {
    let contours: number[][] = [];
    let contour: number[] = [];
    for (let i = 0; i < flatContours.length - 1; i += 2) {
      if (flatContours[i] === Infinity || flatContours[i + 1] === Infinity) {
        if (contour.length > 1) {
          contours.push(contour);
        }
        contour = [];
      } else {
        contour.push(flatContours[i], 0, -flatContours[i + 1]);
      }
    }
    return contours;
  }, [flatContours]);

  const { size } = useThree();

  return (
    <>
      {contours.map((contour, i) => (
        <line2 key={JSON.stringify(contour)}>
          <lineGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.setPositions(contour);
            }}
          />
          <lineMaterial
            color={color === "red" ? "rgb(220, 38, 38)" : "rgb(37, 99, 235)"}
            linewidth={3}
            resolution={new Vector2(size.width, size.height)}
            // fog={true}
            clippingPlanes={[
              new Plane(new Vector3(1, 0, 0), 5),
              new Plane(new Vector3(-1, 0, 0), 5),
              new Plane(new Vector3(0, 0, 1), 5),
              new Plane(new Vector3(0, 0, -1), 5),
            ]}
            clipping={true}
          />
        </line2>
      ))}
    </>
  );
}
